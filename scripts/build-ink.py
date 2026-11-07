#!/usr/bin/env python3
"""Generates assets/images/ink-blot.webp, the mask the About text is revealed through.

A blot spreading from the middle of the top edge, heavier downward, with a rough bleeding edge,
long runs and a few stray drops. Only its alpha channel is used. Needs numpy, opencv-python-headless and pillow.

    python3 scripts/build-ink.py assets/images/ink-blot.webp
"""
import sys

import cv2
import numpy as np
from PIL import Image

SIZE = 1024
RNG = np.random.default_rng(11)


def noise(cells):
    """Smooth random field in -1..1, with roughly `cells` features across the image."""
    small = RNG.random((cells + 3, cells + 3)).astype(np.float32)
    field = cv2.resize(small, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC)
    return field * 2 - 1


def fractal(base, octaves):
    total = np.zeros((SIZE, SIZE), np.float32)
    weight = 1.0
    for octave in range(octaves):
        total += noise(base * 2 ** octave) * weight
        weight *= 0.52
    return total / 1.9


def main(target):
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    x = (xx - SIZE / 2) / (SIZE * 0.46)
    y = yy / (SIZE * 0.93)

    # Warp the coordinates so the edge wanders instead of following an ellipse.
    warp_x = fractal(3, 3)
    warp_y = fractal(3, 3)
    distance = np.sqrt((x + warp_x * 0.09) ** 2 + (y + warp_y * 0.09) ** 2)
    # Fine roughness where ink feathers into the paper, only worth anything near the edge.
    distance += fractal(14, 4) * 0.075 + fractal(60, 2) * 0.016

    # Runs: narrow columns where the ink has travelled further down than its neighbours.
    runs = np.zeros((SIZE, SIZE), np.float32)
    for _ in range(46):
        centre = RNG.uniform(-1, 1)
        width = RNG.uniform(0.006, 0.026)
        strength = RNG.uniform(0.07, 0.24)
        wander = np.sin(y * RNG.uniform(5, 13) + RNG.uniform(0, 6.28)) * 0.012
        runs = np.maximum(runs, strength * np.exp(-(((x - centre - wander) / width) ** 2)))
    distance -= runs * np.clip(y * 2.6, 0, 1)

    alpha = np.clip((1.0 - distance) / 0.014, 0, 1)

    # Stray drops just past the edge.
    drops = np.zeros((SIZE, SIZE), np.float32)
    for _ in range(170):
        angle = RNG.uniform(0, np.pi)
        reach = RNG.uniform(0.93, 1.12)
        cx = int(SIZE / 2 + np.cos(angle) * reach * SIZE * 0.46)
        cy = int(np.sin(angle) * reach * SIZE * 0.93)
        if 0 <= cx < SIZE and 0 <= cy < SIZE:
            cv2.circle(drops, (cx, cy), int(RNG.uniform(1, 5)), 1.0, -1, cv2.LINE_AA)
    alpha = np.maximum(alpha, drops)

    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.9)
    rgba = np.zeros((SIZE, SIZE, 4), np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (alpha * 255).astype(np.uint8)
    Image.fromarray(rgba).save(target, 'WEBP', quality=70, alpha_quality=70, method=6)
    print(target, f'{alpha.mean():.2f} covered')


if __name__ == '__main__':
    main(sys.argv[1])
