"""Local dev server for the photography site + admin panel.

Single static file server with extra admin routes guarded by a token:

  GET  /                    -> index.html (the site)
  GET  /admin               -> admin.html
  GET  /admin/data          -> JSON: photos + categories + tag counts (token)
  POST /admin/upload?name=.. -> save one image into photos/ (token)
  POST /admin/meta          -> JSON body: replace photos.meta.json + rebuild (token)
  POST /admin/build         -> run the photo build + emit js/photos.js (token)
   POST /admin/push          -> git add, commit + push to main (Pages auto-publishes)

Token: env ADMIN_TOKEN (default "" = open on localhost). Send as ?token= or X-Admin-Token.
Pushing to main triggers the GitHub Pages workflow (no tokens needed locally).
"""

from __future__ import annotations

import contextlib
import hmac
import io
import json
import mimetypes
import os
import queue
import re
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))

import build_photos

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
MAX_BODY = 500 * 1024 * 1024
IMAGE_EXT = {".jpg", ".jpeg"}
ALLOWED_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]*")

PHOTOS_DIR_FILE = ROOT / ".photos_dir"


def get_photos_dir() -> Path:
    """Same resolution as build_photos.get_photos_dir(): PHOTOS_DIR env > .photos_dir file > photos/."""
    env = os.environ.get("PHOTOS_DIR", "").strip()
    if env:
        p = Path(env).expanduser()
        if not p.is_absolute():
            p = (ROOT / p).resolve()
        return p
    if PHOTOS_DIR_FILE.is_file():
        raw = PHOTOS_DIR_FILE.read_text(encoding="utf-8").strip()
        if raw:
            p = Path(raw).expanduser()
            if not p.is_absolute():
                p = (ROOT / p).resolve()
            return p
    return ROOT / "photos"


def get_photos_dir_display() -> str:
    """User-friendly display: relative if inside ROOT, else absolute; with source hint."""
    p = get_photos_dir()
    try:
        rel = p.relative_to(ROOT)
        return rel.as_posix()
    except ValueError:
        return str(p)


# Files that must never be published to the public site
DEPLOY_SKIP = {
    "admin.html", "admin.css", "admin.js",
    "photos.meta.json", "site.meta.json",
    "secret.txt", "netlify.json",
    ".photos_dir",
    "serve.py", "pixi.toml", "pixi.lock",
    "AGENTS.md", "CONTRIBUTING.md", "LICENSE.md",
    "deploy.zip",
    "serve.log",
}
DEPLOY_SKIP_DIRS = {"photos", "tools", ".pixi", ".git", "node_modules"}


def collect_deploy_files() -> list[str]:
    """Return deployable relative paths (no leading ./, no excluded)."""
    # dynamic skip for custom photos dir inside ROOT
    skip_dirs = set(DEPLOY_SKIP_DIRS)
    try:
        pd = get_photos_dir().resolve()
        if str(pd).startswith(str(ROOT.resolve())) and pd != ROOT:
            rel_pd = pd.relative_to(ROOT.resolve()).as_posix().split("/")[0]
            skip_dirs.add(rel_pd)
    except Exception:
        pass
    out: list[str] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_root = os.path.relpath(dirpath, ROOT).replace("\\", "/")
        if rel_root == ".":
            rel_root = ""
        # prune before recursing
        dirnames[:] = [d for d in dirnames if not d.startswith(".") and d not in skip_dirs and not d.startswith(".")]
        # skip entirely if this dir is excluded
        if rel_root:
            top = rel_root.split("/")[0]
            if top in skip_dirs:
                continue
        for f in filenames:
            if f.startswith(".") or f in DEPLOY_SKIP:
                continue
            rel_file = f"{rel_root}/{f}" if rel_root else f
            # skip any tools/ path (belt & suspenders)
            if rel_file.startswith("tools/"):
                continue
            # need the file to actually exist under ROOT
            if not (ROOT / rel_file).is_file():
                continue
            out.append(rel_file)
    return out


def safe_name(raw: str) -> str | None:
    if not raw or "/" in raw or "\\" in raw or ".." in raw:
        return None
    name = Path(raw).name
    if not ALLOWED_NAME.fullmatch(name):
        return None
    if Path(name).suffix.lower() not in IMAGE_EXT:
        return None
    return name


def valid_token(given: str | None, header: str | None) -> bool:
    if not ADMIN_TOKEN:
        return True
    candidate = given or header
    return bool(candidate) and hmac.compare_digest(candidate, ADMIN_TOKEN)


def run_build() -> tuple[str, int]:
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        sys.argv = ["build_photos", "--site"]
        rc = build_photos.main()
    return buf.getvalue(), rc


def run_build_with_args(args: dict) -> tuple[str, int]:
    cmd = ["build_photos", "--site"]
    if args.get("force"):
        cmd.append("--force")
    if args.get("no_watermark"):
        cmd.append("--no-watermark")
    if args.get("watermark"):
        cmd.extend(["--watermark", str(args["watermark"])])
    if args.get("watermark_size") is not None:
        cmd.extend(["--watermark-size", str(args["watermark_size"])])
    if args.get("watermark_pos"):
        cmd.extend(["--watermark-pos", str(args["watermark_pos"])])
    if args.get("watermark_opacity") is not None:
        cmd.extend(["--watermark-opacity", str(args["watermark_opacity"])])
    if args.get("watermark_color"):
        cmd.extend(["--watermark-color", str(args["watermark_color"])])
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        sys.argv = cmd
        rc = build_photos.main()
    return buf.getvalue(), rc


class Handler(BaseHTTPRequestHandler):
    server_version = "PhotoServer/0.1"

    def log_message(self, fmt, *args):
        pass

    def _send(self, data: bytes, ctype: str, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def _json(self, obj, status: int = 200):
        self._send(json.dumps(obj).encode("utf-8"), "application/json; charset=utf-8", status)

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            raise ValueError("payload too large")
        return self.rfile.read(length) if length else b""

    def _token(self, parsed) -> str | None:
        return (parse_qs(parsed.query).get("token") or [None])[0]

    def _authorized(self, parsed) -> bool:
        return valid_token(self._token(parsed), self.headers.get("X-Admin-Token"))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path in ("/", "/index.html"):
            return self._serve_file(ROOT / "index.html")
        if path in ("/admin", "/admin.html", "/admin/index.html"):
            if not self._authorized(parsed):
                return self._json({"error": "unauthorized"}, 401)
            return self._serve_file(ROOT / "admin.html")
        if path == "/admin/data":
            if not self._authorized(parsed):
                return self._json({"error": "unauthorized"}, 401)
            return self._json(self._admin_data())
        if path == "/admin/site":
            if not self._authorized(parsed):
                return self._json({"error": "unauthorized"}, 401)
            return self._json(build_photos.load_site_meta())
        if path == "/admin/photos-dir":
            if not self._authorized(parsed):
                return self._json({"error": "unauthorized"}, 401)
            p = get_photos_dir()
            return self._json({"path": get_photos_dir_display(), "absolute": str(p.resolve()), "exists": p.is_dir()})
        if path.startswith("/admin/"):
            return self._json({"error": "not found"}, 404)
        self._serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if not self._authorized(parsed):
            return self._json({"error": "unauthorized"}, 401)
        try:
            body = self._read_body()
        except ValueError as e:
            return self._json({"error": str(e)}, 413)

        if path == "/admin/photos-dir":
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
            except (ValueError, UnicodeDecodeError):
                return self._json({"error": "invalid JSON"}, 400)
            raw = (payload.get("path") or "").strip()
            if not raw:
                # reset to default
                if PHOTOS_DIR_FILE.is_file():
                    PHOTOS_DIR_FILE.unlink()
                print("[admin] photos dir reset to photos/")
                return self._json({"ok": True, "path": "photos"})
            # validate: not empty, no null bytes, not traversing to ROOT parent weirdness allowed but must be absolute or relative
            p = Path(raw).expanduser()
            if not p.is_absolute():
                p = (ROOT / p).resolve()
            else:
                p = p.resolve()
            # ensure not ROOT itself
            if p == ROOT.resolve():
                return self._json({"error": "photos folder cannot be the site root"}, 400)
            # create if not exists
            try:
                p.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                return self._json({"error": f"cannot create folder: {e}"}, 400)
            # persist as user typed (keep relative if they typed relative)
            PHOTOS_DIR_FILE.write_text(raw + "\n", encoding="utf-8")
            print(f"[admin] photos dir set to {raw} -> {p}")
            return self._json({"ok": True, "path": raw, "absolute": str(p)})

        if path == "/admin/upload":
            name = safe_name((parse_qs(parsed.query).get("name") or [""])[0])
            if not name:
                return self._json({"error": "invalid filename"}, 400)
            if not body:
                return self._json({"error": "empty body"}, 400)
            photos_dir = get_photos_dir()
            photos_dir.mkdir(parents=True, exist_ok=True)
            (photos_dir / name).write_bytes(body)
            print(f"[admin] uploaded {name} -> {photos_dir}")
            return self._json({"ok": True, "file": name})

        if path == "/admin/meta":
            try:
                payload = json.loads(body.decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self._json({"error": "invalid JSON"}, 400)
            result = self._validate_meta(payload)
            if isinstance(result, str):
                return self._json({"error": result}, 400)
            photos, cats = result
            meta = build_photos.load_meta()
            if cats is not None:
                meta["categories"] = cats
            meta["photos"] = photos
            build_photos.save_meta(meta)
            log, rc = run_build()
            print(f"[admin] meta saved ({len(photos)} photos), build rc={rc}")
            return self._json({"ok": True, "log": log, "rc": rc})

        if path == "/admin/site":
            try:
                payload = json.loads(body.decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self._json({"error": "invalid JSON"}, 400)
            if not isinstance(payload, dict):
                return self._json({"error": "expected object"}, 400)
            build_photos.save_site_meta(payload)
            build_photos.build_site_js()
            print("[admin] site content saved")
            return self._json({"ok": True})

        if path == "/admin/build":
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
            except (ValueError, UnicodeDecodeError):
                return self._json({"error": "invalid JSON"}, 400)
            return self._handle_build_stream(payload)

        if path == "/admin/push":
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
            except (ValueError, UnicodeDecodeError):
                payload = {}
            msg = payload.get("message") if isinstance(payload, dict) else ""
            return self._handle_push(str(msg or ""))

        if path == "/admin/delete":
            name = safe_name((parse_qs(parsed.query).get("name") or [""])[0])
            if not name:
                return self._json({"error": "invalid filename"}, 400)
            src = get_photos_dir() / name
            if not src.is_file():
                return self._json({"error": "not found"}, 404)
            src.unlink()
            for out in (ROOT / "images" / "web" / name, ROOT / "images" / "thumbs" / name):
                if out.is_file():
                    out.unlink()
                # also webp variants
                webp = out.with_suffix(".webp")
                if webp.is_file():
                    webp.unlink()
            log, rc = run_build()
            print(f"[admin] deleted {name}, build rc={rc}")
            return self._json({"ok": True, "log": log, "rc": rc})

        self._json({"error": "not found"}, 404)

    def _handle_push(self, message: str):
        """git add -A, commit when needed, push origin main. Pages publishes from the push."""
        log: list[str] = []

        def run(*args: str):
            p = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, timeout=180)
            out = (p.stdout + p.stderr).strip()
            log.append(f"$ git {' '.join(args)}\n{out}" if out else f"$ git {' '.join(args)}")
            return p

        if run("add", "-A").returncode != 0:
            return self._json({"ok": False, "log": "\n".join(log)}, 500)
        committed = False
        if run("diff", "--cached", "--quiet").returncode != 0:
            msg = (message or "update from admin").strip()[:200] or "update from admin"
            if run("commit", "-m", msg).returncode != 0:
                return self._json({"ok": False, "log": "\n".join(log)}, 500)
            committed = True
        if run("push", "origin", "main").returncode != 0:
            return self._json({"ok": False, "committed": committed, "log": "\n".join(log)}, 500)
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT,
                             capture_output=True, text=True, timeout=30).stdout.strip()
        print(f"[admin] push ok committed={committed} {sha}")
        return self._json({"ok": True, "committed": committed, "commit": sha, "log": "\n".join(log)})

    def _handle_build_stream(self, args: dict):
        """Run build_photos with streaming logs and progress markers."""
        q: queue.Queue[str | None] = queue.Queue()
        rc_holder = {"rc": 1}

        def log_fn(msg: str):
            q.put(msg + "\n")
            print(msg)

        def worker():
            # Build argv for build_photos.main
            argv = ["build_photos", "--site"]
            if args.get("force"):
                argv.append("--force")
            if args.get("no_watermark"):
                argv.append("--no-watermark")
            if args.get("watermark"):
                argv.extend(["--watermark", str(args["watermark"])])
            if args.get("watermark_size") is not None:
                argv.extend(["--watermark-size", str(args["watermark_size"])])
            if args.get("watermark_pos"):
                argv.extend(["--watermark-pos", str(args["watermark_pos"])])
            if args.get("watermark_opacity") is not None:
                argv.extend(["--watermark-opacity", str(args["watermark_opacity"])])
            if args.get("watermark_color"):
                argv.extend(["--watermark-color", str(args["watermark_color"])])
            old_argv = sys.argv
            sys.argv = argv
            try:
                rc = build_photos.main(log_fn=log_fn)
                rc_holder["rc"] = rc
                q.put(f"__BUILD_DONE__ rc={rc}\n")
            except SystemExit as e:
                rc_holder["rc"] = e.code if isinstance(e.code, int) else 1
                q.put(f"__BUILD_DONE__ rc={rc_holder['rc']}\n")
            except Exception as e:
                rc_holder["rc"] = 1
                q.put(f"ERROR: {e}\n")
                q.put(f"__BUILD_DONE__ rc=1\n")
                print(f"[admin] build failed: {e}")
            finally:
                sys.argv = old_argv
                q.put(None)

        t = threading.Thread(target=worker, daemon=True)
        t.start()

        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Transfer-Encoding", "chunked")
        self.end_headers()
        try:
            while True:
                item = q.get()
                if item is None:
                    break
                chunk = item.encode("utf-8")
                self.wfile.write(f"{len(chunk):X}\r\n".encode())
                self.wfile.write(chunk)
                self.wfile.write(b"\r\n")
                self.wfile.flush()
            self.wfile.write(b"0\r\n\r\n")
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        t.join(timeout=1)
        print(f"[admin] build rc={rc_holder['rc']}")

    def _admin_data(self) -> dict:
        meta = build_photos.load_meta()
        photos = meta.get("photos", [])
        cats = meta.get("categories") or list(build_photos.DEFAULT_CATEGORIES)
        counts = {c: 0 for c in cats}
        tags: dict[str, int] = {}
        for p in photos:
            if p.get("category") in counts:
                counts[p["category"]] += 1
            for t in p.get("tags", []):
                tags[t] = tags.get(t, 0) + 1
        # Newest uploads first (file mtime in the photos dir).
        try:
            pdir = get_photos_dir()
            photos = sorted(
                photos,
                key=lambda p: (pdir / str(p.get("file", ""))).stat().st_mtime
                if (pdir / str(p.get("file", ""))).is_file() else 0,
                reverse=True,
            )
        except Exception:
            pass
        return {"photos": photos, "categories": {"values": cats, "counts": counts}, "tags": tags}

    def _validate_meta(self, payload):
        photos = None
        cats = None
        if isinstance(payload, dict):
            cats = payload.get("categories")
            photos = payload.get("photos")
            if not isinstance(cats, list) or not isinstance(photos, list):
                return "expected {categories, photos}"
            seen: list[str] = []
            for c in cats:
                if not isinstance(c, str) or not c.strip():
                    return "invalid category name"
                c = c.strip()
                if c not in seen:
                    seen.append(c)
            cats = seen
        elif isinstance(payload, list):
            photos = payload
        else:
            return "expected an object or list"
        for p in photos:
            if not isinstance(p, dict):
                return "photo entry is not an object"
            if not safe_name(str(p.get("file", ""))):
                return f"invalid file name: {p.get('file')!r}"
            if cats is not None and p.get("category", "") not in cats and p.get("category", "") != "":
                return f"unknown category: {p.get('category')!r}"
            tags = p.get("tags", [])
            if not isinstance(tags, list) or not all(isinstance(t, str) and t.strip() for t in tags):
                return "tags must be a list of strings"
            if not isinstance(p.get("featured", False), bool):
                return "featured must be a boolean"
        return photos, cats

    def _serve_static(self, path: str):
        clean = path.lstrip("/")
        target = (ROOT / clean).resolve()
        if not str(target).startswith(str(ROOT.resolve())) or target == ROOT:
            return self._json({"error": "forbidden"}, 403)
        if target.is_dir():
            target = target / "index.html"
        if not target.is_file():
            return self._json({"error": "not found"}, 404)
        self._serve_file(target)

    def _serve_file(self, target: Path):
        ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        self._send(target.read_bytes(), ctype)


def main() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Site:    http://localhost:{port}/", flush=True)
    print(f"Admin:   http://localhost:{port}/admin", flush=True)
    if ADMIN_TOKEN:
        print(f"Token:   {ADMIN_TOKEN}  (set env ADMIN_TOKEN to change)", flush=True)
    else:
        print("Token:   disabled — admin open on localhost (set env ADMIN_TOKEN to enable)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
