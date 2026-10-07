"""The Base mark: a simple bowl on a small foot -- the base of a meal.

Two plain shapes: a half-ellipse bowl and a foot, separated by one gap T.
"""
from geo import Shape, K, rrect

T = 6.0   # gap between bowl and foot

def half_ellipse(rx, ry, y0):
    kx, ky = K * rx, K * ry
    s = Shape().M(-rx, y0).L(rx, y0)
    s.C((rx, y0 + ky), (kx, y0 + ry), (0, y0 + ry)).C((-kx, y0 + ry), (-rx, y0 + ky), (-rx, y0))
    return s.Z()

def build():
    rx, ry = 70.0, 52.0                 # bowl: 140 wide, 52 deep
    foot_w, foot_h = 46.0, 9.0
    s = half_ellipse(rx, ry, 0)
    s.extend(rrect(-foot_w / 2, ry + T, foot_w / 2, ry + T + foot_h, 0, 3))
    x0, y0, x1, y1 = s.bbox()
    return s.transform(1, tx=-x0, ty=-y0), x1 - x0, y1 - y0
