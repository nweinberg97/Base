"""Tiny geometry toolkit: paths as command lists -> SVG + matplotlib rasters."""
import math
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from matplotlib.path import Path as MPath

K = 0.5522847498  # circle bezier constant


class Shape:
    def __init__(self):
        self.cmds = []  # (op, pts)

    def M(self, x, y): self.cmds.append(("M", [(x, y)])); return self
    def L(self, x, y): self.cmds.append(("L", [(x, y)])); return self
    def C(self, a, b, c): self.cmds.append(("C", [a, b, c])); return self
    def Z(self): self.cmds.append(("Z", [])); return self

    def extend(self, other): self.cmds += other.cmds; return self

    def transform(self, sx=1, sy=None, tx=0, ty=0):
        sy = sx if sy is None else sy
        s = Shape()
        s.cmds = [(op, [(x * sx + tx, y * sy + ty) for x, y in pts]) for op, pts in self.cmds]
        return s

    def bbox(self):
        pts = [p for _, ps in self.cmds for p in ps]
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        return min(xs), min(ys), max(xs), max(ys)

    def d(self, prec=2):
        f = lambda v: (f"{v:.{prec}f}").rstrip("0").rstrip(".") if "." in f"{v:.{prec}f}" else f"{v:.{prec}f}"
        out = []
        for op, pts in self.cmds:
            out.append(op + " ".join(f"{f(x)} {f(y)}" for x, y in pts))
        return "".join(out)

    def mpl(self):
        verts, codes = [], []
        start = None
        for op, pts in self.cmds:
            if op == "M":
                verts.append(pts[0]); codes.append(MPath.MOVETO); start = pts[0]
            elif op == "L":
                verts.append(pts[0]); codes.append(MPath.LINETO)
            elif op == "C":
                verts += pts; codes += [MPath.CURVE4] * 3
            elif op == "Z":
                verts.append(start); codes.append(MPath.CLOSEPOLY)
        return MPath(verts, codes)


def circle(cx, cy, r, ccw=False):
    k = K * r
    s = Shape().M(cx + r, cy)
    seq = [
        ((cx + r, cy + k), (cx + k, cy + r), (cx, cy + r)),
        ((cx - k, cy + r), (cx - r, cy + k), (cx - r, cy)),
        ((cx - r, cy - k), (cx - k, cy - r), (cx, cy - r)),
        ((cx + k, cy - r), (cx + r, cy - k), (cx + r, cy)),
    ]
    if ccw:
        s = Shape().M(cx + r, cy)
        seq = [
            ((cx + r, cy - k), (cx + k, cy - r), (cx, cy - r)),
            ((cx - k, cy - r), (cx - r, cy - k), (cx - r, cy)),
            ((cx - r, cy + k), (cx - k, cy + r), (cx, cy + r)),
            ((cx + k, cy + r), (cx + r, cy + k), (cx + r, cy)),
        ]
    for a, b, c in seq:
        s.C(a, b, c)
    return s.Z()


def rrect(x0, y0, x1, y1, rt=0, rb=0):
    """Rect with top-corner radius rt and bottom-corner radius rb (clockwise in y-down)."""
    s = Shape()
    s.M(x0 + rt, y0).L(x1 - rt, y0)
    if rt: s.C((x1 - rt + K * rt, y0), (x1, y0 + rt - K * rt), (x1, y0 + rt))
    s.L(x1, y1 - rb)
    if rb: s.C((x1, y1 - rb + K * rb), (x1 - rb + K * rb, y1), (x1 - rb, y1))
    s.L(x0 + rb, y1)
    if rb: s.C((x0 + rb - K * rb, y1), (x0, y1 - rb + K * rb), (x0, y1 - rb))
    s.L(x0, y0 + rt)
    if rt: s.C((x0, y0 + rt - K * rt), (x0 + rt - K * rt, y0), (x0 + rt, y0))
    return s.Z()


class _Pen(BasePen):
    def __init__(self, gs, shape, dx, scale):
        super().__init__(gs); self.s = shape; self.dx = dx; self.k = scale
    def _t(self, p): return (self.dx + p[0] * self.k, -p[1] * self.k)
    def _moveTo(self, p): self.s.M(*self._t(p))
    def _lineTo(self, p): self.s.L(*self._t(p))
    def _curveToOne(self, a, b, c): self.s.C(self._t(a), self._t(b), self._t(c))
    def _closePath(self): self.s.Z()
    def _endPath(self): pass


def text_shape(fontpath, text, size, tracking=0.0, kern=True):
    """Return (Shape, advance) with baseline at y=0, y-down coordinates. tracking in em."""
    f = TTFont(fontpath)
    upm = f["head"].unitsPerEm
    k = size / upm
    cmap = f.getBestCmap(); gs = f.getGlyphSet(); hmtx = f["hmtx"]
    names = [cmap[ord(ch)] for ch in text]
    kp = {}
    if kern and "GPOS" in f:
        kp = _gpos_pairs(f)
    s = Shape(); x = 0.0
    for i, n in enumerate(names):
        gs[n].draw(_Pen(gs, s, x, k))
        adv = hmtx[n][0]
        if i + 1 < len(names):
            adv += kp.get((n, names[i + 1]), 0)
        x += adv * k + tracking * size
    return s, x - tracking * size


def _gpos_pairs(f):
    pairs = {}
    try:
        for lookup in f["GPOS"].table.LookupList.Lookup:
            if lookup.LookupType != 2:
                continue
            for st in lookup.SubTable:
                if st.Format == 1:
                    cov = st.Coverage.glyphs
                    for i, ps in enumerate(st.PairSet):
                        for pvr in ps.PairValueRecord:
                            v = getattr(pvr.Value1, "XAdvance", 0) or 0
                            pairs.setdefault((cov[i], pvr.SecondGlyph), v)
                elif st.Format == 2:
                    cov = st.Coverage.glyphs
                    c1 = st.ClassDef1.classDefs; c2 = st.ClassDef2.classDefs
                    allg = f.getGlyphOrder()
                    for g1 in cov:
                        r = st.Class1Record[c1.get(g1, 0)]
                        for g2 in allg:
                            v = getattr(r.Class2Record[c2.get(g2, 0)].Value1, "XAdvance", 0) or 0
                            if v:
                                pairs.setdefault((g1, g2), v)
    except Exception:
        pass
    return pairs


def render(shapes, w, h, path, bg="#ffffff", scale=1.0, dpi=100):
    """shapes: list of (Shape, color). Coordinates in y-down units; canvas w x h units."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.patches import PathPatch
    fig = plt.figure(figsize=(w * scale / dpi, h * scale / dpi), dpi=dpi)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, w); ax.set_ylim(h, 0); ax.axis("off")
    fig.patch.set_facecolor(bg if bg else "none")
    if not bg: fig.patch.set_alpha(0)
    for sh, col in shapes:
        ax.add_patch(PathPatch(sh.mpl(), facecolor=col, edgecolor="none", lw=0))
    fig.savefig(path, dpi=dpi, transparent=not bg, facecolor=fig.get_facecolor())
    plt.close(fig)
