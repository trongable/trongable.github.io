"""Stitches user reference photos alongside Blender renders at matching angles
for rapid visual inspection during the local sculpt iteration loop.
"""

import os
from PIL import Image, ImageDraw

USER_UPLOADED = (
    r"C:\Users\trong\.gemini\antigravity\brain\5859cbd8-0b68-49b8-9943-bcb0b929ff57\.user_uploaded"
)
SCRATCH = (
    r"C:\Users\trong\.gemini\antigravity\brain\5859cbd8-0b68-49b8-9943-bcb0b929ff57\scratch"
)

PAIRS = [
    ("FRONT BODY", "media_1795671365816_80720a3f.jpg", "base-front.png"),
    ("FACE CLOSEUP", "media_1795672042495_a6822a83.jpg", "base-face.png"),
    ("3/4 ANGLE", "media_1795671419684_6b0f5499.jpg", "base-34.png"),
    ("BACK + WINGS", "media_1795671429788_6be7dd79.jpg", "base-back.png"),
]


def fit_tile(path: str, w: int = 380, h: int = 460) -> Image.Image:
    im = Image.open(path).convert("RGB")
    im.thumbnail((w, h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), (32, 30, 38))
    ox = (w - im.width) // 2
    oy = (h - im.height) // 2
    canvas.paste(im, (ox, oy))
    return canvas


def main():
    tile_w, tile_h = 360, 440
    pad = 16
    board_w = pad * 3 + tile_w * 2
    row_h = tile_h + 32
    board = Image.new("RGB", (board_w, pad + len(PAIRS) * row_h), (20, 19, 25))
    draw = ImageDraw.Draw(board)

    for idx, (label, ref_name, ren_name) in enumerate(PAIRS):
        y0 = pad + idx * row_h
        ref_path = os.path.join(USER_UPLOADED, ref_name)
        ren_path = os.path.join(SCRATCH, ren_name)

        draw.text((pad, y0), f"{label} — REFERENCE", fill=(226, 248, 114))
        draw.text((pad * 2 + tile_w, y0), f"{label} — BLENDER RENDER", fill=(131, 212, 212))

        if os.path.exists(ref_path):
            board.paste(fit_tile(ref_path, tile_w, tile_h), (pad, y0 + 20))
        if os.path.exists(ren_path):
            board.paste(fit_tile(ren_path, tile_w, tile_h), (pad * 2 + tile_w, y0 + 20))

    out_path = os.path.join(SCRATCH, "comparison_board.png")
    board.save(out_path)
    print("Saved comparison board:", out_path)


if __name__ == "__main__":
    main()
