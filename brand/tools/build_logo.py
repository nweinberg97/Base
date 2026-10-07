"""Builds every Base logo asset.

Run:  python3 brand/tools/build_logo.py
Needs: fontTools, matplotlib, Inter Light and Poppins Bold Italic installed.
All type is converted to outlines, so the SVGs have no font dependency.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from geo import Shape, rrect, text_shape, render
from mark import build as build_mark

ROOT = os.path.join(os.path.dirname(__file__), "..", "logo")
INK, PAPER = "#000000", "#FFFFFF"
TAG_LINES = ["mise en place for", "everyday cooks"]
TAG = " ".join(TAG_LINES)

FONT_DIRS = ["/usr/share/fonts/opentype/inter", "/usr/share/fonts/truetype/google-fonts",
             os.path.expanduser("~/Library/Fonts"), "/Library/Fonts"]
def font(name):
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p): return p
    sys.exit(f"Install {name}")
WORD_FONT, TAG_FONT = font("Inter-Light.otf"), font("Poppins-BoldItalic.ttf")
WORD_TRACK = 0.03

MARK, MW, MH = build_mark()

def outlined(fp, txt, size, tr=0.0):
    s, _ = text_shape(fp, txt, size, tr)
    x0, y0, x1, y1 = s.bbox()
    return s.transform(1, tx=-x0), x1 - x0, -y0, y1   # baseline at y=0

WORD, WW, WASC, WDESC = outlined(WORD_FONT, "Base", 200, WORD_TRACK)

# ---------- writers ------------------------------------------------------
def svg(name, items, w, h, bg=None, rx=0, title="Base"):
    body = [f'<rect width="{w:g}" height="{h:g}" rx="{rx:g}" fill="{bg}"/>'] if bg else []
    body += [f'<path fill="{col}" d="{sh.d(2)}"/>' for sh, col in items]
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
    emit(name, builder(INK), w, h, **kw)                     # black, transparent
    emit(name + "-inverse", builder(PAPER), w, h, **kw)      # white, transparent
    emit(name + "-on-ink", builder(PAPER), w, h, bg=INK, **kw)
    emit(name + "-on-paper", builder(INK), w, h, bg=PAPER, **kw)

os.makedirs(os.path.join(ROOT, "svg"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "png"), exist_ok=True)

# Mark alone
P = MH * 0.12
themed("base-mark", lambda c: [(MARK.transform(1, tx=P, ty=P), c)], MW + 2 * P, MH + 2 * P, title="Base mark", scale=4)

# Wordmark alone
pw = WASC * 0.25
themed("base-wordmark", lambda c: [(WORD.transform(1, tx=pw, ty=pw + WASC), c)], WW + 2 * pw, WASC + WDESC + 2 * pw)

# Stacked lockup (primary, as in the original): mark / Base / two-line tagline
def stacked(with_tag=True):
    ms = WW * 0.49 / MW
    lines = [outlined(TAG_FONT, l, 10) for l in TAG_LINES]
    ts = WW * 1.18 / max(l[1] for l in lines)        # tagline a little wider than the wordmark
    lh = lines[0][2] * ts * 1.42                     # line height
    pad = WASC * 0.45
    W = max(WW, max(l[1] for l in lines) * ts) + 2 * pad
    y_mark = pad
    y_base = y_mark + MH * ms + WASC * 0.06 + WASC
    y_tag0 = y_base + WDESC + WASC * 0.36 + lines[0][2] * ts
    H = (y_tag0 + lh * (len(lines) - 1) + lines[-1][3] * ts if with_tag else y_base + WDESC) + pad
    def b(c):
        it = [(MARK.transform(ms, tx=(W - MW * ms) / 2, ty=y_mark), c),
              (WORD.transform(1, tx=(W - WW) / 2, ty=y_base), c)]
        if with_tag:
            for i, (sh, w, _, _) in enumerate(lines):
                it.append((sh.transform(ts, tx=(W - w * ts) / 2, ty=y_tag0 + i * lh), c))
        return it
    return b, W, H
b, W, H = stacked(True);  themed("base-lockup-stacked", b, W, H, title="Base — mise en place for everyday cooks")
b, W, H = stacked(False); themed("base-lockup-stacked-notag", b, W, H)

# Horizontal lockup: mark beside the name, one-line tagline under the name
def horizontal(with_tag=True):
    ms = WASC * 1.05 / MH
    tag, tw, tasc, tdesc = outlined(TAG_FONT, TAG, 10)
    ts = WW * 1.0 / tw
    pad, gap = WASC * 0.4, WASC * 0.22
    x_word = pad + MW * ms + gap
    W = max(x_word + WW, x_word + tw * ts) + pad
    y_base = pad + max(WASC, MH * ms)
    y_tag = y_base + WDESC + WASC * 0.24 + tasc * ts
    H = (y_tag + tdesc * ts if with_tag else y_base + WDESC) + pad
    def b(c):
        it = [(MARK.transform(ms, tx=pad, ty=y_base - MH * ms), c),
              (WORD.transform(1, tx=x_word, ty=y_base), c)]
        if with_tag: it.append((tag.transform(ts, tx=x_word, ty=y_tag), c))
        return it
    return b, W, H
b, W, H = horizontal(False); themed("base-lockup-horizontal", b, W, H)
b, W, H = horizontal(True);  themed("base-lockup-horizontal-tag", b, W, H, title="Base — mise en place for everyday cooks")

# App icon + favicon: white mark on a black tile
def icon(size, frac, rxf, name, scale):
    s = size * frac / max(MW, MH)
    tx, ty = (size - MW * s) / 2, (size - MH * s) / 2
    emit(name, [(MARK.transform(s, tx=tx, ty=ty), PAPER)], size, size, bg=INK, rx=size * rxf, scale=scale)
icon(1024, 0.62, 0.225, "base-app-icon", 1)
icon(64, 0.8, 0.22, "base-favicon", 8)
print("done")
