#!/usr/bin/env python3
"""Turns assets/images/photo-alt.jpg into the About section's printed bust.

Cuts the sitter out of the room with GrabCut, prints them in a halftone screen, and adds a
die-cut sticker border. Needs numpy, opencv-python-headless and pillow.

    python3 scripts/build-portrait.py assets/images/photo-alt.jpg assets/images/bust.webp
"""
import sys

import cv2
import numpy as np
from PIL import Image

SCALE = 2
# Rough outline of head, neck and shoulders in source pixels, used to seed the cut.
SURE_BODY = [(200, 470), (215, 300), (280, 200), (400, 150), (520, 190), (580, 300), (590, 470), (560, 620), (540, 760),
             (640, 830), (800, 900), (826, 1023), (0, 1023), (60, 930), (180, 830), (290, 800), (240, 660)]
MAYBE_BODY = [(150, 480), (150, 250), (240, 110), (400, 70), (560, 110), (640, 270), (640, 500), (600, 700), (640, 790),
              (826, 860), (826, 1023), (0, 1023), (0, 920), (150, 800), (250, 760), (190, 650)]


def cut_out(bgr):
    mask = np.full(bgr.shape[:2], cv2.GC_BGD, np.uint8)
    cv2.fillPoly(mask, [np.array(MAYBE_BODY)], cv2.GC_PR_FGD)
    cv2.fillPoly(mask, [np.array(SURE_BODY)], cv2.GC_FGD)
    bg_model = np.zeros((1, 65), np.float64)
    fg_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bg_model, fg_model, 8, cv2.GC_INIT_WITH_MASK)
    body = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # Keep the largest piece and close small nicks, so the sticker edge runs clean.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(body)
    body = np.where(labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    body = cv2.morphologyEx(body, cv2.MORPH_CLOSE, kernel)
    return cv2.GaussianBlur(body, (0, 0), 2.2)


def halftone(gray, pitch, angle=45):
    """Dots grow as the image darkens; tone stays continuous at the extremes so features hold."""
    h, w = gray.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle)
    u = (xx * np.cos(a) + yy * np.sin(a)) * np.pi / pitch
    v = (-xx * np.sin(a) + yy * np.cos(a)) * np.pi / pitch
    screen = (np.cos(u) * np.cos(v) + 1) / 2
    tone = gray.astype(np.float32) / 255
    edge = np.clip((tone - screen) * 6 + 0.5, 0, 1)
    return (edge * 255).astype(np.uint8)


def main(source, target):
    bgr = cv2.imread(source)
    body = cut_out(bgr)
    h, w = bgr.shape[:2]
    bgr = cv2.resize(bgr, (w * SCALE, h * SCALE), interpolation=cv2.INTER_LANCZOS4)
    body = cv2.resize(body, (w * SCALE, h * SCALE), interpolation=cv2.INTER_CUBIC)
    body = (cv2.GaussianBlur(body, (0, 0), 3) > 127).astype(np.uint8) * 255

    # Even out the side-lit selfie, then push the contrast like a print.
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.createCLAHE(clipLimit=1.3, tileGridSize=(4, 4)).apply(gray)
    gray = cv2.bilateralFilter(gray, 11, 55, 11)
    curve = np.clip((np.arange(256) / 255 - 0.07) / 0.72, 0, 1) ** 0.76 * 255
    gray = cv2.LUT(gray, curve.astype(np.uint8))
    printed = halftone(gray, pitch=10)

    # Die-cut border: a white margin outside the body, then a black keyline outside that.
    pad = 60
    body = cv2.copyMakeBorder(body, pad, 0, pad, pad, cv2.BORDER_CONSTANT, value=0)
    printed = cv2.copyMakeBorder(printed, pad, 0, pad, pad, cv2.BORDER_CONSTANT, value=255)
    round_k = lambda n: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (n, n))
    white = cv2.dilate(body, round_k(37))
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, round_k(61))
    white = (cv2.GaussianBlur(white, (0, 0), 6) > 127).astype(np.uint8) * 255
    black = cv2.dilate(white, round_k(13))
    out = np.full(printed.shape, 255, np.uint8)
    out[white == 0] = 0
    out[body > 0] = printed[body > 0]
    rgba = np.dstack([out, out, out, cv2.GaussianBlur(black, (0, 0), 0.8)])
    image = Image.fromarray(rgba)
    image = image.resize((image.width * 3 // 4, image.height * 3 // 4), Image.LANCZOS)
    image.save(target, 'WEBP', quality=72, method=6)
    print(target, image.size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
