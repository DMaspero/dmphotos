"""Build web/thumb images from photos/ and generate js/photos.js.

Workflow:
  1. Drop originals into photos/
  2. Edit photos.meta.json (category, tags, featured) as needed
  3. Run `pixi run build`

- Originals in photos/ are never modified or served.
- Output goes to images/web/ and images/thumbs/.
- photos.meta.json is the source of truth for metadata; existing entries are
  never overwritten. New files are appended with empty fields.
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps, ImageDraw, ImageFont
from PIL.ExifTags import TAGS, IFD

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "photos"
WEB_DIR = ROOT / "images" / "web"
THUMB_DIR = ROOT / "images" / "thumbs"
META_FILE = ROOT / "photos.meta.json"
SITE_META_FILE = ROOT / "site.meta.json"
OUT_JS = ROOT / "js" / "photos.js"
OUT_SITE_JS = ROOT / "js" / "site.js"

WEB_MAX = 2048
THUMB_MAX = 900
JPEG_QUALITY = 86
WEBP_QUALITY = 82

DEFAULT_CATEGORIES = ["travel", "landscape", "animals", "nightsky", "people"]

WATERMARK_DEFAULT = ROOT / "images" / "assets" / "watermark.svg"
WATERMARK_SIZE_DEFAULT = 0.12
WATERMARK_POS_DEFAULT = "bottom-center"
WATERMARK_OPACITY_DEFAULT = 200
WATERMARK_COLOR_DEFAULT = None  # None = keep original colors


def load_meta() -> dict:
    if META_FILE.exists():
        meta = json.loads(META_FILE.read_text(encoding="utf-8"))
    else:
        meta = {"photos": []}
    meta.setdefault("categories", list(DEFAULT_CATEGORIES))
    return meta


def save_meta(meta: dict) -> None:
    META_FILE.write_text(
        json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def load_site_meta() -> dict:
    if SITE_META_FILE.exists():
        return json.loads(SITE_META_FILE.read_text(encoding="utf-8"))
    return {
        "title": "Photography",
        "kicker": "Selected photographs",
        "footer": "Photography",
        "description": "A curated selection of photographs.",
    }


def save_site_meta(data: dict) -> None:
    SITE_META_FILE.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def build_site_js() -> None:
    """Generate js/site.js from site.meta.json."""
    data = load_site_meta()
    OUT_SITE_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_SITE_JS.write_text(
        "const SITE = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )


def source_images() -> list[Path]:
    exts = {".jpg", ".jpeg"}
    return sorted(p for p in SRC_DIR.iterdir() if p.suffix.lower() in exts)


def extract_exif(src: Path) -> dict:
    """Extract camera, lens, and shot settings from EXIF."""
    info = {}
    try:
        with Image.open(src) as im:
            exif = im.getexif()
            if not exif:
                return info

            # Basic tags from main IFD
            make = exif.get(271, "").strip()
            model = exif.get(272, "").strip()
            if model:
                info["camera"] = model.replace(make, "").strip() if make in model else model

            # Tags from Exif IFD
            try:
                exif_ifd = exif.get_ifd(IFD.Exif)
            except Exception:
                exif_ifd = {}

            # Lens
            lens = exif_ifd.get(42036, "")
            if lens:
                info["lens"] = str(lens).strip()

            # Focal length
            focal = exif_ifd.get(37386)
            if focal:
                info["focal"] = str(round(float(focal))) + "mm"

            # Aperture
            fnum = exif_ifd.get(33437)
            if fnum:
                info["aperture"] = "f/" + str(round(float(fnum), 1))

            # Shutter speed
            exposure = exif_ifd.get(33434)
            if exposure:
                exposure = float(exposure)
                if exposure >= 1:
                    info["shutter"] = str(round(exposure)) + "s"
                else:
                    info["shutter"] = "1/" + str(round(1 / exposure)) + "s"

            # ISO
            iso = exif_ifd.get(34855)
            if iso:
                info["iso"] = "ISO " + str(int(iso))

    except Exception:
        pass
    return info


def is_fresh(src: Path, out: Path) -> bool:
    return out.exists() and out.stat().st_mtime >= src.stat().st_mtime


def load_watermark_image(path: Path, color: str | None = None) -> Image.Image | None:
    """Load the watermark: embedded PNG in SVG, vector SVG via cairosvg, or PNG/JPG directly."""
    if not path.exists():
        print(f"Warning: watermark not found at {path}, skipping.")
        return None
    if path.suffix.lower() == ".svg":
        svg_text = path.read_text(encoding="utf-8")
        # Try embedded PNG first
        match = re.search(r'xlink:href="data:image/png;base64,([^"]+)"', svg_text)
        if match:
            png_data = base64.b64decode(match.group(1))
            from io import BytesIO
            return Image.open(BytesIO(png_data)).convert("RGBA")
        # Try rendering vector SVG with cairosvg
        try:
            import cairosvg
            # Apply color tint if specified
            render_svg = svg_text
            if color:
                import re as _re
                render_svg = _re.sub(r'<path\b', f'<path fill="{color}"', render_svg)
                render_svg = _re.sub(r'<svg\b([^>]*)>', f'<svg\\1 fill="{color}">', render_svg)
            png_data = cairosvg.svg2png(bytestring=render_svg.encode("utf-8"), output_width=800)
            from io import BytesIO
            return Image.open(BytesIO(png_data)).convert("RGBA")
        except ImportError:
            print("Warning: cairosvg not installed, cannot render vector SVG watermark.")
            print("  Install with: pixi add cairosvg")
            return None
        except Exception as e:
            print(f"Warning: failed to render SVG watermark: {e}")
            return None
    return Image.open(path).convert("RGBA")


def parse_position(pos: str, w: int, h: int, wm_w: int, wm_h: int, margin: int) -> tuple[int, int]:
    """Convert a position string like 'bottom-center' to (x, y) coordinates."""
    positions = {
        "top-left":      (margin, margin),
        "top-center":    ((w - wm_w) // 2, margin),
        "top-right":     (w - wm_w - margin, margin),
        "center-left":   (margin, (h - wm_h) // 2),
        "center":        ((w - wm_w) // 2, (h - wm_h) // 2),
        "center-right":  (w - wm_w - margin, (h - wm_h) // 2),
        "bottom-left":   (margin, h - wm_h - margin),
        "bottom-center": ((w - wm_w) // 2, h - wm_h - margin),
        "bottom-right":  (w - wm_w - margin, h - wm_h - margin),
    }
    return positions.get(pos, positions["bottom-center"])


def add_watermark(im: Image.Image, wm_img: Image.Image, size: float, pos: str,
                   opacity: int, color: str | None = None) -> Image.Image:
    """Overlay the watermark image on the photo."""
    if wm_img is None:
        return im

    im = im.convert("RGBA")
    w, h = im.size

    wm_w = int(w * size)
    wm_h = int(wm_img.height * (wm_w / wm_img.width))
    wm = wm_img.resize((wm_w, wm_h), Image.LANCZOS)

    # Apply color tint if specified
    if color:
        r, g, b = tuple(int(color.lstrip("#")[i:i+2], 16) for i in (0, 2, 4))
        solid = Image.new("RGBA", wm.size, (r, g, b, 255))
        # Use the original alpha channel as mask
        alpha = wm.split()[3]
        solid.putalpha(alpha)
        wm = solid

    # Apply opacity
    alpha = wm.split()[3]
    alpha = alpha.point(lambda p: int(p * opacity / 255))
    wm.putalpha(alpha)

    margin = int(w * 0.02)
    x, y = parse_position(pos, w, h, wm_w, wm_h, margin)

    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    overlay.paste(wm, (x, y))

    return Image.alpha_composite(im, overlay).convert("RGB")


def process_image(src: Path, max_dim: int, out: Path, progressive: bool,
                   wm_img=None, wm_size=WATERMARK_SIZE_DEFAULT,
                   wm_pos=WATERMARK_POS_DEFAULT, wm_opacity=WATERMARK_OPACITY_DEFAULT,
                   wm_color: str | None = WATERMARK_COLOR_DEFAULT) -> tuple[int, int]:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        im.thumbnail((max_dim, max_dim), Image.LANCZOS)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        im = add_watermark(im, wm_img, wm_size, wm_pos, wm_opacity, wm_color)
        im.save(
            out,
            "JPEG",
            quality=JPEG_QUALITY,
            optimize=True,
            progressive=progressive,
        )
        webp_out = out.with_suffix(".webp")
        im.save(webp_out, "WEBP", quality=WEBP_QUALITY, method=4)
        return im.size


def main() -> int:
    parser = argparse.ArgumentParser(description="Build web/thumb images from photos/")
    parser.add_argument("--force", action="store_true", help="Rebuild all images even if up to date")
    parser.add_argument("--watermark", type=Path, default=WATERMARK_DEFAULT,
                        help="Path to watermark image (PNG, JPG, or SVG with embedded PNG)")
    parser.add_argument("--watermark-size", type=float, default=WATERMARK_SIZE_DEFAULT,
                        help="Watermark width as fraction of image width (default: 0.12)")
    parser.add_argument("--watermark-pos", default=WATERMARK_POS_DEFAULT,
                        choices=["top-left", "top-center", "top-right",
                                 "center-left", "center", "center-right",
                                 "bottom-left", "bottom-center", "bottom-right"],
                        help="Watermark position (default: bottom-center)")
    parser.add_argument("--watermark-opacity", type=int, default=WATERMARK_OPACITY_DEFAULT,
                        help="Watermark opacity 0-255 (default: 200)")
    parser.add_argument("--watermark-color", default=WATERMARK_COLOR_DEFAULT,
                        help="Tint watermark with a color, e.g. '#FFFFFF' or 'white' (default: original colors)")
    parser.add_argument("--no-watermark", action="store_true", help="Skip watermark entirely")
    parser.add_argument("--site", action="store_true", help="Also build js/site.js from site.meta.json")
    args = parser.parse_args()

    # Always build site.js if --site is passed
    if args.site:
        build_site_js()

    wm_img = None if args.no_watermark else load_watermark_image(args.watermark, args.watermark_color)

    srcs = source_images()
    if not srcs:
        print("No images found in photos/")
        return 1

    WEB_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

    meta = load_meta()
    by_file = {p["file"]: p for p in meta["photos"]}
    cats = meta.get("categories") or list(DEFAULT_CATEGORIES)

    photos = []
    for src in srcs:
        name = src.name
        entry = by_file.get(name, {"file": name, "category": "", "tags": []})
        if entry["category"] not in cats:
            entry["category"] = ""

        web_path = WEB_DIR / name
        thumb_path = THUMB_DIR / name
        webp_web = WEB_DIR / (Path(name).stem + ".webp")
        webp_thumb = THUMB_DIR / (Path(name).stem + ".webp")
        if not args.force and is_fresh(src, web_path) and is_fresh(src, thumb_path) and webp_web.exists():
            with Image.open(web_path) as im:
                w, h = im.size
        else:
            w, h = process_image(src, WEB_MAX, web_path, progressive=True,
                                 wm_img=wm_img, wm_size=args.watermark_size,
                                 wm_pos=args.watermark_pos, wm_opacity=args.watermark_opacity,
                                 wm_color=args.watermark_color)
            process_image(src, THUMB_MAX, thumb_path, progressive=False,
                          wm_img=wm_img, wm_size=args.watermark_size,
                          wm_pos=args.watermark_pos, wm_opacity=args.watermark_opacity,
                          wm_color=args.watermark_color)

        exif_data = extract_exif(src)

        photos.append(
            {
                "file": name,
                "src": f"images/web/{name}",
                "srcWebp": f"images/web/{Path(name).stem}.webp",
                "thumb": f"images/thumbs/{name}",
                "thumbWebp": f"images/thumbs/{Path(name).stem}.webp",
                "w": w,
                "h": h,
                "category": entry.get("category", ""),
                "tags": entry.get("tags", []),
                "featured": bool(entry.get("featured", False)),
                "exif": exif_data or None,
            }
        )

    # Rebuild meta entries from the merged dict, preserving order of srcs.
    merged = []
    for src in srcs:
        name = src.name
        entry = by_file.get(name, {"file": name, "category": "", "tags": []})
        merged.append(
            {
                "file": name,
                "category": entry.get("category", ""),
                "tags": entry.get("tags", []),
                "featured": bool(entry.get("featured", False)),
            }
        )
    meta["photos"] = merged
    save_meta(meta)

    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(
        "const CATEGORIES = "
        + json.dumps(cats, ensure_ascii=False)
        + ";\n"
        + "const PHOTOS = "
        + json.dumps(photos, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    print(f"Processed {len(photos)} photos -> images/web, images/thumbs, js/photos.js")
    return 0


if __name__ == "__main__":
    sys.exit(main())
