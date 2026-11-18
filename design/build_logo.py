#!/usr/bin/env python3
"""
Genera el símbolo de Circular Campus ("dos C") en SVG vectorial.

Concepto
--------
- El anillo de flechas del logo actual se gira a horizontal: dos "C" enfrentadas.
- Cada C se dibuja con líneas finas concéntricas (lenguaje gráfico del Instituto
  de Lingua da UVigo) y termina en una FLECHA angulosa de chevrones anidados con
  púa inferior, no en una punta redondeada.
- En el centro, el árbol del escudo antiguo de la UVigo: tres lóbulos redondos
  recortados en media luna, tronco ensanchado en la base.
- Debajo, la onda del escudo en azul institucional.

Todo se calcula matemáticamente (círculo exacto, símbolo centrado al píxel).
Sin dependencias externas.

Uso:  python3 design/build_logo.py
"""
import math
import os

# ---------------------------------------------------------------- ajustes ---
CX = CY = 512.0                 # centro del lienzo (viewBox 0 0 1024 1024)
R_OUT, R_IN = 432.0, 362.0      # banda exterior / interior del anillo
N_LINES = 8                     # líneas concéntricas (par: una por brazo de flecha)
STROKE = 4.2                    # grosor de línea
GAP_BACK = 15.0                 # grados entre la punta y el corte de la banda
GAP_FRONT = 18.0                # grados entre la punta y el arranque de la otra C

ARROW_BARB = 11.0               # cuánto sobresalen las púas por fuera de la banda (px)
ARROW_NOTCH = 5.0               # profundidad de la muesca trasera (grados)
ARROW_LEVELS = 3                # nº de contornos concéntricos de la flecha
STROKE_EFFECTIVE = 10.0         # separación entre contornos de la flecha (px)

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


def poly_path(points, close=False):
    """Polilínea recta (para las aristas de la flecha)."""
    d = ["M {} {}".format(f(points[0][0]), f(points[0][1]))]
    for p in points[1:]:
        d.append("L {} {}".format(f(p[0]), f(p[1])))
    if close:
        d.append("Z")
    return " ".join(d)


# ----------------------------------------------------------------- anillo ---
def arc_d(theta_start, theta_end, r):
    """Arco exacto (sweep horario)."""
    p0 = pt(theta_start, r)
    p1 = pt(theta_end, r)
    return "M {} {} A {} {} 0 0 1 {} {}".format(
        f(p0[0]), f(p0[1]), f(r), f(r), f(p1[0]), f(p1[1])
    )


def local(x, y, theta_tip, sign):
    """(distancia hacia atrás, radio relativo al eje) -> punto del lienzo."""
    th = theta_tip + sign * math.degrees(x / R_MID)
    return pt(th, R_MID + y)


def arrow_polygon(theta_tip, sign):
    """Contorno de la flecha: punta, dos púas y muesca trasera (en V).

    T punta · A púa superior · N muesca · C púa inferior. La muesca muerde hacia
    dentro de la banda, así las líneas del anillo pueden acabar justo en ella.
    """
    half = (R_OUT - R_IN) / 2.0
    length = R_MID * math.radians(GAP_BACK)
    notch = R_MID * math.radians(ARROW_NOTCH)
    T = local(0.0, 0.0, theta_tip, sign)
    A = local(length, half + ARROW_BARB, theta_tip, sign)
    N = local(length + notch, 0.0, theta_tip, sign)
    C = local(length, -half - ARROW_BARB, theta_tip, sign)
    return [T, A, N, C]


def _chevrons(theta_tip, sign):
    """V's paralelas (chevrones) que rellenan la flecha, recortadas por su contorno."""
    half = (R_OUT - R_IN) / 2.0
    length = R_MID * math.radians(GAP_BACK)
    hb = half + ARROW_BARB
    theta = math.atan2(hb, length)
    d = (R_OUT - R_IN) / (N_LINES - 1)          # misma separación que las líneas
    stag = d / math.sin(theta)
    paths = []
    i = 1
    while i * stag < length * 1.45:
        x = i * stag
        V = local(x, 0.0, theta_tip, sign)
        step_len = 40.0
        U1 = local(x + step_len * math.cos(theta), step_len * math.sin(theta), theta_tip, sign)
        L1 = local(x + step_len * math.cos(theta), -step_len * math.sin(theta), theta_tip, sign)
        du = (U1[0] - V[0], U1[1] - V[1])
        dl = (L1[0] - V[0], L1[1] - V[1])
        nu = math.hypot(*du) or 1.0
        nl = math.hypot(*dl) or 1.0
        U = (V[0] + du[0] / nu * 900.0, V[1] + du[1] / nu * 900.0)
        Lo = (V[0] + dl[0] / nl * 900.0, V[1] + dl[1] / nl * 900.0)
        paths.append(poly_path([U, V, Lo]))
        i += 1
    return paths


def arrow_paths(theta_tip, sign):
    """Contorno de la flecha + chevrones interiores (se recortan con clipPath)."""
    poly = arrow_polygon(theta_tip, sign)
    return poly_path(poly, close=True), _chevrons(theta_tip, sign)


def _circle_segment_hit(p0, p1, r, cx=CX, cy=CY):
    """Ángulo del primer corte entre el círculo de radio r y el segmento p0-p1."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    fx, fy = p0[0] - cx, p0[1] - cy
    a = dx * dx + dy * dy
    b = 2 * (fx * dx + fy * dy)
    c = fx * fx + fy * fy - r * r
    disc = b * b - 4 * a * c
    if a == 0 or disc < 0:
        return None
    sq = math.sqrt(disc)
    hits = [t for t in ((-b - sq) / (2 * a), (-b + sq) / (2 * a)) if 0.0 <= t <= 1.0]
    if not hits:
        return None
    t = min(hits)
    px, py = p0[0] + dx * t, p0[1] + dy * t
    return math.degrees(math.atan2(px - cx, cy - py))


def _band_end(theta_tip, sign, r):
    """Ángulo donde la línea de radio r debe terminar, sobre la muesca."""
    half = (R_OUT - R_IN) / 2.0
    y = r - R_MID
    poly = arrow_polygon(theta_tip, sign)
    T, A, N, C = poly
    if y > 1e-6:
        ang = _circle_segment_hit(A, N, r)
    elif y < -1e-6:
        ang = _circle_segment_hit(N, C, r)
    else:
        ang = _circle_segment_hit(A, N, r)
    if ang is None:
        ang = theta_tip + sign * GAP_BACK
    # llevar el ángulo al sentido de giro correcto
    while sign > 0 and ang < theta_tip:
        ang += 360.0
    while sign < 0 and ang > theta_tip:
        ang -= 360.0
    return ang


def ring_paths(n_lines=None):
    n_lines = n_lines or N_LINES
    paths = []
    step = (R_OUT - R_IN) / (n_lines - 1)
    for i in range(n_lines):
        r = R_IN + i * step
        # C derecha: baja hasta la punta de abajo
        end_bottom = _band_end(180.0, -1.0, r)
        paths.append(arc_d(GAP_FRONT, end_bottom, r))
        # C izquierda: sube hasta la punta de arriba
        end_top = _band_end(0.0, -1.0, r)
        paths.append(arc_d(180.0 + GAP_FRONT, end_top, r))
    return paths


def arrow_group(n_lines=None):
    paths = arrow_paths(0.0, -1.0)      # punta arriba, apuntando a la derecha
    paths += arrow_paths(180.0, -1.0)   # punta abajo, apuntando a la izquierda
    return paths


# ---------------------------------------------------------------- la planta --
# Árbol del escudo: tres lóbulos redondos recortados en media luna + tronco
# troncocónico, unidos con unión suave (metaballs) para que salgan los enlaces
# curvos del escudo.
LOBE_TOP = ((0.0, -120.0), 59.0)
LOBE_L = ((-89.0, -2.0), 57.0)
LOBE_R = ((89.0, -2.0), 57.0)
STEM = ((0.0, 158.0), (0.0, -30.0), 13.0)   # (a, b, radio arriba)
STEM_FLARE = 1.55                           # ensanchamiento del tronco en la base
FILLET = 34.0                               # k de la unión suave

# recortes en media luna: (dirección en la que se desplaza el círculo, radio relativo)
CUT_TOP = ((0.0, 1.0), 0.78)                # el hueco se abre hacia el tronco
CUT_L = ((1.0, 0.0), 0.78)
CUT_R = ((-1.0, 0.0), 0.78)
CUT_DEPTH = 0.30                            # cuánto se desplaza el círculo que recorta
PLANT_SCALE = 1.06


def _circle_sdf(p, c, r):
    return math.hypot(p[0] - c[0], p[1] - c[1]) - r


def _taper_sdf(p, a, b, ra, rb):
    """Cápsula de radio variable (el tronco se ensancha en la base)."""
    ax, ay = a
    bx, by = b
    px, py = p
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L2 = vx * vx + vy * vy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L2))
    dx, dy = px - (ax + t * vx), py - (ay + t * vy)
    return math.hypot(dx, dy) - (ra + (rb - ra) * t)


def _smin(a, b, k):
    h = max(0.0, k - abs(a - b)) / k
    return min(a, b) - h * h * k * 0.25


def _lobe(p, lobe, cut):
    """Lóbulo redondo con un bocado en media luna."""
    (cx, cy), r = lobe
    d = _circle_sdf(p, (cx, cy), r)
    (dx, dy), kr = cut
    n = math.hypot(dx, dy) or 1.0
    cc = (cx + dx / n * r * CUT_DEPTH, cy + dy / n * r * CUT_DEPTH)
    return max(d, -_circle_sdf(p, cc, r * kr))


def plant_sdf(p):
    d = _lobe(p, LOBE_TOP, CUT_TOP)
    d = _smin(d, _lobe(p, LOBE_L, CUT_L), FILLET)
    d = _smin(d, _lobe(p, LOBE_R, CUT_R), FILLET)
    d = _smin(d, _taper_sdf(p, STEM[0], STEM[1], STEM[2], STEM[2] * STEM_FLARE), FILLET)
    return d


def marching_squares(sdf, x0, y0, x1, y1, step):
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
    total = acc[-1] or 1.0
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
    """Contorno exterior + huecos de los lóbulos (se rellenan con evenodd)."""
    loops = marching_squares(plant_sdf, -200.0, -200.0, 200.0, 195.0, 1.0)
    loops.sort(key=len, reverse=True)
    big = [l for l in loops if len(l) > 25]
    if not big:
        raise SystemExit("la planta se ha quedado vacía")
    out = []
    for k, loop in enumerate(big):
        n = 200 if k == 0 else 90
        pts = chaikin(loop, iters=3, closed=True)
        pts = resample(pts, n=n, closed=True)
        out.append([(x * PLANT_SCALE, y * PLANT_SCALE) for x, y in pts])
    return out


def bbox(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


# -------------------------------------------------------------------- onda --
WAVE_HALF = 150.0
WAVE_AMP = 22.0
WAVE_THICK = 26.0
WAVE_GAP = 26.0


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
    loops = plant_points()
    ppts = [p for loop in loops for p in loop]
    px0, py0, px1, py1 = bbox(ppts)
    wave_cy = py1 + WAVE_GAP
    upper, lower = wave_points(wave_cy)
    top, bottom = py0, max(p[1] for p in lower)
    dy = CY - (top + bottom) / 2.0

    plant = " ".join(
        catmull_path([(CX + x, dy + y) for x, y in loop], close=True) for loop in loops
    )
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
    parts.append('<g fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" '
                 'stroke-linejoin="round">' % (ring, f(stroke if stroke else STROKE)))
    for idx, (tip, sgn) in enumerate(((0.0, -1.0), (180.0, -1.0))):
        outline, chevs = arrow_paths(tip, sgn)
        parts.append('<clipPath id="a%d"><path d="%s"/></clipPath>' % (idx, outline))
        parts.append('<g clip-path="url(#a%d)">' % idx)
        parts.append('<path d="%s"/>' % outline)
        for d in chevs:
            parts.append('<path d="%s"/>' % d)
        parts.append("</g>")
    parts.append("</g>")
    parts.append('<path fill="%s" fill-rule="evenodd" d="%s"/>' % (plant, plant_path))
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
        ("circular-campus-2c.svg", logos, {}),
        ("circular-campus-2c-compact.svg", logos, dict(n_lines=6, stroke=6.0)),
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
