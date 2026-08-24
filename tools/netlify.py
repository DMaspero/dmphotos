"""Netlify API client — stdlib-only, digest manifest with differential uploads."""

from __future__ import annotations

import concurrent.futures
import hashlib
import json
import re
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path


UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def sha1_of(path: Path) -> str:
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


class NetlifyClient:
    API = "https://api.netlify.com/api/v1"

    def __init__(self, token: str, site_id: str):
        if not token or not token.strip():
            raise ValueError("NETLIFY_AUTH_TOKEN missing — set in secret.txt")
        if not UUID_RE.match(site_id.strip()):
            raise ValueError(f"SITE_UUID must be a UUID, got: {site_id!r}")
        self.token = token.strip()
        self.site_id = site_id.strip()

    def _api(self, method, path, body=None):
        url = f"{self.API}{path}"
        headers = {"Authorization": f"Bearer {self.token}"}
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{e.code}: {err}") from e

    def list_files(self) -> list[str]:
        """Return remote file paths (with leading /) for current deploy."""
        # Try /sites/{id}/files first
        try:
            data = self._api("GET", f"/sites/{self.site_id}/files")
            if isinstance(data, list):
                out = []
                for entry in data:
                    p = entry.get("path") or entry.get("file") or ""
                    if p:
                        out.append(p if p.startswith("/") else "/" + p)
                if out:
                    return out
        except RuntimeError:
            pass
        # Fallback via latest deploy
        try:
            deploys = self._api("GET", f"/sites/{self.site_id}/deploys?per_page=1")
            if isinstance(deploys, list) and deploys:
                did = deploys[0].get("id")
                if did:
                    try:
                        files = self._api("GET", f"/deploys/{did}/files")
                        if isinstance(files, list):
                            return [("/" + f.strip("/")) for f in files if isinstance(f, str)]
                        if isinstance(files, dict):
                            return ["/" + k.strip("/") for k in files.keys()]
                    except RuntimeError:
                        pass
        except RuntimeError:
            pass
        return []

    def get_site_url(self) -> str:
        try:
            info = self._api("GET", f"/sites/{self.site_id}")
            return (info.get("ssl_url") or info.get("url") or "").rstrip("/")
        except RuntimeError:
            return ""

    def download_file(self, remote_path: str, dest: Path):
        """Download a single remote file to dest (via site URL or API)."""
        # remote_path with leading /
        dest.parent.mkdir(parents=True, exist_ok=True)
        site_url = self.get_site_url()
        # Try site URL first (public, no API rate limit)
        if site_url:
            url = site_url + remote_path
            try:
                with urllib.request.urlopen(url, timeout=30) as r:
                    data = r.read()
                    # Netlify returns 404 html for missing — check content-type and size
                    if r.status == 200 and len(data) > 0:
                        # crude check: if it looks like HTML 404 and remote_path is image, skip
                        ctype = r.headers.get("Content-Type", "")
                        if "text/html" in ctype and remote_path.startswith("/images/"):
                            raise RuntimeError("HTML response for image")
                        dest.write_bytes(data)
                        return
            except Exception:
                pass
        # Fallback: API download via deploy file endpoint — try direct file fetch
        # GET /sites/{site_id}/files/{path} is not standard; try raw fetch via api
        for prefix in [f"/sites/{self.site_id}/files{remote_path}", f"/deploys"]:
            pass
        # Last resort: fetch via API raw (may 404)
        req = urllib.request.Request(
            f"{self.API}/sites/{self.site_id}/files{remote_path}",
            headers={"Authorization": f"Bearer {self.token}"},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            dest.write_bytes(r.read())

    def deploy(self, local_dir: str, log_fn=None):
        if log_fn is None:
            log_fn = lambda msg: None
        lock = threading.Lock()

        def log(msg):
            with lock:
                log_fn(msg)

        local_dir = Path(local_dir)
        log("Collecting files…")

        manifest: dict[str, str] = {}
        sha_to_rel: dict[str, str] = {}
        rel_to_path: dict[str, Path] = {}
        for root, _dirs, fnames in __import__("os").walk(local_dir):
            for name in fnames:
                fp = Path(root) / name
                rel = "/" + fp.relative_to(local_dir).as_posix()
                sha = sha1_of(fp)
                manifest[rel] = sha
                # keep first path for each sha (duplicates share hash — any file with that hash is fine)
                sha_to_rel.setdefault(sha, rel)
                rel_to_path[rel] = fp

        log(f"Found {len(manifest)} files.")

        # Verify site exists (UUID-only, no auto-create)
        log("Checking site…")
        info = self._api("GET", f"/sites/{self.site_id}")
        log(f"Site: {info.get('name','')} ({info.get('ssl_url') or info.get('url','')})")

        # Create deploy with manifest
        # For <5k files we use async=False so required is returned immediately.
        # async=True is only needed for >54k files / 30s timeout.
        use_async = len(manifest) > 5000
        log(f"Creating deploy ({'async' if use_async else 'sync'})…")
        resp = self._api("POST", f"/sites/{self.site_id}/deploys", {
            "files": manifest,
            **({"async": True} if use_async else {}),
        })
        deploy_id = resp.get("id", "")
        required = set(resp.get("required") or [])
        log(f"Deploy {deploy_id}: {len(required)} files to upload (differential).")
        if required:
            log(f"Rate limits: 500 req/min per-file, 3 deploys/min. Concurrency 5.")

        if not required:
            log("All files up to date — nothing to upload.")
        else:
            def upload_one(file_hash: str):
                rel_path = sha_to_rel.get(file_hash)
                if not rel_path:
                    # shouldn't happen, but skip
                    return
                local_path = rel_to_path.get(rel_path)
                if not local_path or not local_path.is_file():
                    raise RuntimeError(f"Local file missing for {rel_path}")
                content = local_path.read_bytes()
                req = urllib.request.Request(
                    f"{self.API}/deploys/{deploy_id}/files{rel_path}",
                    data=content,
                    headers={
                        "Authorization": f"Bearer {self.token}",
                        "Content-Type": "application/octet-stream",
                    },
                    method="PUT",
                )
                for attempt in range(3):
                    try:
                        with urllib.request.urlopen(req, timeout=60) as r:
                            r.read()
                            remaining = r.headers.get("X-RateLimit-Remaining")
                            if remaining is not None:
                                try:
                                    if int(remaining) < 10:
                                        log(f"  Rate limit low ({remaining} remaining), pausing 2s…")
                                        time.sleep(2)
                                except ValueError:
                                    pass
                        log(f"  Uploaded {rel_path}")
                        return
                    except urllib.error.HTTPError as e:
                        if e.code == 429:
                            retry_after = e.headers.get("Retry-After")
                            try:
                                wait = int(retry_after) if retry_after else 5
                            except ValueError:
                                wait = 5
                            log(f"  429 for {rel_path}, waiting {wait}s (attempt {attempt+1}/3)…")
                            time.sleep(wait)
                            continue
                        err = e.read().decode("utf-8", errors="replace")
                        raise RuntimeError(f"Upload {rel_path} failed ({e.code}): {err}") from e
                raise RuntimeError(f"Upload {rel_path} failed after 3 retries (429)")

            log(f"Uploading {len(required)} files (5 concurrent)…")
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
                futures = [pool.submit(upload_one, h) for h in required]
                for fut in concurrent.futures.as_completed(futures):
                    fut.result()  # propagate error

        log("Deploy submitted!")
        log("Note: 3 deploys/min, 100/day.")

        # Poll for completion — correct endpoint is /deploys/{id}
        log("Waiting for deploy to go live…")
        url_live = ""
        for _ in range(60):
            time.sleep(2)
            try:
                st = self._api("GET", f"/deploys/{deploy_id}")
                state = st.get("state", "unknown")
                if state == "ready":
                    url_live = st.get("ssl_url") or st.get("deploy_ssl_url") or st.get("url") or ""
                    log(f"Deploy live: {url_live} (state=ready)")
                    break
                elif state in ("error", "failed"):
                    msg = st.get("error_message", state)
                    log(f"Deploy failed: {msg}")
                    raise RuntimeError(f"Deploy failed: {msg}")
                # else: uploading / processing / enqueued — keep polling
            except RuntimeError as e:
                # poll error that is deploy failure should bubble, else retry
                if "Deploy failed" in str(e):
                    raise
                # transient poll error — continue
                continue
        else:
            log("Deploy still processing after 120s — check dashboard.")

        return {
            "deploy_id": deploy_id,
            "total_local": len(manifest),
            "required": len(required),
            "uploaded": len(required),
            "url": url_live,
            "state": "ready" if url_live else "processing",
        }
