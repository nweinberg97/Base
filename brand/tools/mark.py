"""The Base mark: a pot with bracket handles and a lid, four bubbles rising
out of it -- the four corners of a strong base. Built from the original sketch
(units are pixels of that sketch), with true circles and even gaps."""
import math
from geo import *

def arc(s, cx, cy, r, a0, a1):
    k=K*r; c0,s0=math.cos(math.radians(a0)),math.sin(math.radians(a0)); c1,s1=math.cos(math.radians(a1)),math.sin(math.radians(a1))
    p0,p1=(cx+r*c0,cy+r*s0),(cx+r*c1,cy+r*s1); sg=1 if a1>a0 else -1
    s.C((p0[0]-sg*k*s0,p0[1]+sg*k*c0),(p1[0]+sg*k*s1,p1[1]-sg*k*c1),p1)
def handle(xn, xf, y0, y1, t, r):
    ri, s = max(r - t, 0.001), Shape()
    if xn > xf:
        s.M(xn, y0).L(xf + r, y0); arc(s, xf + r, y0 + r, r, 270, 180); s.L(xf, y1 - r)
        arc(s, xf + r, y1 - r, r, 180, 90); s.L(xn, y1).L(xn, y1 - t).L(xf + t + ri, y1 - t)
        arc(s, xf + t + ri, y1 - t - ri, ri, 90, 180); s.L(xf + t, y0 + t + ri)
        arc(s, xf + t + ri, y0 + t + ri, ri, 180, 270); s.L(xn, y0 + t)
    else:
        s.M(xn, y0).L(xn, y0 + t).L(xf - t - ri, y0 + t); arc(s, xf - t - ri, y0 + t + ri, ri, 270, 360)
        s.L(xf - t, y1 - t - ri); arc(s, xf - t - ri, y1 - t - ri, ri, 0, 90); s.L(xn, y1 - t)
        s.L(xn, y1).L(xf - r, y1); arc(s, xf - r, y1 - r, r, 90, 0); s.L(xf, y0 + r)
        arc(s, xf - r, y0 + r, r, 360, 270); s.L(xn, y0)
    return s.Z()
def build(g=5.0):
    """Units = pixels of the original sketch; pot centred on x=0."""
    W=134; x0,x1=-W/2,W/2
    lid_t, lid_b = 470, 485        # lid band
    body_t, body_b = 490, 566      # body, below a thin gap line
    # handles overlap the lid by 1 unit and share its top edge, so lid and handles fuse into one shape
    p=[rrect(x0-3,lid_t,x1+3,lid_b,0,0), rrect(x0,body_t,x1,body_b,0,32),
       reverse(handle(x0-2, x0-3-29, lid_t, 503, 8.5, 9)), reverse(handle(x1+2, x1+3+29, lid_t, 503, 8.5, 9))]  # same winding as the lid
    # Four bubbles rising out of the pot: hollow rings, largest just leaving
    # the lid, each smaller one drifting a little as it climbs.
    y1 = lid_t - g - 17
    rings = [(-4, y1, 17, 7.5), (14, y1 - 33.5, 12.5, 6.5), (2, y1 - 59.5, 9.5, 5.5), (16, y1 - 80.0, 7.0, 4.8)]
    p += [ring(x, y, rr, tt) for x, y, rr, tt in rings]
    s=Shape()
    for q in p: s.extend(q)
    a,b,c,d=s.bbox(); return s.transform(1,tx=-a,ty=-b),c-a,d-b
