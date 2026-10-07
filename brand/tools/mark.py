"""The Base mark: a simple bowl with four bubbles rising out of it.

Built to a few strict rules:
- every bubble is the same shape at a different size (ring thickness is a
  fixed share of its radius), stepping down by a fixed ratio as it rises;
- the gap between bowl and foot equals the largest bubble's line weight;
- one gap (G) between every bubble and between the bowl and the first bubble.
"""
import math
from geo import Shape, K, ring, rrect

T = 6.0        # bowl-to-foot gap = the largest ring's line weight
G = 5.5        # gap between bubbles, and from the bowl to the first one
RATIO = 0.74   # each bubble is 74% of the one below it
RING = 0.36    # ring thickness as a share of radius

def half_ellipse(rx, ry, y0):
    kx, ky = K * rx, K * ry
    s = Shape().M(-rx, y0).L(rx, y0)
    s.C((rx, y0 + ky), (kx, y0 + ry), (0, y0 + ry)).C((-kx, y0 + ry), (-rx, y0 + ky), (-rx, y0))
    return s.Z()

def build():
    rx, ry = 70.0, 52.0                          # bowl: 140 wide, 52 deep
    foot_w, foot_h = 46.0, 9.0
    parts = [half_ellipse(rx, ry, 0),
             rrect(-foot_w / 2, ry + T, foot_w / 2, ry + T + foot_h, 0, 3)]
    # bubble trail: rises from the bowl's centre, drifting gently side to side
    r, y = 16.5, -G
    drift = [-3.0, 6.0, -1.0, 6.0]
    for i in range(4):
        y -= r
        parts.append(ring(drift[i], y, r, r * RING))
        y -= r + G
        r *= RATIO
    s = Shape()
    for p in parts: s.extend(p)
    x0, y0, x1, y1 = s.bbox()
    return s.transform(1, tx=-x0, ty=-y0), x1 - x0, y1 - y0
