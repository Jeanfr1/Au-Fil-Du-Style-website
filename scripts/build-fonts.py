#!/usr/bin/env python3
"""Web fonts for the site, from the kit's official variable files (fonts/originals, OFL).

Bodoni Moda is instanced at opsz 18 (wght 400): the approved board's display type has
the sturdier hairlines of the low optical size; the kit's static TTFs are opsz 64.
Same family, same design; widths are re-fitted by scripts/type-spec.py.
Instrument Sans comes from the kit's static instances unchanged.
Writes fonts-site/*.ttf (used by the fitting scripts) and public/fonts/*.woff2.

~/anaconda3/bin/python3 scripts/build-fonts.py
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
OPSZ = 18
JOBS = [
    ("fonts/originals/BodoniModa-Variable.ttf", "BodoniModa-Regular", {"wght": 400, "opsz": OPSZ}),
    ("fonts/originals/BodoniModa-Italic-Variable.ttf", "BodoniModa-Italic", {"wght": 400, "opsz": OPSZ}),
    ("fonts/InstrumentSans-Regular.ttf", "InstrumentSans-Regular", None),
    ("fonts/InstrumentSans-Medium.ttf", "InstrumentSans-Medium", None),
    ("fonts/InstrumentSans-SemiBold.ttf", "InstrumentSans-SemiBold", None),
]

(ROOT / "fonts-site").mkdir(exist_ok=True)
(ROOT / "public/fonts").mkdir(parents=True, exist_ok=True)
for src, name, axes in JOBS:
    font = TTFont(ROOT / src)
    if axes:
        font = instantiateVariableFont(font, axes)
    font.save(ROOT / f"fonts-site/{name}.ttf")
    font.flavor = "woff2"
    font.save(ROOT / f"public/fonts/{name}.woff2")
    print(name, axes or "static")
