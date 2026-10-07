"""Builds every Base logo asset.

Run:  python3 brand/tools/build_logo.py
Needs: fontTools, matplotlib, and Poppins (Medium + Regular) installed.
All type is converted to outlines, so the SVGs have no font dependency.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from geo import Shape, rrect, text_shape, render
from mark import build as build_mark

ROOT = os.path.join(os.path.dirname(__file__), "..", "logo")
INK, PAPER = "#141413", "#F4F1EA"
TOMATO = "#E2553A"                                   # signature colour
SEASONS = {"winter": "#5B7FA6", "spring": "#7FA65B", "summer": "#E2553A", "fall": "#D98A2B"}
TAG = "mise en place for everyday cooks"

FONT_DIRS = ["/usr/share/fonts/truetype/google-fonts", os.path.expanduser("~/Library/Fonts"), "/Library/Fonts"]
def font(name):
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p): return p
    sys.exit(f"Install {name}")
WORD_FONT, TAG_FONT = font("Poppins-Medium.ttf"), font("Poppins-Regular.ttf")

def outlined(fp, txt, size, tr=0.0):
    s, _ = text_shape(fp, txt, size, tr)
    x0, y0, x1, y1 = s.bbox()
    return s.transform(1, tx=-x0), x1 - x0, -y0, y1   # baseline at y=0

WORD, WW, WASC, WDESC = outlined(WORD_FONT, "base", 200, -0.03)

# Mark scale for lockups: mark height = the ascender of "b". Ring thickness is one fixed
# share of the bowl radius everywhere, so the mark is identical at every size.
RING_T = 0.42
MS = WASC / 4.30
RINGS, FILLED, MW, MH = build_mark(RING_T)

def mark_items(scale, tx, ty, ring_col, fill_col):
    return [(RINGS.transform(scale, tx=tx, ty=ty), ring_col), (FILLED.transform(scale, tx=tx, ty=ty), fill_col)]

# ---------- writers ------------------------------------------------------
def svg(name, items, w, h, bg=None, rx=0, title="Base"):
    body = [f'<rect width="{w:g}" height="{h:g}" rx="{rx:g}" fill="{bg}"/>'] if bg else []
    body += [f'<path fill="{col}" d="{sh.d(3)}"/>' for sh, col in items]
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

def themed(name, builder, w, h, **kw):
    emit(name, builder(INK, INK), w, h, **kw)                       # one colour, ink
    emit(name + "-inverse", builder(PAPER, PAPER), w, h, **kw)      # one colour, paper (for dark grounds)
    emit(name + "-on-paper", builder(INK, INK), w, h, bg=PAPER, **kw)
    emit(name + "-on-ink", builder(PAPER, PAPER), w, h, bg=INK, **kw)
    emit(name + "-color", builder(INK, TOMATO), w, h, bg=PAPER, **kw)       # signature colour
    emit(name + "-color-on-ink", builder(PAPER, TOMATO), w, h, bg=INK, **kw)

os.makedirs(os.path.join(ROOT, "svg"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "png"), exist_ok=True)

# Mark alone (clear space = one gap + half a bowl)
P = MH * 0.18
themed("base-mark", lambda rc, fc: mark_items(1, P, P, rc, fc), MW + 2 * P, MH + 2 * P, title="Base mark", scale=60)

# Wordmark alone
pw = WASC * 0.3
emit_word = lambda c: [(WORD.transform(1, tx=pw, ty=pw + WASC), c)]
for suffix, c, bg in [("", INK, None), ("-inverse", PAPER, None), ("-on-paper", INK, PAPER), ("-on-ink", PAPER, INK)]:
    emit("base-wordmark" + suffix, emit_word(c), WW + 2 * pw, WASC + WDESC + 2 * pw, bg=bg)

# Horizontal lockup (primary): mark | base, mark height = ascender, sitting on the baseline
def horizontal(with_tag):
    tag, tw, tasc, tdesc = outlined(TAG_FONT, TAG, 10, 0.01)
    ts = WW * 1.0 / tw
    pad, gap = WASC * 0.45, WASC * 0.24
    x_word = pad + MW * MS + gap
    W = x_word + max(WW, tw * ts) + pad
    y_base = pad + WASC
    y_tag = y_base + WDESC + WASC * 0.26 + tasc * ts
    H = (y_tag + tdesc * ts if with_tag else y_base + WDESC) + pad
    def b(rc, fc):
        it = mark_items(MS, pad, y_base - MH * MS, rc, fc) + [(WORD.transform(1, tx=x_word, ty=y_base), rc)]
        if with_tag: it.append((tag.transform(ts, tx=x_word, ty=y_tag), rc))
        return it
    return b, W, H
b, W, H = horizontal(False); themed("base-lockup-horizontal", b, W, H)
b, W, H = horizontal(True);  themed("base-lockup-horizontal-tag", b, W, H, title="Base — mise en place for everyday cooks")

# Stacked lockup: mark above, centred
def stacked(with_tag):
    ms = MS * 1.35
    tag, tw, tasc, tdesc = outlined(TAG_FONT, TAG, 10, 0.01)
    ts = WW * 1.0 / tw
    pad = WASC * 0.5
    W = max(WW, tw * ts) + 2 * pad
    y_mark = pad
    y_base = y_mark + MH * ms + WASC * 0.42 + WASC
    y_tag = y_base + WDESC + WASC * 0.26 + tasc * ts
    H = (y_tag + tdesc * ts if with_tag else y_base + WDESC) + pad
    def b(rc, fc):
        rings, filled, mw, mh = RINGS, FILLED, MW, MH
        tx = (W - mw * ms) / 2
        it = [(rings.transform(ms, tx=tx, ty=y_mark), rc), (filled.transform(ms, tx=tx, ty=y_mark), fc),
              (WORD.transform(1, tx=(W - WW) / 2, ty=y_base), rc)]
        if with_tag: it.append((tag.transform(ts, tx=(W - tw * ts) / 2, ty=y_tag), rc))
        return it
    return b, W, H
b, W, H = stacked(True);  themed("base-lockup-stacked", b, W, H, title="Base — mise en place for everyday cooks")
b, W, H = stacked(False); themed("base-lockup-stacked-notag", b, W, H)

# App icon + favicon
def icon(size, frac, rxf, name, scale, fill=PAPER, ring_share=None):
    s = size * frac / MW
    rings, filled, mw, mh = build_mark(ring_share if ring_share else RING_T)
    tx, ty = (size - mw * s) / 2, (size - mh * s) / 2
    emit(name, [(rings.transform(s, tx=tx, ty=ty), PAPER), (filled.transform(s, tx=tx, ty=ty), fill)],
         size, size, bg=INK, rx=size * rxf, scale=scale)
icon(1024, 0.52, 0.225, "base-app-icon", 1)
icon(1024, 0.52, 0.225, "base-app-icon-color", 1, fill=TOMATO)
icon(64, 0.66, 0.22, "base-favicon", 8, ring_share=0.5)           # slightly heavier rings for tiny sizes
for season, col in SEASONS.items():                                # the filled bowl changes with the season
    icon(1024, 0.52, 0.225, f"base-app-icon-{season}", 1, fill=col)
print("done")
