"""The Base mark: four prep bowls seen from above -- mise en place.

Four bowls for the four layers of Base (Foundation, Expression, Community,
Pickup). The bottom-left bowl is filled: this week's Base, the foundation the
rest is built on. Units: bowl radius = 1.
"""
from geo import Shape, circle, ring

GAP = 0.30          # space between bowls, as a share of the radius

def build(ring_t):
    """Return (rings, filled, width, height). ring_t = ring thickness in radius units."""
    r, g = 1.0, GAP
    c = [(r, r), (3 * r + g, r), (3 * r + g, 3 * r + g)]      # top-left, top-right, bottom-right
    rings = Shape()
    for x, y in c: rings.extend(ring(x, y, r, ring_t))
    filled = circle(r, 3 * r + g, r)                         # bottom-left: the base
    size = 4 * r + g
    return rings, filled, size, size
