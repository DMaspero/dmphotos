# AGENTS.md

## What this is
Single-page static photography site: plain HTML/CSS/JS, no framework, no build tooling, no tests. All of it lives in `index.html` (text-only hero + gallery with category/tag filters and a lightbox), styled by `css/style.css`, logic in `js/main.js`. The photo manifest `js/photos.js` is **generated** — never edit it by hand.

## Toolchain
- Python 3.12 + Pillow are managed by **pixi** (`pixi.toml`). Install Python packages only via `pixi add <pkg>`.
- Do NOT add npm/other package managers, bundlers, or frameworks unless the user explicitly asks.
- Tasks:
  - `pixi run build` — resize `photos/` → `images/web/` (2048px) + `images/thumbs/` (900px), emit `js/photos.js`. Skips photos whose outputs are already up to date.
  - `pixi run serve` — `tools/serve.py`: static server PLUS the admin panel at http://localhost:8000/admin.

## Admin panel (local tool)
- URL `/admin` on `pixi run serve` (binds to `127.0.0.1`). **No token by default** — it's local-only; set env `ADMIN_TOKEN=<value>` to require one (e.g. if you expose the server). Send it as `?token=` or `X-Admin-Token`.
- Endpoints: `GET /admin/data`, `POST /admin/upload?name=` (raw bytes), `POST /admin/meta` (full photos array → saves meta + rebuilds), `POST /admin/build`, `POST /admin/delete?name=` (removes original + generated images + rebuilds).
- Lets you upload photos (drag & drop), add/rename/delete categories, and edit per-photo tags/featured in the browser instead of hand-editing JSON.
- `tools/serve.py` is stdlib-only; keep it dependency-free.
- **Never deploy the admin with the static site.** Deploy only `index.html`, `css/`, `js/`, `images/` — exclude `admin.html`, `css/admin.css`, `js/admin.js`, `tools/`, `photos/`, `serve.py`.

## Photo workflow
1. Drop originals into `photos/` (or upload via admin).
2. Edit `photos.meta.json` — the source of truth. It holds `categories` (list, default travel | landscape | animals | nightsky | people, editable in admin) and `photos` (per-photo `category`, free-form `tags`, `featured`). The admin panel edits this file for you.
3. `pixi run build` — new files are appended with empty fields (fill them in, rebuild). Existing metadata is never overwritten.

Originals in `photos/` are never served or modified; everything served is generated under `images/`. The site must keep working when opened via `file://` too, so:
- All asset paths are relative.
- `js/photos.js` is plain JS (not fetched JSON) so the page works without a server.
