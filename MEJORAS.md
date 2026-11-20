# Mejora integral — diagnóstico y plan

Fecha: 2026-11-20 · Rama `arena/4ae4ed42-campus-circular` · Base `8fcdba3`

## 0. Nota de método (importante)

Desde este entorno **no se puede abrir `https://campus-circular.onrender.com`**: el
sandbox solo tiene salida a GitHub, npm y PyPI. Por eso el diagnóstico no se basa
en suposiciones sobre producción, sino en ejecutar **este mismo repositorio con la
configuración de Render** (`APP_ENV=production`, `gunicorn --workers 1 --threads 8`)
y medir con `curl`, el DOM y los bytes reales de cada asset. Todo lo que sigue está
respaldado por una medición reproducible en local; lo que solo se puede confirmar
en producción queda listado en la sección 6.

## 1. Diagnóstico

### 1.1 Rendimiento (el punto débil real)

| Medición local (gzip) | Valor | Lectura |
| --- | --- | --- |
| `GET /` | 3,4 KB · 23 ms | Shell ligero, bien |
| `GET /static/css/style.css` | 14,5 KB · 4 ms | Correcto |
| `GET /static/js/app.js` | 54,5 KB · 15 ms | Aceptable (SPA sin build) |
| `GET /api/items?limit=12` | 1,7 KB · 3 ms | Backend rápido |
| `GET /api/stats` | 0,3 KB · 2 ms | Caché de 15 s funcionando |

El servidor no es el problema. El problema es **lo que descarga el navegador**:

- `static/img/` pesa **3,8 MB**. La portada pide **12 imágenes de 1200×900 px**
  (~100 KB cada una) para mostrarlas a ~300 px de ancho: **≈1,2 MB de fotos** que
  el móvil no necesita.
- El logo del header/footer (`circular-campus-mark-white.png`) pesa **224 KB**
  para renderizarse a 44×56 px.
- Solo hay JPEG, sin WebP ni `srcset`: en 375 px se descarga la misma foto de
  1200 px que en un monitor 4K.
- `static/img/circular-campus-mark.png` (260 KB) **no se referencia en ningún
  sitio**: peso muerto en el despliegue.

Esto es lo que hace que la app se sienta lenta en Render (plan gratuito: poco CPU,
banda limitada y arranque en frío), no el código Python.

### 1.2 Seguridad

Base sólida (CSP, HSTS, `nosniff`, COOP, CORS con lista blanca, rate limiting por
IP y por cuenta, autorización por recurso, MIME real, re-codificación de imágenes,
`no-store` en rutas de cuenta). Huecos concretos:

1. **`frame-ancestors *`**: cualquier web puede embeber la app. Se dejó así por el
   preview del sandbox, pero **en producción debe ser `'self'`**.
2. **Contraseñas débiles aceptadas**: solo se exige longitud ≥ 8. `12345678` entra.
3. **No existe cambio de contraseña**: si alguien sospecha que su clave se ha
   filtrado, la única salida es borrar la cuenta.
4. Detalle menor: no hay `X-Frame-Options` de respaldo para navegadores antiguos.

### 1.3 UX/UI

Buen nivel: skeletons, estados vacíos, toasts, foco atrapado en modales, `ESC`,
`aria-live`, `loading="lazy"` + `decoding="async"` + fallback de imagen rota,
contraste AA verificado (`--muted` 5,6:1 sobre el fondo). Sin `overflow-x` en
375/1280 px. Lo que falta:

- Imágenes servidas muy por encima de su tamaño de render (mala percepción de
  velocidad, sobre todo con 4G).
- No hay forma de cambiar la contraseña desde la interfaz.
- Falta `robots.txt` / `sitemap.xml` (la SPA es indexable pero no lo declara).

### 1.4 Riesgos de despliegue en Render

- `render.yaml` trae `SEED_DEMO=1` en producción: si la base está vacía, el
  catálogo público se llena de objetos de demostración con usuarios ficticios.
- El rate limiting vive en memoria: **1 worker es obligatorio** (ya está) y un
  reinicio resetea contadores (aceptable, documentado).
- Arranque en frío del plan gratuito: el frontend ya avisa con `markSlow`, así que
  es un problema percibido más que funcional.

## 2. Plan priorizado

| # | Mejora | Tipo | Impacto | Riesgo |
| --- | --- | --- | --- | --- |
| 1 | Pipeline de imágenes: WebP + `srcset`/`<picture>` + logo 224 KB→~8 KB + limpieza de assets muertos | Estructural | **Muy alto** (portada 1,2 MB → ~200 KB) | Bajo |
| 2 | Cambio de contraseña (`POST /api/account/password`) que invalida las demás sesiones + UI | Funcional | Alto | Bajo |
| 3 | Lista de contraseñas comunes rechazadas (registro y cambio) | Seguridad | Medio-alto | Bajo |
| 4 | `frame-ancestors 'self'` por defecto, `ALLOW_EMBED=1` para previews | Seguridad | Medio | Bajo |
| 5 | `robots.txt` + `sitemap.xml` | Quick win | Bajo-medio (SEO) | Nulo |
| 6 | Guardas de test: variantes de imagen presentes, ningún asset > 120 KB, manifest coherente | Calidad | Medio (evita regresiones) | Nulo |
| 7 | Documentación: variables nuevas, `SEED_DEMO` en producción, pasos manuales | Entrega | Medio | Nulo |

Descartado a propósito en esta iteración (mayor coste que beneficio ahora):
migrar el token de `localStorage` a cookie `HttpOnly` + CSRF (toca toda la
autenticación y sus tests), editor de publicaciones en la interfaz (la API `PATCH`
ya existe), modo oscuro y SSR/SEO por artículo.

## 3. Implementación

Ver commit asociado. Resumen de archivos:

- `tools/optimize_images.py` — genera variantes y `static/img/manifest.json`.
  Idempotente: se puede volver a ejecutar tras añadir fotos.
- `static/img/**` — variantes `-480.webp`, `-960.webp`, `-960.jpg`; logo reducido.
- `app.py` — `boot.imgManifest`, cabecera de caché para `/static/img/`, CSP
  configurable, `POST /api/account/password`, lista de contraseñas débiles,
  `robots.txt` y `sitemap.xml`.
- `static/js/app.js` — `responsiveImg()` con `<picture>`/`srcset`, modal de
  contraseña, i18n es/en/gl.
- `templates/index.html` — sin cambios: el manifiesto viaja en el `#cc-boot` que
  ya servía `boot_config()`.
- `tests/test_assets.py`, `tests/test_account.py` — guardas nuevas.
- `.env.example`, `render.yaml`, `DEPLOY.md`, `README.md` — variables y notas.

## 4. Verificación

| Comprobación | Resultado |
| --- | --- |
| `unittest` (todos los módulos) | **55 tests OK** (46 previos + 5 de contraseña + 4 de assets) |
| `node --check static/js/app.js` | OK |
| CSS parseado | 681 reglas, sin errores |
| Crawl de rutas, assets y API | 0 problemas · 10 rutas 200 · API 401/404 correctos |
| Variantes de imagen por HTTP | **100 assets** (WebP + respaldos) 200 con bytes reales, media 19 KB por WebP |
| `/robots.txt` · `/sitemap.xml` · `/healthz` | 200 · `text/plain` · `application/xml` · `application/json` |
| Consola y red en jsdom, 9 rutas × 375/1280 px | 0 errores, 0 4xx/5xx inesperadas |
| `<picture>` + `srcset` en las 12 tarjetas | 12/12 con `source[type=image/webp]`, `sizes`, `width`/`height`, `loading="lazy"` |
| Hero | `fetchpriority="high"`, sin `lazy`, variantes 320/480/720 |
| Fallback de imagen rota | elimina el `<source>` y cae al placeholder (antes el navegador insistía en la variante rota) |
| Flujo real de contraseña | 403 con la actual mal, 400 con clave débil, 200 + 1 sesión cerrada, login antiguo 401, login nuevo 200, sesión actual viva |
| Flujo e2e UI (publicar → solicitar → entregar → valorar) | OK, 0 errores de consola |
| Accesibilidad jsdom | 0 problemas |

### Peso descargado (medido, no estimado)

| Perfil | Antes | Después (WebP) |
| --- | --- | --- |
| Móvil 375 px @2x (12 tarjetas + hero + logo) | 1 537 KB | **339 KB (-78 %)** |
| Escritorio 1280 px @1x | 1 537 KB | **186 KB (-88 %)** |
| Logo del header | 224 KB | **15 KB** |
| HTML del shell | 3,4 KB gzip | 4,2 KB gzip (manifiesto incluido) |

### Límite conocido

Sin navegador headless en este entorno (la descarga de Chromium está bloqueada),
375/1280 px se valida con DOM renderizado + auditoría estática del CSS, como en
la QA anterior. Queda pendiente la comprobación visual en un dispositivo real.

## 5. Variables de entorno nuevas

| Variable | Valor | Efecto |
| --- | --- | --- |
| `ALLOW_EMBED` | `0` (producción) / `1` (preview) | `frame-ancestors 'self'` o `*` |

## 6. Pasos manuales en producción

1. Redesplegar y comprobar `/healthz`.
2. Ejecutar `tools/optimize_images.py` solo si se añaden fotos nuevas (ya está
   hecho para las actuales) y commitear el `manifest.json` resultante.
3. Confirmar en el navegador que las tarjetas cargan `.webp` (DevTools → Network
   → filtro Img) y que la portada baja de ~1,2 MB a ~200 KB.
4. Decidir `SEED_DEMO`: dejar `1` mientras el catálogo sea una demo pública, o
   `0` + base nueva cuando haya contenido real.
5. Probar cambio de contraseña con una cuenta real: tras cambiarla, las otras
   sesiones deben quedar cerradas y la actual seguir viva.
