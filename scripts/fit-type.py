#!/usr/bin/env python3
"""Measure every text line of the approved board and fit the kit fonts to it.

For each line: tight ink box on the board (pixel scan inside a search box), then the
font size whose rendered ink height matches and the letter-spacing that makes the
rendered ink width match. Results (board px) go to src/data/board-type.json; the CSS
reads them as custom properties, so the page sets its words where the board has them.
scripts/out/type-boxes.png draws every detected box over the board for a visual check.

python3 scripts/fit-type.py   (Pillow + numpy)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BOARD_IMG = Image.open(ROOT / "references/Modelo-1-Aprovado.png").convert("RGB")
BOARD = np.asarray(BOARD_IMG).astype(int)
FONTS = {
    "bodoni": ROOT / "fonts-site/BodoniModa-Regular.ttf",
    "bodoni-i": ROOT / "fonts-site/BodoniModa-Italic.ttf",
    "sans": ROOT / "fonts-site/InstrumentSans-Regular.ttf",
    "sans500": ROOT / "fonts-site/InstrumentSans-Medium.ttf",
}

# id, text, font, ink ("light" | "dark"), search box (x0, y0, x1, y1) on the board
LINES = [
    ("nav1", "Le salon", "sans", "light", (386, 27, 432, 44)),
    ("nav2", "Savoir-faire", "sans", "light", (440, 27, 500, 44)),
    ("nav3", "Réalisations", "sans", "light", (508, 27, 570, 44)),
    ("nav-cta", "Prendre rendez-vous", "sans", "light", (596, 28, 694, 43)),
    ("h1a", "Le style,", "bodoni", "light", (34, 168, 338, 262)),
    ("h1b", "en mouvement", "bodoni-i", "light", (34, 252, 446, 330)),
    ("hero-eyebrow", "COIFFURE & BARBIER · PONTCHÂTEAU", "sans500", "light", (34, 334, 360, 352)),
    ("hero-cta", "Prendre rendez-vous", "sans", "light", (60, 386, 184, 402)),
    ("salon1", "Le salon.", "bodoni", "light", (26, 806, 318, 892)),
    ("salon2", "Votre rythme.", "bodoni-i", "light", (34, 884, 226, 930)),
    ("salon-addr", "6 rue Maurice Sambron · Pontchâteau", "sans", "light", (494, 905, 704, 926)),
    ("svc1", "Coupe.", "bodoni", "dark", (34, 994, 292, 1082)),
    ("svc2", "Couleur.", "bodoni", "dark", (34, 1078, 340, 1166)),
    ("svc3", "Caractère.", "bodoni-i", "dark", (34, 1160, 370, 1252)),
    ("n1", "01", "bodoni", "dark", (402, 992, 432, 1018)),
    ("s1", "Coupe & coiffage", "bodoni", "dark", (402, 1022, 532, 1048)),
    ("d1", "Un style qui vous ressemble.", "sans", "dark", (402, 1050, 560, 1066)),
    ("n2", "02", "bodoni", "dark", (402, 1094, 432, 1120)),
    ("s2", "Couleur & balayage", "bodoni", "dark", (402, 1124, 552, 1150)),
    ("d2", "Des nuances sur mesure.", "sans", "dark", (402, 1152, 545, 1167)),
    ("n3", "03", "bodoni", "dark", (402, 1196, 434, 1222)),
    ("s3", "Barbe & rituels", "bodoni", "dark", (402, 1226, 522, 1252)),
    ("d3", "Un soin, un style, une allure.", "sans", "dark", (402, 1254, 565, 1270)),
    ("real1", "La couleur", "bodoni", "light", (112, 1448, 534, 1536)),
    ("real2", "a du relief", "bodoni-i", "light", (230, 1534, 600, 1628)),
    ("real-eyebrow", "BLONDS · BALAYAGES · NUANCES", "sans500", "light", (242, 1643, 532, 1661)),
    ("book1", "On se voit", "bodoni", "light", (46, 1778, 312, 1846)),
    ("book2", "au salon ?", "bodoni-i", "light", (46, 1844, 302, 1914)),
    ("book-cta", "Prendre rendez-vous", "sans", "light", (78, 1928, 186, 1944)),
    ("book-sub", "Réserver sur Planity", "sans", "light", (90, 1962, 204, 1980)),
    ("foot-addr", "6 rue Maurice Sambron, 44160 Pontchâteau", "sans", "light", (258, 2074, 522, 2094)),
]


def ink_box(box, ink, board=None):
    board = BOARD if board is None else board
    x0, y0, x1, y1 = box
    lum = board[y0:y1, x0:x1].mean(axis=2)
    mid = np.percentile(lum, 50)
    if ink == "light":
        mask = lum > mid + 0.45 * (lum.max() - mid)
    else:
        mask = lum < mid - 0.45 * (mid - lum.min())
    rows, cols = np.where(mask)
    if not len(rows):
        return None
    return [int(x0 + cols.min()), int(y0 + rows.min()), int(x0 + cols.max() + 1), int(y0 + rows.max() + 1)]


def render_ink(text, font_key, size, tracking=0.0):
    font = ImageFont.truetype(str(FONTS[font_key]), size)
    width = int(size * len(text) * (1.0 + max(tracking, 0)) + 80)
    img = Image.new("L", (width, int(size * 2.2)), 0)
    d = ImageDraw.Draw(img)
    x, y = 20, int(size * 0.4)
    for ch in text:
        d.text((x, y), ch, font=font, fill=255)
        x += font.getlength(ch) + tracking * size
    a = np.asarray(img)
    rows, cols = np.where(a > 110)
    asc = font.getmetrics()[0]
    return cols.max() - cols.min() + 1, rows.max() - rows.min() + 1, y + asc - rows.min(), cols.min() - 20


def main():
    out = {}
    overlay = BOARD_IMG.copy()
    draw = ImageDraw.Draw(overlay)
    for key, text, font, ink, box in LINES:
        found = ink_box(box, ink)
        if found is None:
            print("no ink", key)
            continue
        w, h = found[2] - found[0], found[3] - found[1]
        size = 400 * h / render_ink(text, font, 400)[1]
        rw = render_ink(text, font, 400)[0] * size / 400
        # letter-spacing (em) that closes the width gap, spread over len-1 advances
        tracking = (w - rw) / max(len(text) - 1, 1) / size
        _, _, top, lsb = (float(v) for v in render_ink(text, font, size, tracking))
        out[key] = {
            "text": text, "font": font, "ink": found,
            "size": round(size, 2), "tracking": round(tracking, 4),
            "baseline": round(found[1] + top, 1), "left": round(found[0] - lsb, 1),
        }
        draw.rectangle(found, outline=(255, 40, 80))
        print(f"{key:13s} ink={found} size={size:6.2f} tracking={tracking:+.3f}em")
    dest = ROOT / "src/data/board-type.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    (ROOT / "scripts/out").mkdir(parents=True, exist_ok=True)
    overlay.save(ROOT / "scripts/out/type-boxes.png")


if __name__ == "__main__":
    main()
