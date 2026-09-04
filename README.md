# Photography — Static Portfolio

Single-page, no-framework portfolio. Plain `index.html` + `css/style.css` + `js/main.js` + generated `js/photos.js` / `js/site.js`. Originals in `photos/` (configurable, see below) are never served — `pixi run build` resizes to `images/web/` (2048px) + `images/thumbs/` (900px) with WebP, watermark and EXIF.

Live: `https://dmphotos.netlify.app` — GitHub: `https://github.com/DMaspero/dmphotos` (private).

## Requirements

- [Pixi](https://pixi.sh) (manages Python 3.12 + deps, no npm needed)
- Git (for push)

```bash
pixi install   # creates .pixi env (python, pillow, cairosvg, gh)
```

## Pixi tasks

| Command | What it does |
|---|---|
| `pixi run build` | `python tools/build_photos.py --site` — incremental build (skips up-to-date outputs), rebuilds `photos.meta.json` ordering, emits `js/photos.js` + `js/site.js` |
| `pixi run rebuild` | `python tools/build_photos.py --force --site` — forces all images |
| `pixi run serve` | `python tools/serve.py` — static server on `http://localhost:8000` + admin at `/admin` (binds `127.0.0.1`) |
| `pixi run watermark-help` | `python tools/build_photos.py --help` |

`pixi.toml` `dependencies`: `python 3.12.*`, `pillow >=12.3,<13`, `cairosvg >=2.9,<3`, `gh >=2.98`.

Build flags (`tools/build_photos.py`):

```
--force  --photos-dir PATH  --watermark PATH  --watermark-size 0.12  --watermark-pos bottom-center
--watermark-opacity 200  --watermark-color "#FFFFFF"  --no-watermark  --site
```

Positions: `top-left|top-center|top-right|center-left|center|center-right|bottom-left|bottom-center|bottom-right`.

**Photos folder:** `photos/` by default. Override per-device via:
- CLI: `--photos-dir "C:\Cloud\Photos"` or `--photos-dir ../MyPhotos`
- Env: `PHOTOS_DIR="C:\Cloud\Photos" pixi run build`
- File: `.photos_dir` at repo root containing a single path line (git-ignored, per-device — edit in Admin → Photos folder)
- Admin panel → **Photos folder** (preferred — creates `.photos_dir` automatically)

This lets the repo stay sync'd via GitHub/Netlify while raw photos live in a cloud-synced folder (Dropbox/OneDrive/Google Drive) outside the repo.

## Run the site

```bash
pixi run serve
# Site:  http://localhost:8000/
# Admin: http://localhost:8000/admin
```

Works also via `file://` (all paths relative, `js/photos.js` is plain JS not fetch). Watermark is `images/assets/watermark.svg` (vector via cairosvg, color-tintable).

## Photo workflow

1. Drop originals (`.jpg/.jpeg`) into `photos/` (or your configured external folder) or use **Admin → Upload Photos** (writes to the active photos folder, shows banner).
2. `photos.meta.json` is the source of truth (`categories` + per-photo `{file, category, tags[], featured}`); new files are appended with empty fields on next build. Meta stays in the repo root even when photos are external.
3. `pixi run build` → reads from the configured photos folder → outputs to `images/web/` + `images/thumbs/` (JPEG + WebP), preserves EXIF (camera/lens/focal/aperture/shutter/ISO shown in lightbox). If `photos/` is empty, the build prints `No images found in ...` and hints at `--photos-dir`.

Never edit `js/photos.js` or `js/site.js` by hand — they are generated.

## Secrets

Private `secret.txt` at repo root (git-ignored, never deployed):

```
NETLIFY_AUTH_TOKEN='nfp_xxx'
SITE_UUID='89568afc-1e3b-4fea-b447-02c222ab265d'
```

Also read from `env NETLIFY_AUTH_TOKEN` / `SITE_UUID`. Create a Netlify personal token (no expiry) and copy the site **UUID** from Netlify Dashboard → Site settings → General → Site information.

## Admin panel (`/admin`)

Local-only. By default no token (localhost). Set `ADMIN_TOKEN=... pixi run serve` to require `?token=` or `X-Admin-Token`.

Top bar: `Save changes` (saves all category/photo edits via `POST /admin/meta`, triggers rebuild) and `Sync meta`.

#### Photos folder
Exposed at the top of the panel. Shows `Current: /absolute/path (will be created)` and an input for the path (absolute `C:\Cloud\Photos` or relative `photos`). **Save folder** → `POST /admin/photos-dir` writes `.photos_dir` (git-ignored, per-device) and creates the dir; **Reset to default** deletes `.photos_dir` → `photos/`. Also available as `PHOTOS_DIR` env or `--photos-dir` flag for CLI. Uploads/deletes respect this setting; deploy zips exclude the photos folder whether inside or outside the repo.

#### Site Content
`Title` (nav + `<title>`), `Kicker` (hero big uppercase title), `Footer`, `Description` (meta). → **Save site content** (`POST /admin/site` → `site.meta.json` → `js/site.js`).

#### Build
Amber banner `X photos to build — click Build to generate thumbnails` appears after uploads (hidden otherwise). Fields: `Watermark` path, `Size` (0.01–1.0), `Position`, `Opacity` 0–255, `Color tint`, `Force rebuild all`, `No watermark`. **Watermark preview** shows live overlay on first thumb (size/pos/opacity/color). **Build** → `POST /admin/build` (clears the banner on `rc === 0`) streams log to `buildLog`.

#### Upload Photos
Drag & drop or **browse** (`.jpg/.jpeg`). Uploads to `photos/` (`POST /admin/upload?name=`) **without** auto-building — a banner in the Build panel counts `X photos to build`; click **Build** in the Build panel when ready (allows batch uploads before the heavy resize/watermark step).

#### Categories
List of chips with counts. Inline rename (change → enter), `×` to delete (photos become uncategorized). **Add** new (lowercased). Changes are staged until **Save changes**.

#### Photos
`Filter by filename` + category chips (All + per-category). Each card: thumb, `category` select, `tags` (comma-separated, lowercased), `featured` checkbox (drives hero carousel), `Delete photo` (removes original + `images/web|thumbs` + rebuilds via `POST /admin/delete?name=`).

#### Publish to Netlify
`Site UUID (override, optional)` — if empty uses `secret.txt`. **Save site** stores override in `localStorage`.

- **Publish** — `POST /admin/publish` → server reads `secret.txt`, builds digest manifest `{"/path": sha1}` (chunked SHA1), `POST /sites/{id}/deploys` (sync for <5k files, `async:true` only for >5k to avoid 30s timeout), Netlify returns `required` (differential — only changed files), uploads 5 concurrent `PUT /deploys/{id}/files{path}` (handles `429` + `X-RateLimit-Remaining`), polls `GET /deploys/{id}` until `ready`. Logs stream chunked (`text/plain`) to `publishLog`. Rate limits: 3 deploys/min, 100/day, 500 file PUTs/min.
- **Manual upload** — `POST /admin/manual-zip` → lists remote `GET /sites/{id}/files`, downloads any `images/*` missing locally from the live site URL (no API rate cost), then zips `collect_deploy_files()` (excludes `admin.html`, `tools/`, `photos/`, `secret.txt`, etc.) and downloads `deploy.zip` for drag-drop to Netlify Deploys tab. Fallback when API publish fails.

Check server stdout for `Netlify: token from secret.txt, site …` on `pixi run serve`.

## Site features

- Hero carousel: all `featured` photos, larger cards (`360×240`), infinite marquee (paused on hover, scrollable with `prefers-reduced-motion`), click → lightbox.
- Gallery: category pills + tag cloud (filtered by current view), masonry grid with like counts (Firebase Realtime DB, blue `#3b82f6`, local `liked` set), EXIF bar in lightbox, dark mode toggle.

## Project structure

```
index.html  admin.html  css/  js/  images/web|thumbs  photos/  photos.meta.json  site.meta.json
tools/build_photos.py  tools/serve.py  tools/netlify.py  secret.txt  .photos_dir  pixi.toml  favicon.ico  sw.js
```

Deploy **only** `index.html`, `css/`, `js/`, `images/`, `favicon.ico`, `sw.js` — exclude `admin.html`, `css/admin.css`, `js/admin.js`, `tools/`, `photos/` (or custom external folder), `secret.txt`, `.photos_dir`, `.pixi/`, `deploy.zip`.

## Troubleshooting

- `Warning: no embedded PNG…` → now handled via `cairosvg` vector render; install with `pixi add cairosvg`.
- `favicon.ico 404` → generated via Pillow on build.
- `required 0 but state prepared` → was `async:true` on small sites; now sync for <5k files — retry `Publish`.
- `401 unauthorized` on admin → set `ADMIN_TOKEN` correctly or clear `sessionStorage`.
