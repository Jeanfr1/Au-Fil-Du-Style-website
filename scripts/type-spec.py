#!/usr/bin/env python3
"""Display titles: size from a reference glyph measured on the board (cap or x-height),
letter-spacing from the measured ink width. Small text keeps the fit-type.py fit.
Writes src/data/board-type.json (board px) and scripts/out/type-spec.png (board | render).

python3 scripts/type-spec.py
"""
import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fit", ROOT / "scripts/fit-type.py")
fit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fit)

# id, text, font, size (from glyph height), ink left, ink right, baseline (board px)
DISPLAY = [
    ("h1a", "Le style,", "bodoni", 93.5, 41, 338, 245),
    ("h1b", "en mouvement.", "bodoni-i", 86.0, 41, 468, 313),
    ("salon1", "Le salon.", "bodoni", 82.8, 32, 308, 879),
    ("salon2", "Votre rythme.", "bodoni-i", 37.0, 40, 218, 920),
    ("svc1", "Coupe.", "bodoni", 93.0, 41, 283, 1074),
    ("svc2", "Couleur.", "bodoni", 93.0, 41, 331, 1158),
    ("svc3", "Caractère.", "bodoni-i", 93.0, 41, 360, 1241),
    ("real1", "La couleur", "bodoni", 99.0, 118, 529, 1530),
    ("real2", "a du relief.", "bodoni-i", 103.0, 230, 600, 1617),
    ("book1", "On se voit", "bodoni", 67.0, 54, 306, 1839),
    ("book2", "au salon ?", "bodoni-i", 69.0, 53, 298, 1895),
]
# small text: id -> size override (contaminated fits) ; others come from fit-type.py
SMALL_SIZE = {"nav1": 10.8}


def main():
    small = json.loads((ROOT / "src/data/board-type.json").read_text()) if (ROOT / "src/data/board-type.json").exists() else {}
    out = {}
    for key, text, font, size, x0, x1, base in DISPLAY:
        # tracking first (down to tmin), a wider gap opens the word spaces, then size
        spaces = text.count(" ")
        tmin = -0.075 if font.endswith("-i") else -0.055
        for _ in range(30):
            rw = fit.render_ink(text, font, size)[0]
            gap = (x1 - x0) - rw
            word = 0.0
            if spaces:
                word = max(0.0, min(0.08, gap * 0.6 / spaces / size))
                gap -= word * size * spaces
            tracking = gap / max(len(text) - 1 - spaces, 1) / size
            if tracking >= tmin:
                break
            size *= 0.99
        _, _, top, lsb = (float(v) for v in fit.render_ink(text, font, size))
        out[key] = {"text": text, "font": font, "size": round(size, 2), "tracking": round(tracking, 4),
                    "word": round(word, 4), "baseline": base, "left": round(x0 - lsb, 1)}
        print(f"{key:8s} size={size:6.1f} tracking={tracking:+.4f}em word={word:+.3f}em left={x0 - lsb:.1f}")
    for key, text, font, ink, box in fit.LINES:
        if key in out or key not in small:
            continue
        entry = dict(small[key])
        if key in SMALL_SIZE:
            entry["size"] = SMALL_SIZE[key]
            entry["tracking"] = 0
        out[key] = entry
    (ROOT / "src/data/board-type.json").write_text(json.dumps(out, indent=2, ensure_ascii=False))

    # render check: every line drawn at its spec over a dark/light copy of the board
    board = fit.BOARD_IMG.copy()
    draw = ImageDraw.Draw(board)
    for key, e in out.items():
        font = ImageFont.truetype(str(fit.FONTS[e["font"]]), max(1, round(e["size"])))
        asc = font.getmetrics()[0]
        x = e["left"]
        for ch in e["text"]:
            draw.text((x, e["baseline"] - asc), ch, font=font, fill=(255, 0, 90))
            x += font.getlength(ch) + (e["tracking"] + (e.get("word", 0) if ch == " " else 0)) * e["size"]
    board.save(ROOT / "scripts/out/type-spec.png")


if __name__ == "__main__":
    main()
