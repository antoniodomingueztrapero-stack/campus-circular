---
name: campus-circular-visual-polish
description: Eleva la estética de Campus Circular para proyector y móvil sin coste.
---
# Campus Circular Visual & Congress Polish

- Centraliza en `:root` fondo cálido #FAFAF9, tarjetas blancas con borde #E5E7EB, primario #15803D, hover #166534, acento #DCFCE7 y texto #111827/#4B5563. Usa Plus Jakarta Sans para títulos e Inter para cuerpo autoalojadas con fallback de sistema y escala `clamp()`.
- Hero compacto de pitch con navegación translúcida, botones Explorar catálogo y Publicar artículo, y métricas dinámicas de artículos, residuos estimados y ahorro potencial. Etiqueta explícitamente las estimaciones.
- Catálogo responsivo `repeat(auto-fill, minmax(270px, 1fr))`, tarjetas 14px, hover suave, imágenes 4:3 `object-fit: cover`, badges de operación y estado, título a dos líneas, campus/facultad y acción visible.
- Preserva rutas de fotografías y variantes `.webp` generadas por `tools/optimize_images.py`; ejecuta `tests/test_assets.py`.
