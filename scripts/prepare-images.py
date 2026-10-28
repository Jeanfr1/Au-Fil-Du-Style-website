#!/usr/bin/env python3
"""Master plates for the site, from the salon's own photos (scripts/out/plates/).

- salon-large / salon-proche: Planity carousel buttons removed (dark disc un-blended:
  observed = (1 - a) * photo, chevron and rim inpainted). Nothing else is touched.
- Instagram captures: the "… Pontchâteau · il y a 5 ans" header is cropped away.
- Every real photo then goes through Real-ESRGAN x4 (scripts/upscale.py) and is
  resampled to `out` x, so wide screens never stretch a 460-1360 px capture.
- Before/after crops of each button go to scripts/out/clean/ for a visual check.

~/anaconda3/bin/python3 scripts/prepare-images.py [--skip-sr] [--force]
"""
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts/out/plates"
CHECK = ROOT / "scripts/out/clean"
SKIP_SR = "--skip-sr" in sys.argv
FORCE = "--force" in sys.argv
# carousel button: observed = SLOPE * photo + OFFSET (fit on the uniform wall, 4 sectors)
SLOPE, OFFSET = 0.45, 13.0

# name: source, carousel buttons (cx, cy, r guesses), crop (x0, y0, x1, y1) or None, output scale
PHOTOS = {
    "salon-large": ("images/originals/salon-large-original.png", [(68, 310, 35), (1291, 310, 35)], None, 2),
    "salon-proche": ("images/originals/salon-proche-original.png", [(1286, 384, 35)], None, 2),
    "ondes-blondes": ("images/originals/ondes-blondes-original.png", [], None, 4),
    "ondes-cuivrees": ("images/originals/ondes-cuivrees-original.png", [], (0, 80, 562, 870), 4),
    "carre-blond": ("images/originals/carre-blond-original.png", [], (0, 100, 566, 1010), 2),
    "chignon": ("images/originals/chignon-original.png", [], None, 1),
}


def fit_disc(gray, cx, cy, r_guess):
    """Refine centre and radius on the luminance step at the disc rim."""
    ang = np.linspace(0, 2 * np.pi, 180, endpoint=False)
    h, w = gray.shape
    best = None
    for dx in range(-6, 7):
        for dy in range(-6, 7):
            for r in np.arange(r_guess - 5, r_guess + 5.5, 0.5):
                x, y = cx + dx, cy + dy
                xi = np.clip((x + (r - 2) * np.cos(ang)).astype(int), 0, w - 1)
                yi = np.clip((y + (r - 2) * np.sin(ang)).astype(int), 0, h - 1)
                xo = np.clip((x + (r + 2) * np.cos(ang)).astype(int), 0, w - 1)
                yo = np.clip((y + (r + 2) * np.sin(ang)).astype(int), 0, h - 1)
                score = float(np.median(gray[yo, xo].astype(int) - gray[yi, xi].astype(int)))
                if best is None or score > best[0]:
                    best = (score, x, y, r)
    return best[1:]


def remove_button(img, cx, cy, r, s=SLOPE, b=OFFSET):
    """observed = s * photo + b inside the disc (s, b fitted on the flat wall of salon-proche)."""
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - cx, yy - cy)
    f = img.astype(np.float32)
    cover = np.clip((r + 1.0 - d) / 2.0, 0, 1)[..., None]   # anti-aliased rim
    s_eff = 1 - cover * (1 - s)
    out = (f - cover * b) / s_eff
    # residual tint: match the inner ring to the outer ring, per channel
    ring_in = (d > r - 9) & (d < r - 3)
    ring_out = (d > r + 3) & (d < r + 9)
    gain = np.median(out[ring_out], axis=0) / np.maximum(np.median(out[ring_in], axis=0), 1)
    out = np.clip(out * (1 + cover * (np.clip(gain, 0.8, 1.25) - 1)), 0, 255).astype(np.uint8)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    chevron = ((d < r - 3) & (gray > 150)).astype(np.uint8) * 255
    chevron = cv2.dilate(chevron, np.ones((7, 7), np.uint8))
    rim = ((d > r - 2.5) & (d < r + 2.5)).astype(np.uint8) * 255
    out = cv2.inpaint(out, cv2.bitwise_or(chevron, rim), 4, cv2.INPAINT_TELEA)
    return out, s


def upscale(bgr, factor):
    if factor == 1:
        return bgr
    if SKIP_SR:
        return cv2.resize(bgr, None, fx=factor, fy=factor, interpolation=cv2.INTER_LANCZOS4)
    sys.path.insert(0, str(ROOT / "scripts"))
    from upscale import sr4
    big = sr4(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    if factor != 4:
        big = cv2.resize(big, (bgr.shape[1] * factor, bgr.shape[0] * factor), interpolation=cv2.INTER_AREA)
    return cv2.cvtColor(big, cv2.COLOR_RGB2BGR)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    CHECK.mkdir(parents=True, exist_ok=True)
    for name, (rel, buttons, crop, factor) in PHOTOS.items():
        target = OUT / f"{name}.png"
        if target.exists() and not FORCE and not SKIP_SR:
            print("kept", target.name)
            continue
        src = cv2.imread(str(ROOT / rel), cv2.IMREAD_COLOR)
        img = src.copy()
        for i, guess in enumerate(buttons):
            cx, cy, r = fit_disc(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), *guess)
            img, t = remove_button(img, cx, cy, r)
            print(f"{name}: button at ({cx}, {cy}) r={r} slope={t:.2f}")
            y0, y1 = max(0, cy - 70), cy + 70
            x0, x1 = max(0, cx - 70), cx + 70
            sheet = np.hstack([cv2.resize(src[y0:y1, x0:x1], None, fx=3, fy=3),
                               cv2.resize(img[y0:y1, x0:x1], None, fx=3, fy=3)])
            cv2.imwrite(str(CHECK / f"{name}-button-{i}.jpg"), sheet)
        if crop:
            x0, y0, x1, y1 = crop
            img = img[y0:y1, x0:x1]
        cv2.imwrite(str(CHECK / f"{name}.png"), img)
        cv2.imwrite(str(target), upscale(img, factor))
        print("wrote", target.name, img.shape[1] * factor, "x", img.shape[0] * factor)


if __name__ == "__main__":
    main()
