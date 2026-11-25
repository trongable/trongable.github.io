"""Generate 640px calibrated sRGB WebP thumbnails for all gallery photos.

Usage:
    npm run gallery:thumbnails
    # or: python scripts/generate-gallery-thumbnails.py
"""

from __future__ import annotations

import io
import os
import re
from pathlib import Path
from PIL import Image, ImageCms, ImageOps

REPO_ROOT = Path(__file__).resolve().parent.parent
GALLERY_DIR = REPO_ROOT / "public" / "images" / "gallery"
THUMBNAILS_DIR = GALLERY_DIR / "thumbnails"
GALLERY_DATA_PATH = REPO_ROOT / "src" / "components" / "gallery" / "galleryData.ts"
SUPPORTED_EXTS = {".jpg", ".jpeg", ".png"}
MAX_THUMB_SIZE = (640, 640)


def convert_to_srgb(im: Image.Image) -> tuple[Image.Image, str]:
    """Convert any embedded ICC profile (e.g. Display P3) into calibrated sRGB."""
    im = ImageOps.exif_transpose(im)
    icc = im.info.get("icc_profile")
    srgb_profile = ImageCms.createProfile("sRGB")

    if icc:
        try:
            input_profile = ImageCms.getOpenProfile(io.BytesIO(icc))
            profile_name = ImageCms.getProfileName(input_profile).strip()
            converted = ImageCms.profileToProfile(
                im, input_profile, srgb_profile, outputMode="RGB"
            )
            return converted, f"{profile_name} -> sRGB"
        except Exception as exc:  # noqa: BLE001
            print(f"  [warn] ICC conversion skipped ({exc}); falling back to RGB")

    if im.mode != "RGB":
        im = im.convert("RGB")
    return im, "RGB"


def main() -> None:
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    gallery_data_text = (
        GALLERY_DATA_PATH.read_text(encoding="utf-8")
        if GALLERY_DATA_PATH.exists()
        else ""
    )

    missing_entries: list[tuple[str, int, int]] = []

    files = sorted(
        p
        for p in GALLERY_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS
    )

    for src_path in files:
        with Image.open(src_path) as raw_im:
            im, color_note = convert_to_srgb(raw_im)
            orig_w, orig_h = im.size
            thumb_im = im.copy()
            thumb_im.thumbnail(MAX_THUMB_SIZE, Image.Resampling.LANCZOS)

        out_path = THUMBNAILS_DIR / f"{src_path.stem}.webp"
        thumb_im.save(out_path, "WEBP", quality=92, method=6)
        size_kb = out_path.stat().st_size / 1024
        print(
            f"{src_path.name} ({orig_w}x{orig_h}, {color_note}) "
            f"-> thumbnails/{out_path.name} ({thumb_im.size[0]}x{thumb_im.size[1]}, {size_kb:.1f} KB)"
        )

        expected_ref = f"/images/gallery/{src_path.name}"
        if expected_ref not in gallery_data_text:
            missing_entries.append((src_path.name, orig_w, orig_h))

    if missing_entries:
        print("\nUnregistered gallery photos detected. Add these to RAW_GALLERY_DATA:")
        for filename, w, h in missing_entries:
            slug = re.sub(r"[^a-z0-9]+", "-", Path(filename).stem.lower()).strip("-")
            print(
                f"""  {{
    id: 'photo-{slug}',
    type: 'photo',
    title: '{slug.replace("-", " ")}',
    author: 'Trong Nguyen',
    imageUrl: '/images/gallery/{filename}',
    hqImageUrl: '/images/gallery/{filename}',
    aspectRatio: {w} / {h},
  }},"""
            )


if __name__ == "__main__":
    main()
