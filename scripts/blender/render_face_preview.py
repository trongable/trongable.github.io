"""Generates a 512x512 RGBA PNG face texture matching src/components/angel/faceTexture.ts
so Blender visual-comparison renders show the complete eyes, triangle brows, blush, and smile.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFilter


def generate_face_png(out_path: str) -> str:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # 1. Soft low outer-cheek blush (blurred radial ovals)
    blush = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(blush)
    bdraw.ellipse((42, 294, 174, 382), fill=(255, 138, 155, 88))
    bdraw.ellipse((338, 294, 470, 382), fill=(255, 138, 155, 88))
    blush = blush.filter(ImageFilter.GaussianBlur(radius=18))
    img = Image.alpha_composite(img, blush)

    draw = ImageDraw.Draw(img)

    left_eye_x = 142
    right_eye_x = 370
    eye_y = 258

    # 2. Little filled triangle eyebrows (classic Angel style)
    brow_color = (128, 76, 40, 255)
    # Left triangle brow
    draw.polygon(
        [
            (left_eye_x - 16, eye_y - 78),
            (left_eye_x + 4, eye_y - 81),
            (left_eye_x - 4, eye_y - 94),
        ],
        fill=brow_color,
    )
    # Right triangle brow
    draw.polygon(
        [
            (right_eye_x - 4, eye_y - 81),
            (right_eye_x + 16, eye_y - 78),
            (right_eye_x + 4, eye_y - 94),
        ],
        fill=brow_color,
    )

    # 3. Large glossy round eyes with 4 upward outer lashes
    def draw_eye(cx: int, cy: int, iris_dx: int, is_left: bool):
        # Sclera
        draw.ellipse((cx - 56, cy - 46, cx + 56, cy + 46), fill=(255, 255, 255, 255))
        # Large dark classic Angel iris
        icx = cx + iris_dx
        draw.ellipse((icx - 40, cy - 41, icx + 40, cy + 41), fill=(30, 22, 24, 255))
        # Pupil
        draw.ellipse((icx - 23, cy - 22, icx + 23, cy + 24), fill=(12, 10, 15, 255))
        # Glossy highlights
        draw.ellipse((icx - 22, cy - 24, icx - 2, cy - 4), fill=(255, 255, 255, 255))
        draw.ellipse((icx + 9, cy + 10, icx + 18, cy + 19), fill=(255, 255, 255, 255))

        # Upper lash arc
        draw.arc(
            (cx - 55, cy - 47, cx + 55, cy + 51),
            start=196,
            end=344,
            fill=(22, 16, 20, 255),
            width=7,
        )

        # 4 tiny upward outer eyelashes
        side = -1 if is_left else 1
        for li in range(4):
            deg = (204 + li * 13) if is_left else (336 - li * 13)
            rad = math.radians(deg)
            x0 = cx + math.cos(rad) * 54
            y0 = cy + 2 + math.sin(rad) * 54
            x1 = x0 + side * (13 - li * 1.6)
            y1 = y0 - (11 + li * 2.2)
            draw.line((x0, y0, x1, y1), fill=(24, 18, 22, 255), width=5)

    draw_eye(left_eye_x, eye_y, 12, True)
    draw_eye(right_eye_x, eye_y, 12, False)

    # 4. Wide gentle baby smile (+75% wider, clear subtle curve)
    pts = []
    for k in range(29):
        t = -1.0 + 2.0 * (k / 28.0)
        sx = 256 + t * 46.0
        sy = 354.0 + (1.0 - t * t) * 11.0
        pts.append((sx, sy))
    draw.line(pts, fill=(208, 136, 124, 255), width=6, joint="curve")

    img.save(out_path)
    return out_path


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("ANGEL_FACE_PNG", os.path.join(os.path.dirname(__file__), "face_preview.png"))
    generate_face_png(out)
    print("Saved face preview:", out)
