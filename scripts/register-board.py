#!/usr/bin/env python3
"""Register the plates against the approved board (SIFT + similarity transform).

Writes scripts/out/registration.json: per plate, the scale (board px per plate px)
and the board position of the plate's top-left corner, plus a 50 % blend overlay
per plate in scripts/out/ to check the fit by eye. The board's photos are generated
re-renders of the salon's captures, so a similarity fit is the closest framing, not
a pixel match: read the overlays before trusting a number.

~/anaconda3/bin/python3 scripts/register-board.py
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts/out"
BOARD = ROOT / "references/Modelo-1-Aprovado.png"

# plate file, board search band (y0, y1)
PLATES = {
    "hero": ("images/master/hero-cheveux-detoure.png", (0, 560)),
    "salon": ("scripts/out/clean/salon-large.png", (440, 960)),
    "blondes": ("scripts/out/clean/ondes-blondes.png", (1290, 1720)),
    "cuivrees": ("scripts/out/clean/ondes-cuivrees.png", (1290, 1720)),
    "booking": ("scripts/out/clean/salon-proche.png", (1690, 2140)),
}


def load_rgb(path):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img.ndim == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3:4].astype(np.float32) / 255
        rgb = (img[:, :, :3].astype(np.float32) * alpha + 40 * (1 - alpha)).astype(np.uint8)
        return rgb, img[:, :, 3]
    return img[:, :, :3], None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    board, _ = load_rgb(BOARD)
    sift = cv2.SIFT_create(nfeatures=8000)
    result = {"board": {"width": board.shape[1], "height": board.shape[0]}}
    for name, (rel, (y0, y1)) in PLATES.items():
        plate, alpha = load_rgb(ROOT / rel)
        band = np.zeros(board.shape[:2], np.uint8)
        band[y0:y1] = 255
        kb, db = sift.detectAndCompute(cv2.cvtColor(board, cv2.COLOR_BGR2GRAY), band)
        kp, dp = sift.detectAndCompute(cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY), alpha)
        matches = cv2.BFMatcher().knnMatch(dp, db, k=2)
        good = [m for m, n in matches if m.distance < 0.78 * n.distance]
        if len(good) < 8:
            result[name] = {"file": rel, "matches": len(good), "registered": False}
            print(f"{name}: only {len(good)} matches, not registered")
            continue
        src = np.float32([kp[m.queryIdx].pt for m in good])
        dst = np.float32([kb[m.trainIdx].pt for m in good])
        M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4)
        n_in = int(inliers.sum()) if inliers is not None else 0
        scale = float(np.hypot(M[0, 0], M[1, 0]))
        angle = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
        h, w = plate.shape[:2]
        result[name] = {
            "file": rel, "plate_size": [w, h], "matches": len(good), "inliers": n_in,
            "scale": round(scale, 5), "angle_deg": round(angle, 3),
            "x": round(float(M[0, 2]), 2), "y": round(float(M[1, 2]), 2),
            "width_board": round(w * scale, 2), "height_board": round(h * scale, 2),
            "registered": n_in >= 12,
        }
        print(name, result[name])
        warped = cv2.warpAffine(plate, M, (board.shape[1], board.shape[0]))
        mask = cv2.warpAffine(alpha if alpha is not None else np.full((h, w), 255, np.uint8), M,
                              (board.shape[1], board.shape[0]))
        blend = board.copy()
        sel = mask > 128
        blend[sel] = (0.5 * board[sel] + 0.5 * warped[sel]).astype(np.uint8)
        ya, yb = max(0, y0 - 60), min(board.shape[0], y1 + 60)
        cv2.imwrite(str(OUT / f"reg-{name}.jpg"), np.hstack([board[ya:yb], blend[ya:yb]]))
    (OUT / "registration.json").write_text(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
