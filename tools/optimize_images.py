#!/usr/bin/env python3
"""Optimiza las imágenes de ``static/img`` y genera ``manifest.json``.

Uso:
    .venv/bin/python tools/optimize_images.py          # genera lo que falte
    .venv/bin/python tools/optimize_images.py --force  # regenera todo

Para cada foto se crean variantes a 480 y 960 px de ancho en WebP (calidad 78)
más un JPEG/PNG de respaldo a 960 px. El manifiesto resultante se sirve al
frontend dentro del bloque ``#cc-boot`` para que las tarjetas puedan usar
``<picture>`` + ``srcset`` sin peticiones extra ni convenciones frágiles.

El script es idempotente: si ya existe una variante más nueva que el original se
salta, de modo que se puede ejecutar tras añadir fotos nuevas.
"""

from __future__ import annotations

import json
import os
import re
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "static", "img")
MANIFEST_PATH = os.path.join(IMG_DIR, "manifest.json")
URL_PREFIX = "/static/img/"

# 320 = miniatura de Mi área · 480 = tarjeta · 720 = detalle
WIDTHS = (320, 480, 720)
MAX_WIDTH = 960
# El respaldo JPEG/PNG solo lo descargan navegadores sin WebP: se queda en 800 px
# para no repetir el problema de peso que veníamos a resolver.
FALLBACK_MAX_WIDTH = 800
WEBP_QUALITY = 78
JPEG_QUALITY = 72

# Iconos, favicons y la tarjeta social ya están en su tamaño final.
SKIP_PREFIXES = (
    "favicon",
    "apple-touch-icon",
    "campus-circular-mark-",
    "campus-circular-og",
    "ctc-congress",
)
# El logo del header se pinta a 44-56 px pero se sirve a 1034 px.
INPLACE_LIMIT = {"campus-circular-mark-white.png": 128}
MIN_SOURCE_WIDTH = 400
# Las variantes ya generadas no se vuelven a procesar como si fueran originales.
GENERATED_RE = re.compile(r"-\d{3,4}\.(?:jpg|jpeg|png|webp)$", re.IGNORECASE)


def url_for(path: str) -> str:
    return URL_PREFIX + os.path.relpath(path, IMG_DIR).replace(os.sep, "/")


def up_to_date(target: str, source: str) -> bool:
    return os.path.exists(target) and os.path.getmtime(target) >= os.path.getmtime(source)


def save_webp(img: Image.Image, target: str) -> None:
    img.save(target, "WEBP", quality=WEBP_QUALITY, method=6)


def save_fallback(img: Image.Image, target: str) -> None:
    if target.lower().endswith(".png"):
        img.save(target, "PNG", optimize=True)
    else:
        img.save(target, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def process(path: str, force: bool) -> dict | None:
    name = os.path.basename(path)
    stem, ext = os.path.splitext(path)
    ext = ext.lower()
    if ext not in (".jpg", ".jpeg", ".png"):
        return None

    with Image.open(path) as source:
        source = ImageOps.exif_transpose(source)
        width, height = source.size

        # 1. Reducción in situ de imágenes sobredimensionadas para su uso.
        if name in INPLACE_LIMIT and width > INPLACE_LIMIT[name]:
            target_px = INPLACE_LIMIT[name]
            resized = source.convert("RGBA")
            resized.thumbnail((target_px, target_px), Image.LANCZOS)
            if force or not up_to_date(path + ".tmp", path):
                resized.save(path, "PNG", optimize=True)
                print(f"  logo   {url_for(path)} {width}px → {target_px}px")
            width, height = resized.size

        # 2. Variantes para fotos y piezas grandes.
        if name.startswith(SKIP_PREFIXES) or width < MIN_SOURCE_WIDTH:
            return None

        rgb = source.convert("RGB") if ext != ".png" else source.convert("RGBA")
        variant_widths = [w for w in WIDTHS if w < width] or [width]
        webp_parts, created = [], 0
        for target_w in variant_widths:
            target = f"{stem}-{target_w}.webp"
            if force or not up_to_date(target, path):
                resized = rgb.copy()
                resized.thumbnail((target_w, MAX_WIDTH * 4), Image.LANCZOS)
                save_webp(resized, target)
                created += 1
            webp_parts.append(f"{url_for(target)} {target_w}w")

        fallback_w = min(FALLBACK_MAX_WIDTH, width)
        fallback_ext = ".png" if ext == ".png" else ".jpg"
        if fallback_w >= width and ext == fallback_ext:
            # Ya tiene el tamaño correcto: no duplicamos el fichero.
            fallback_src = url_for(path)
        else:
            fallback = f"{stem}-{fallback_w}{fallback_ext}"
            if force or not up_to_date(fallback, path):
                resized = rgb.copy()
                resized.thumbnail((fallback_w, MAX_WIDTH * 4), Image.LANCZOS)
                save_fallback(resized, fallback)
                created += 1
            fallback_src = url_for(fallback)

        if created:
            print(f"  foto   {url_for(path)} → {created} variantes")
        return {
            "webp": ", ".join(webp_parts),
            "src": fallback_src,
            "width": fallback_w,
            "height": round(height * fallback_w / width) if width else height,
        }


def main(argv: list[str]) -> int:
    force = "--force" in argv
    if not os.path.isdir(IMG_DIR):
        print("No existe static/img", file=sys.stderr)
        return 1

    entries, skipped = {}, 0
    for base, _dirs, files in os.walk(IMG_DIR):
        for name in sorted(files):
            if name.endswith((".webp", ".json")) or name.startswith("."):
                continue
            if GENERATED_RE.search(name):
                continue
            path = os.path.join(base, name)
            try:
                entry = process(path, force)
            except OSError as exc:  # imagen corrupta: no rompemos el build
                print(f"  aviso  {url_for(path)}: {exc}", file=sys.stderr)
                skipped += 1
                continue
            if entry:
                entries[url_for(path)] = entry

    with open(MANIFEST_PATH, "w", encoding="utf-8") as fh:
        json.dump(dict(sorted(entries.items())), fh, ensure_ascii=False, indent=0)
        fh.write("\n")

    total = sum(
        os.path.getsize(os.path.join(base, f))
        for base, _d, files in os.walk(IMG_DIR)
        for f in files
    )
    print(f"\n{len(entries)} imágenes con variantes · {skipped} avisos · "
          f"static/img = {total / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
