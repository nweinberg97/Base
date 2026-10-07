"""Builds every Base logo asset from geometry + outlined type.

Run:  python3 brand/tools/build_logo.py
Needs: fontTools, matplotlib, and Poppins (Medium + Regular) installed locally.
All type is converted to outlines, so the SVGs have no font dependency.
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from geo import Shape, K, circle, rrect, text_shape, render, stem_width

ROOT = os.path.join(os.path.dirname(__file__), "..", "logo")
INK, PAPER = "#111110", "#F6F3EC"
TAG = "mise en place for everyday cooks"
FONT_DIRS = ["/usr/share/fonts/truetype/google-fonts", os.path.expanduser("~/Library/Fonts"), "/Library/Fonts"]
def font(name):
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p): return p
    sys.exit(f"Install {name}")
WORD_FONT, TAG_FONT = font("Poppins-Regular.ttf"), font("Poppins-Regular.ttf")
WORD_TRACK, TAG_TRACK = -0.015, 0.01

# ---------- the mark ----------------------------------------------------
# A bowl — the base of food — drawn as one joined outline, its rim running
# past the sides as handles. Four bubbles rise from its centre in a single
# tapering trail: the four corners of a strong base, lifting off.
# Everything is measured in strokes (t = 1). In every lockup the stroke is
# scaled to match the wordmark's stem weight, so mark and type read as one.
STROKE = 1.0

def half_ellipse(rx, ry, y0, ccw=False):
    """Filled lower half-ellipse with a flat top at y0, centred on x = 0."""
    kx, ky = K * rx, K * ry
    s = Shape()
    if not ccw:
        s.M(-rx, y0).L(rx, y0).C((rx, y0 + ky), (kx, y0 + ry), (0, y0 + ry)).C((-kx, y0 + ry), (-rx, y0 + ky), (-rx, y0))
    else:
        s.M(-rx, y0).C((-rx, y0 + ky), (-kx, y0 + ry), (0, y0 + ry)).C((kx, y0 + ry), (rx, y0 + ky), (rx, y0)).L(-rx, y0)
    return s.Z()

def build_mark():
    t = STROKE
    rx, ry, over = 6.0, 5.2, 1.6          # bowl half-width, depth; rim overhang (handles)
    rim = rrect(-rx - over, 0, rx + over, t, t / 2, t / 2)
    # outer edge starts inside the rim so the two fuse into one seamless outline
    bowl = half_ellipse(rx, ry - t / 2, t / 2).extend(half_ellipse(rx - t, ry - 2 * t, t, ccw=True))
    parts = [rim, bowl]
    # bubble trail: radii taper 0.9t -> 0.45t, gaps open slightly as they rise, drifting right on a soft curve
    rmax, rmin, drift, y, prev = 0.9, 0.45, 1.35, -0.8 * t, 0
    for i in range(4):
        f = i / 3
        r = rmax + (rmin - rmax) * f
        y = (y - r) if i == 0 else (y - prev - r - t * (0.42 + 0.22 * f))
        parts.append(circle(drift * f ** 1.6, y, r))
        prev = r
    m = Shape()
    for p in parts: m.extend(p)
    x0, y0, x1, y1 = m.bbox()
    return m.transform(1, tx=-x0, ty=-y0), x1 - x0, y1 - y0

MARK, MW, MH = build_mark()

def outlined(fp, txt, size, tr):
    s, _ = text_shape(fp, txt, size, tr)
    x0, y0, x1, y1 = s.bbox()
    return s.transform(1, tx=-x0), x1 - x0, -y0, y1  # shape(baseline y=0), width, ascent, descent

WORD, WW, WASC, WDESC = outlined(WORD_FONT, "Base", 200, WORD_TRACK)
STEM = stem_width(WORD_FONT, 200)   # wordmark stem at this size
MS = STEM * 0.9 / STROKE             # mark scale where its line matches the type

# ---------- writers ------------------------------------------------------
def svg(name, items, w, h, bg=None, rx=0, title="Base"):
    body = []
    if bg: body.append(f'<rect width="{w:g}" height="{h:g}" rx="{rx:g}" fill="{bg}"/>')
    for sh, col in items:
        body.append(f'<path fill="{col}" d="{sh.d(2)}"/>')
    out = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" '
           f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
           f'<title>{title}</title>' + "".join(body) + "</svg>\n")
    with open(os.path.join(ROOT, "svg", name + ".svg"), "w") as f: f.write(out)

def png(name, items, w, h, bg=None, scale=2.0, rx=0):
    if rx and bg:
        items = [(rrect(0, 0, w, h, rx, rx), bg)] + items; bg = None
    render(items, w, h, os.path.join(ROOT, "png", name + ".png"), bg=bg, scale=scale)

def emit(name, items, w, h, bg=None, rx=0, title="Base", scale=2.0):
    svg(name, items, w, h, bg, rx, title); png(name, items, w, h, bg, scale, rx)

def themed(name, builder, w, h, pad_bg=True, **kw):
    emit(name, builder(INK), w, h, **kw)                       # ink, transparent
    emit(name + "-inverse", builder(PAPER), w, h, **kw)        # paper, transparent (for dark grounds)
    if pad_bg:
        emit(name + "-on-ink", builder(PAPER), w, h, bg=INK, **kw)
        emit(name + "-on-paper", builder(INK), w, h, bg=PAPER, **kw)

os.makedirs(os.path.join(ROOT, "svg"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "png"), exist_ok=True)

# Mark alone: clear space = 1 dot diameter (5.4) each side
P = 1.5
themed("base-mark", lambda c: [(MARK.transform(1, tx=P, ty=P), c)], MW + 2 * P, MH + 2 * P, title="Base mark", scale=24)

# Wordmark alone
pw = 40
themed("base-wordmark", lambda c: [(WORD.transform(1, tx=pw, ty=pw + WASC), c)], WW + 2 * pw, WASC + WDESC + 2 * pw,
       title="Base", scale=2)

# Stacked lockup (primary): mark / wordmark / tagline
def stacked(with_tag=True):
    ms = MS * 1.2                          # mark a little larger above the name
    tag, tw, tasc, tdesc = outlined(TAG_FONT, TAG, 10, TAG_TRACK)
    ts = (WW * 1.0) / tw                   # tagline spans the wordmark
    gap1, gap2, pad = WASC * 0.32, WASC * 0.34, WASC * 0.6
    W = WW + 2 * pad
    y_mark = pad
    y_base = y_mark + MH * ms + gap1 + WASC
    y_tag = y_base + WDESC + gap2 + tasc * ts
    H = (y_tag + tdesc * ts if with_tag else y_base + WDESC) + pad
    def b(c):
        it = [(MARK.transform(ms, tx=(W - MW * ms) / 2, ty=y_mark), c),
              (WORD.transform(1, tx=(W - WW) / 2, ty=y_base), c)]
        if with_tag: it.append((tag.transform(ts, tx=(W - tw * ts) / 2, ty=y_tag), c))
        return it
    return b, W, H
b, W, H = stacked(True);  themed("base-lockup-stacked", b, W, H, title="Base — mise en place for everyday cooks")
b, W, H = stacked(False); themed("base-lockup-stacked-notag", b, W, H, title="Base")

# Horizontal lockup: mark line weight matches the type; pot sits on the baseline
def horizontal(with_tag=True):
    ms = MS
    gap = WASC * 0.26
    tag, tw, tasc, tdesc = outlined(TAG_FONT, TAG, 10, TAG_TRACK)
    ts = (WASC * 0.13) / tasc
    pad = WASC * 0.4
    x_word = pad + MW * ms + gap
    W = max(x_word + WW, x_word + tw * ts) + pad
    y_base = pad + max(WASC, MH * ms)
    y_tag = y_base + WDESC + WASC * 0.22 + tasc * ts
    H = (y_tag + tdesc * ts if with_tag else y_base + WDESC) + pad
    def b(c):
        it = [(MARK.transform(ms, tx=pad, ty=y_base - MH * ms), c),
              (WORD.transform(1, tx=x_word, ty=y_base), c)]
        if with_tag: it.append((tag.transform(ts, tx=x_word + 2, ty=y_tag), c))
        return it
    return b, W, H
b, W, H = horizontal(False); themed("base-lockup-horizontal", b, W, H, title="Base")
b, W, H = horizontal(True);  themed("base-lockup-horizontal-tag", b, W, H, title="Base — mise en place for everyday cooks")

# App icon + favicon: paper mark on ink squircle-ish tile
def icon(size, frac, rxf, name, scale):
    s = size * frac / max(MW, MH)
    tx, ty = (size - MW * s) / 2, (size - MH * s) / 2
    emit(name, [(MARK.transform(s, tx=tx, ty=ty), PAPER)], size, size, bg=INK, rx=size * rxf, title="Base", scale=scale)
icon(1024, 0.56, 0.225, "base-app-icon", 1)
icon(64, 0.72, 0.22, "base-favicon", 8)
print("done")
