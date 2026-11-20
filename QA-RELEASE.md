# QA de release — Circular Campus

Fecha: 2026-11-20 · Rama: `arena/4ae4ed42-campus-circular` · Base: `b734500`

Este documento resume la verificación previa al despliegue: build/lint/tests,
smoke test de flujos críticos, auditoría de interfaz y consola, y los pasos que
quedan en manos de una persona.

## 1. Build, lint y tests

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Sintaxis backend | `.venv/bin/python -c "import ast; ast.parse(open('app.py').read())"` | OK |
| Sintaxis frontend | `node --check static/js/app.js` | OK |
| CSS | parseo con `css-tree` (vía jsdom toolchain) | 679 reglas, 0 errores |
| Tests | `.venv/bin/python -m unittest discover -s tests` | **46 tests OK** (12,4 s) |

## 2. Smoke test de flujos críticos

Ejecutado contra el servidor real (`gunicorn --workers 1 --threads 8`) con
`DATABASE=/tmp/qa.db SEED_DEMO=1 RATE_LIMIT_ENABLED=0`: **39 comprobaciones OK**.

- Registro (201) → login (200) → sesión (200).
- Catálogo: filtros por categoría y campus, búsqueda con plegado de acentos,
  paginación y detalle de artículo.
- Publicar con imagen: subida de 546 KB → WebP de 64 KB servido con `Content-Type`
  correcto; publicación 201 y aparición inmediata en el catálogo; sin foto → 400.
- Reservas: solicitud 201 → «aceptada» → objeto `reservado` → «completada» →
  `entregado`; impacto actualizado (`0,6 kg`).
- Valoraciones: 201, 201 y 409 al repetir.
- **Editar perfil (nuevo)**: `PATCH /api/account/profile` → 200 con usuario
  actualizado; nombre normalizado a `Smoke Editado`; campus persistido;
  `invalid_campus` → 400; `nothing_to_update` → 400; sin sesión → 401.
- Exportar datos (200) y borrar cuenta (401 con contraseña incorrecta, 200 con la
  correcta).

## 3. Auditoría de interfaz y consola

| Comprobación | Resultado |
| --- | --- |
| Rutas públicas (`/`, `/publicar`, `/puntos`, `/normas`, `/proyecto`, `/mi-area`, `/aviso-legal`, `/privacidad`, `/condiciones`) | 200 |
| `/healthz` | `{"ok": true, "service": "circular-campus"}` |
| Assets (`/static/css/style.css`, `/static/js/app.js`, manifest, iconos, favicon) | 200, sin referencias rotas |
| Imágenes de catálogo y marca (`static/img/**`) | 200 con bytes reales (JPEG/PNG válidos, p. ej. `libro-derecho.jpg` 81 455 B, 1200×900) |
| URLs externas en HTML/CSS/JS | 0 |
| API privada sin sesión | 401 · rutas inexistentes 404 |
| Consola del navegador (jsdom, 9 rutas × 375 px y 1280 px = 18 combinaciones) | 0 errores, 0 excepciones, 0 respuestas 4xx/5xx inesperadas |
| `<html lang>`, `meta viewport`, `alt` en imágenes, sin URLs a `localhost` | OK |
| Anchos fijos en estilos inline mayores que el viewport | 0 |

Las respuestas `200 0` que aparecían en el log de gunicorn son solo el tamaño
omitido de las respuestas servidas con `sendfile`, no ficheros vacíos: se
verificó el contenido binario de las imágenes una a una.

### Limitación honesta sobre 375 px / 1280 px

En este entorno no hay navegador headless y la descarga de Chromium para
Playwright está bloqueada, así que **no se pudo medir `scrollWidth` real**. La
validación se hizo con el DOM renderizado en jsdom más auditoría estática del CSS:

- Rejillas fluidas: `repeat(auto-fill, minmax(min(100%, 220-250px), 1fr))`.
- Imágenes: `img, svg, video { max-width: 100% }` global.
- Textos sin espacios: `overflow-wrap: anywhere` en títulos, nombres, meta,
  descripciones, avisos y toasts.
- Cabeceras con acciones: `.page-head-actions` con `flex-wrap` y botones a ancho
  completo por debajo de 400 px.
- Elementos `nowrap` (chip de usuario, pestañas, insignias) con `ellipsis` y
  `overflow: hidden`.
- Toasts: `width: min(380px, calc(100vw - 24px))`.
- Media queries en 400, 430, 720, 960 y 1099 px.

**Paso manual pendiente:** confirmar visualmente en un móvil real y en escritorio
tras el despliegue (DevTools → dispositivo 375 px, comprobar que
`document.documentElement.scrollWidth === window.innerWidth`).

## 4. Mejora incluida en esta QA

**Edición de perfil** (antes solo se podía cambiar el nombre borrando la cuenta):

- Backend: `PATCH /api/account/profile` con `require_auth`, límite propio
  (`profile`: 10 peticiones/hora), `clean_text` del nombre (2–60 caracteres,
  colapsa espacios), campus validado contra `CAMPUSES`. Campos privilegiados
  (`email`, `id`, `verified`, `consent_at`) se ignoran explícitamente: el correo
  no es editable porque exigiría volver a verificarlo.
- Frontend: botón «Editar perfil» en la cabecera de Mi área y modal tipo hoja con
  nombre y campus, traducciones nuevas en es/en/gl.
- Tests: `tests/test_profile.py` (4 tests: persistencia, validación, 401 sin
  sesión, campos privilegiados ignorados).

## 5. Archivos modificados

```
app.py                 +34   PATCH /api/account/profile
static/js/app.js       +77   botón + modal de edición, i18n es/en/gl, normalización del nombre
static/css/style.css   +16   sección 21: overflow-wrap y cabecera de acciones
tests/test_profile.py  nuevo 4 tests
QA-RELEASE.md          nuevo este informe
```

## 6. Variables de entorno para Render

Obligatorias en el servicio web (además de las que ya hubiera):

| Variable | Valor recomendado | Por qué |
| --- | --- | --- |
| `CORS_ORIGINS` | `https://TU-SERVICIO.onrender.com` (sin barra final) | Cierra el CORS al dominio real |
| `RATE_LIMIT_ENABLED` | `1` | Activa los límites por IP y por cuenta |
| `TRUST_PROXY` | `1` | Lee la IP real tras el proxy de Render |
| `REPORT_HIDE_THRESHOLD` | `3` | Oculta un objeto tras 3 reportes distintos |
| `SECRET_KEY` / `DATABASE` | los del servicio | Sesiones y ruta del SQLite persistente |
| `SEED_DEMO` | `0` o sin definir | No sembrar datos de demostración en producción |

Arranque: `gunicorn app:app --workers 1 --threads 8 --timeout 60`
(1 proceso: la caché de estadísticas, el rate limiting y SQLite viven en memoria
del proceso; los hilos cubren la concurrencia).

## 7. Pasos manuales pendientes

1. Configurar las variables de la tabla en Render y redesplegar.
2. Tras el despliegue, abrir `/healthz` y comprobar que responde `{"ok": true}`.
3. Recorrer la home, un detalle de artículo y una imagen de catálogo en el dominio
   de producción para confirmar que `/static/img/**` se sirve con bytes (>0).
4. En DevTools, comprobar en 375 px y 1280 px que no hay scroll horizontal y que
   la consola y la pestaña Network están limpias.
5. Cambiar `Content-Security-Policy: frame-ancestors *` por `'self'` cuando ya no
   se use el preview embebido.
6. Probar el flujo de edición de perfil con una cuenta real (nombre con espacios
   dobles y cambio de campus).
