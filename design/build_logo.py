#!/usr/bin/env python3
"""
Genera el símbolo de Circular Campus (propuesta "dos C") en SVG vectorial.

Idea: el anillo de flechas del logo actual se gira a horizontal y se dibuja con
líneas finas concéntricas (como el logo del Instituto de Lingua da UVigo).
Cada remate nace de las propias líneas y converge en una punta afilada sobre el
eje del anillo. En el centro, la planta de tres lóbulos del escudo antiguo de la
UVigo (maciza, sin líneas) y debajo la onda en azul institucional.

Todo se calcula matemáticamente: el anillo es un círculo exacto y el símbolo
queda centrado al píxel. Sin dependencias externas.

Uso:  python3 design/build_logo.py
"""
import math
import os
import sys

# ---------------------------------------------------------------- ajustes ---
CX = CY = 512.0                 # centro del lienzo (viewBox 0 0 1024 1024)
R_OUT, R_IN = 432.0, 362.0      # banda exterior / interior del anillo
N_LINES = 9                     # nº de líneas concéntricas
STROKE = 4.2                    # grosor de línea
GAP = 7.0                       # medio hueco (grados) arriba y abajo
TIP = 20.0                      # longitud de la punta de flecha (grados)
TIP_EASE = 1.5                  # exponente de convergencia (1 = lineal, >1 = punta más afilada)
TIP_SPREAD = 1.0                # ensanchamiento de la punta (aletas)
TIP_R = None                    # radio donde converge la punta (None = eje de la banda)

GREEN = "#1B6B3A"               # verde del logo actual (anillo)
GREEN_PLANT = "#3C8F52"         # verde de la planta
BLUE = "#0067B1"                # azul institucional UVigo

R_MID = (R_OUT + R_IN) / 2.0


# ------------------------------------------------------------- utilidades ---
def pt(theta_deg, r, cx=CX, cy=CY):
    """Punto sobre un círculo. theta en grados, 0 = arriba, sentido horario."""
    a = math.radians(theta_deg)
    return (cx + r * math.sin(a), cy - r * math.cos(a))


def f(v):
    """Redondeo compacto para el SVG."""
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


def catmull_path(points, close=False):
    """Polilínea -> curvas Bézier cúbicas suaves (Catmull-Rom)."""
    pts = list(points)
    if close:
        pts = pts + [pts[0]]
    if len(pts) < 2:
        return ""
    d = [f"M {f(pts[0][0])} {f(pts[0][1])}"]
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1 = pts[i]
        p2 = pts[i + 1]
        p3 = pts[i + 2] if i + 2 < n else pts[i + 1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d.append(
            "C {} {} {} {} {} {}".format(
                f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(p2[0]), f(p2[1])
            )
        )
    if close:
        d.append("Z")
    return " ".join(d)


def smoothstep(t):
    return t * t * (3.0 - 2.0 * t)


# ----------------------------------------------------------------- anillo ---
def stroke_d(start, tip, r):
    """Una línea concéntrica: arco exacto + remate que converge en la punta."""
    taper_start = tip - TIP
    p0 = pt(start, r)
    p1 = pt(taper_start, r)
    d = [
        f"M {f(p0[0])} {f(p0[1])}",
        # arco exacto, sweep=1 (horario en pantalla)
        f"A {f(r)} {f(r)} 0 0 1 {f(p1[0])} {f(p1[1])}",
    ]
    pts = [p1]
    n = 16
    for i in range(1, n + 1):
        t = i / n
        th = taper_start + TIP * t
        k = t ** TIP_EASE
        w = 1.0 + (TIP_SPREAD - 1.0) * math.sin(math.pi * t) ** 1.2
        tr = R_MID if TIP_R is None else TIP_R
        rr = tr + (r - tr) * w * (1.0 - k)
        pts.append(pt(th, rr))
    # tramo de la punta como béziers suaves (sin su "M x y" inicial)
    tail = catmull_path(pts)
    d.append(tail.split(" ", 3)[3])
    return " ".join(d)


def ring_paths(n_lines=None):
    paths = []
    # arco derecho: 7 -> 180 (punta abajo, apuntando a la izquierda)
    # arco izquierdo: 187 -> 360 (punta arriba, apuntando a la derecha)
    n_lines = n_lines or N_LINES
    step = (R_OUT - R_IN) / (n_lines - 1)
    for i in range(n_lines):
        r = R_IN + i * step
        paths.append(stroke_d(GAP, 180.0, r))
        paths.append(stroke_d(180.0 + GAP, 360.0, r))
    return paths


# ---------------------------------------------------------------- la planta --
# Silueta tipo metaball: tres lóbulos redondos + tallo, unidos con unión suave
# (los "fillets" del escudo antiguo salen solos).
LOBE_TOP = ((0.0, -110.0), 58.0)
LOBE_L = ((-86.0, 0.0), 57.0)
LOBE_R = ((86.0, 0.0), 57.0)
STEM = ((0.0, 158.0), (0.0, -40.0), 16.0)   # (a, b, radio en la punta superior)
FILLET = 32.0                               # k de la unión suave
STEM_FLARE = 1.35                           # ensanchamiento del tallo en la base
PLANT_SCALE = 1.0


def _circle_sdf(p, c, r):
    return math.hypot(p[0] - c[0], p[1] - c[1]) - r


def _taper_sdf(p, a, b, ra, rb):
    """Cápsula con radio variable (el tallo se ensancha en la base)."""
    ax, ay = a
    bx, by = b
    px, py = p
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L2 = vx * vx + vy * vy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L2))
    dx, dy = px - (ax + t * vx), py - (ay + t * vy)
    return math.hypot(dx, dy) - (ra + (rb - ra) * t)


def _capsule_sdf(p, a, b, r):
    ax, ay = a
    bx, by = b
    px, py = p
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L2 = vx * vx + vy * vy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L2))
    dx, dy = px - (ax + t * vx), py - (ay + t * vy)
    return math.hypot(dx, dy) - r


def _smin(a, b, k):
    h = max(0.0, k - abs(a - b)) / k
    return min(a, b) - h * h * k * 0.25


def plant_sdf(p):
    d = _circle_sdf(p, *LOBE_TOP)
    d = _smin(d, _circle_sdf(p, *LOBE_L), FILLET)
    d = _smin(d, _circle_sdf(p, *LOBE_R), FILLET)
    (sa, sb, rstem) = STEM
    d = _smin(d, _taper_sdf(p, sa, sb, rstem, rstem * STEM_FLARE), FILLET)
    return d


def marching_squares(sdf, x0, y0, x1, y1, step):
    """Contorno de nivel 0 -> lista de polilíneas cerradas."""
    nx = int(round((x1 - x0) / step)) + 1
    ny = int(round((y1 - y0) / step)) + 1
    grid = [[sdf((x0 + i * step, y0 + j * step)) for i in range(nx)] for j in range(ny)]

    segs = []
    for j in range(ny - 1):
        for i in range(nx - 1):
            v = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]]
            cors = [
                (x0 + i * step, y0 + j * step),
                (x0 + (i + 1) * step, y0 + j * step),
                (x0 + (i + 1) * step, y0 + (j + 1) * step),
                (x0 + i * step, y0 + (j + 1) * step),
            ]
            idx = 0
            for k in range(4):
                if v[k] < 0:
                    idx |= 1 << k
            if idx in (0, 15):
                continue
            edges = []
            for k in range(4):
                k2 = (k + 1) % 4
                if (v[k] < 0) != (v[k2] < 0):
                    fa, fb = v[k], v[k2]
                    t = fa / (fa - fb) if fa != fb else 0.5
                    ax, ay = cors[k]
                    bx, by = cors[k2]
                    edges.append((ax + (bx - ax) * t, ay + (by - ay) * t))
            if len(edges) == 2:
                segs.append((edges[0], edges[1]))
            elif len(edges) == 4:
                segs.append((edges[0], edges[1]))
                segs.append((edges[2], edges[3]))

    def key(p):
        return (round(p[0], 3), round(p[1], 3))

    adj = {}
    for a, b in segs:
        adj.setdefault(key(a), []).append((a, b))
        adj.setdefault(key(b), []).append((b, a))

    loops, used = [], set()
    for a, b in segs:
        if (key(a), key(b)) in used:
            continue
        loop = [a, b]
        used.add((key(a), key(b)))
        used.add((key(b), key(a)))
        cur = b
        while True:
            nxt = None
            for nb in adj.get(key(cur), []):
                if (key(nb[0]), key(nb[1])) not in used:
                    nxt = nb
                    break
            if nxt is None:
                break
            used.add((key(nxt[0]), key(nxt[1])))
            used.add((key(nxt[1]), key(nxt[0])))
            cur = nxt[1]
            loop.append(cur)
            if key(cur) == key(loop[0]):
                break
        if len(loop) > 8:
            loops.append(loop)
    return loops


def chaikin(points, iters=2, closed=True):
    pts = list(points)
    if closed and pts and pts[0] != pts[-1]:
        pts.append(pts[0])
    for _ in range(iters):
        out = [pts[0]]
        for i in range(len(pts) - 1):
            p, q = pts[i], pts[i + 1]
            out.append((0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]))
            out.append((0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]))
        out.append(pts[-1])
        pts = out
    return pts


def resample(points, n=120, closed=True):
    pts = list(points)
    if closed and pts[0] != pts[-1]:
        pts.append(pts[0])
    acc = [0.0]
    for i in range(1, len(pts)):
        acc.append(acc[-1] + math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    total = acc[-1]
    out, j = [], 0
    for k in range(n):
        target = total * k / n
        while j < len(acc) - 2 and acc[j + 1] < target:
            j += 1
        span = acc[j + 1] - acc[j] or 1.0
        t = (target - acc[j]) / span
        out.append(
            (
                pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
                pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t,
            )
        )
    return out


def plant_points():
    loops = marching_squares(plant_sdf, -200.0, -200.0, 200.0, 195.0, 1.0)
    loops.sort(key=len, reverse=True)
    # la silueta debe ser una sola pieza: si no, avisamos
    big = [l for l in loops if len(l) > 30]
    if len(big) != 1:
        raise SystemExit("la planta se ha partido en %d piezas" % len(big))
    pts = chaikin(big[0], iters=3, closed=True)
    pts = resample(pts, n=170, closed=True)
    return [(x * PLANT_SCALE, y * PLANT_SCALE) for x, y in pts]


def bbox(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


# -------------------------------------------------------------------- onda --
WAVE_HALF = 152.0
WAVE_AMP = 22.0
WAVE_THICK = 26.0
WAVE_GAP = 26.0     # separación entre la base del tallo y la cresta


def wave_points(cy):
    upper, lower = [], []
    n = 64
    for i in range(n + 1):
        t = i / n
        xx = -WAVE_HALF + 2 * WAVE_HALF * t
        yc = cy + WAVE_AMP * math.sin(math.pi * xx / WAVE_HALF)
        h = WAVE_THICK * (1.0 - (abs(xx) / WAVE_HALF) ** 2) ** 0.40
        upper.append((xx, yc - h / 2))
        lower.append((xx, yc + h / 2))
    return upper, lower


# -------------------------------------------------------------------- SVG ---
def geometry():
    """Devuelve (planta_path, onda_path) ya centrados en el lienzo."""
    ppts = plant_points()
    px0, py0, px1, py1 = bbox(ppts)
    wave_cy = py1 + WAVE_GAP
    upper, lower = wave_points(wave_cy)
    wy0 = min(p[1] for p in lower)
    top, bottom = py0, max(p[1] for p in lower)
    dy = CY - (top + bottom) / 2.0

    plant = catmull_path([(CX + x, dy + y) for x, y in ppts], close=True)
    wave = catmull_path([(CX + x, dy + y) for x, y in upper], close=False)
    wave += " " + catmull_path([(CX + x, dy + y) for x, y in reversed(lower)],
                               close=False).split(" ", 3)[3] + " Z"
    return plant, wave


def build_svg(ring=GREEN, plant=GREEN_PLANT, wave=BLUE, bg=None, size=1024,
              stroke=None, scale=1.0, n_lines=None):
    plant_path, wave_path = geometry()
    parts = []
    parts.append(
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
        'viewBox="0 0 1024 1024">' % (size, size)
    )
    if bg:
        parts.append('<rect width="1024" height="1024" fill="%s"/>' % bg)
    parts.append('<g transform="translate(512 512) scale(%s) translate(-512 -512)">' % f(scale))
    parts.append(
        '<g fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" '
        'stroke-linejoin="round">' % (ring, f(stroke if stroke else STROKE))
    )
    for d in ring_paths(n_lines):
        parts.append('<path d="%s"/>' % d)
    parts.append("</g>")
    parts.append('<path fill="%s" d="%s"/>' % (plant, plant_path))
    parts.append('<path fill="%s" d="%s"/>' % (wave, wave_path))
    parts.append("</g>")
    parts.append("</svg>")
    return "\n".join(parts)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "out")
    logos = os.path.join(os.path.dirname(here), "static", "img", "logos")
    os.makedirs(out, exist_ok=True)
    os.makedirs(logos, exist_ok=True)

    specs = [
        # fichero, carpeta, ajustes
        ("circular-campus-2c.svg", logos, {}),
        ("circular-campus-2c-compact.svg", logos, dict(n_lines=4, stroke=11.0)),
        ("circular-campus-2c-verde.svg", logos, dict(wave=GREEN)),
        ("circular-campus-2c-mono.svg", logos,
         dict(ring="#FFFFFF", plant="#FFFFFF", wave="#FFFFFF")),
        ("proposal.svg", out, {}),
        ("proposal-ondark.svg", out,
         dict(bg="#0E2A1B", ring="#FFFFFF", plant="#FFFFFF", wave="#7FB9EA")),
    ]
    for name, dest, kw in specs:
        with open(os.path.join(dest, name), "w") as fh:
            fh.write(build_svg(**kw))
        print("wrote", os.path.join(dest, name))


if __name__ == "__main__":
    main()
