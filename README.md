# Circular Campus

**Prototipo independiente de reutilización e intercambio de materiales de segunda vida.**

**Independent prototype for reusing and exchanging second-life materials.**

> Proyecto presentado en **CTC Congress**. No es un servicio oficial, avalado ni
> gestionado por ninguna universidad. Las etiquetas Vigo, Pontevedra y Ourense
> son únicamente referencias geográficas para organizar entregas.

Circular Campus permite publicar, buscar, guardar y solicitar objetos usados:
libros, ropa, muebles, material de estudio, electrónica, cocina, pequeños
electrodomésticos, deporte y otros. La interfaz está en **español, inglés y
gallego**. No hay cuentas de demostración compartidas: cada persona se registra
con su propio correo.

---

## Pagos

Circular Campus no procesa pagos, no cobra comisiones, no custodia fondos, no
ofrece depósito en garantía, no emite reembolsos, no garantiza objetos ni media
en disputas.

- «Vender» muestra únicamente un **precio orientativo** y sirve para iniciar un
  contacto.
- Cualquier contraprestación se acuerda **directamente entre particulares, fuera
  de la plataforma**, por ejemplo en efectivo o mediante un pago directo persona
  a persona en la entrega.
- No se admiten vendedores profesionales ni actividad comercial habitual.
- El aviso aparece en la portada, al publicar, en la ficha del objeto, en las
  normas, en las condiciones de uso y en el pie de página.

---

## Privacidad y datos

La web aplica minimización desde el diseño y el enfoque de información por capas
del RGPD y la LOPDGDD:

- **Consentimiento explícito**: casilla sin marcar en el registro, con enlaces a
  la [política de privacidad](/privacidad) y a las [condiciones](/condiciones);
  se guardan fecha y versión del consentimiento.
- **Aviso legal, privacidad y condiciones** en ES / EN / GL, accesibles desde el
  pie y por URL directa: `/aviso-legal`, `/privacidad`, `/condiciones`.
- **Datos mínimos**: nombre visible, email, contraseña con hash, campus,
  publicaciones, favoritos, solicitudes y token de sesión. No se guarda IP
  asociada a la cuenta.
- **Sin email en perfiles públicos**: la ficha de objeto solo muestra nombre,
  campus y una insignia informativa de dominio académico. Esa insignia **no
  verifica matrícula, identidad ni pertenencia institucional**.
- **Derechos realizables en la app**: `/api/account/export` descarga los datos
  propios en JSON; `/api/account/delete` elimina cuenta, sesiones, objetos,
  favoritos, solicitudes propias y ficheros subidos. El borrado pide la
  contraseña actual.
- **Renovación de consentimiento**: si cambia `LEGAL_VERSION`, una cuenta
  antigua ve un aviso no descartable y no puede publicar hasta aceptar la
  versión vigente.
- **Retención**: las sesiones caducan a los 30 días y se limpian al iniciar
  sesión. En despliegue se puede usar PostgreSQL externo mediante `DATABASE_URL`
  para no depender del disco efímero de Render. Revisa las cuotas y copias del
  proveedor elegido; un nivel gratuito no garantiza disponibilidad.
- **Cero rastreadores**: sin analítica, píxeles, cookies publicitarias, fuentes
  externas ni CDN de imágenes. Las imágenes de ejemplo y de categoría son
  locales y las fotos se suben al propio servicio.
- **Cabeceras de seguridad**: CSP local, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy` y `Cache-Control: no-store` en rutas de cuenta/auth.

Antes de un despliegue institucional con datos reales, sustituye el correo de
contacto por uno real, identifica correctamente al responsable, revisa el
artículo 10 de la LSSI si el servicio pasa a ser económico y coordina con la
delegación de protección de datos correspondiente. Este README no es
asesoramiento jurídico, fiscal o de consumo.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python 3 + Flask 3, API REST JSON |
| Base de datos | SQLite local; PostgreSQL gestionado en despliegue mediante `psycopg` |
| Frontend | HTML + CSS + JavaScript vanilla, SPA sin build |
| i18n | ES / EN / GL en `static/js/app.js` y documentos legales |
| Auth | Token Bearer en `localStorage`, sesiones en BD, contraseñas con `werkzeug` |
| Imágenes | Ilustraciones en `static/img/`; fotos subidas optimizadas a WebP ≤1200 px y guardadas en la tabla `media` de la base de datos (persisten entre despliegues) |
| Producción | Gunicorn, paginación por `limit`/`offset`, Gzip, ETag y caché inmutable de estáticos, `/healthz` |
| Seguridad | Validación en servidor, CSP, magic bytes, rutas locales, minimización |

Sin dependencias de frontend que compilar: `pip install -r requirements.txt`
y `python3 app.py` bastan.

## Estructura

```text
campus-circular/
├── app.py                  # API, arranque, seguridad, seed y derechos de cuenta
├── templates/index.html    # Shell SPA, cabecera, pie y configuración legal
├── static/
│   ├── css/style.css       # Tokens de diseño, componentes, responsive y documentos legales
│   ├── js/app.js           # SPA, i18n, vistas, modales y cliente API
│   ├── img/                # Marca revisada, CTC Congress, equipo y fotografías locales
│   └── uploads/            # Solo fotos antiguas: se importan a la BD al arrancar
├── tests/                  # 24 pruebas de API, cuenta, producto y producción
├── requirements.txt
├── render.yaml
├── Procfile
├── .env.example            # Variables documentadas, sin credenciales
├── DEPLOY.md
└── .gitignore
```

`campus_circular.db` se crea solo al arrancar y está ignorada. **No se sube la
base de datos al repositorio.**

## Cómo ejecutar

```bash
cd campus-circular
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python3 app.py
# Abrir http://127.0.0.1:5000
```

Opcionalmente, copia `.env.example` a `.env` y ajusta las variables (la app lee
el entorno del sistema; no carga `.env` automáticamente). Para ejecutar las
pruebas:

```bash
python3 -m unittest discover -s tests
```

La base y los objetos de ejemplo se crean automáticamente en el primer arranque:
12 objetos disponibles, 8 entregas con fecha, valoraciones de ejemplo y dos
perfiles de demostración (`Lucía Ferreiro` y `Diego Camba`) con contraseña
aleatoria. La cuenta propietaria del tablón es `Equipo Circular Campus`, también
sin acceso. Para reiniciar el demo, elimina el archivo de base de datos
configurado y vuelve a arrancar.

## Configuración

Todas las variables están documentadas, sin credenciales reales, en
[`.env.example`](.env.example). En Render se definen en *Environment*; nunca en
el repositorio.

| Variable | Valor por defecto | Uso |
|---|---|---|
| `DATABASE` | `campus_circular.db` junto a `app.py` | Ruta SQLite local, ignorada en Git |
| `DATABASE_URL` | vacío | URL secreta de PostgreSQL para despliegue; si está definida, usa PostgreSQL en lugar de SQLite |
| `APP_ENV` | `development` | Con `production`, exige `DATABASE_URL` y evita arrancar con SQLite efímero |
| `PORT` | `5000` | Puerto de escucha, `0.0.0.0` |
| `SEED_DEMO` | `1` | `0` desactiva los objetos de ejemplo |
| `CONTACT_EMAIL` | `privacidad@circular-campus.example` | **Sustituir por un correo real antes de producción** |
| `CONTROLLER_NAME` | `Equipo Circular Campus (proyecto académico independiente)` | Responsable editorial mostrado en los textos legales |
| `LEGAL_VERSION` | `2026-11-20` | Versión del consentimiento; cambiarla fuerza renovación |
| `LEGAL_UPDATED` | `2026-11-20` | Fecha visible en los documentos |
| `UNIVERSITY_DOMAINS` | lista interna (uvigo.gal, udc.es, usc.es, …) | Dominios de correo institucional que muestran la insignia informativa, separados por comas |

No se necesita `SECRET_KEY`: la app no usa cookies de sesión de Flask, sino
tokens Bearer aleatorios almacenados en el navegador. Tampoco se necesitan
credenciales de almacenamiento de objetos: las fotos viven en la base de datos.

## Funcionalidades

- **Explorar**: búsqueda instantánea con debounce (sin distinguir acentos:
  «lampara» encuentra «Lámpara»), filtros combinables por categoría, campus,
  tipo de operación, estado físico y facultad, y orden por precio o novedad.
- **Publicar en menos de un minuto**: solo son obligatorios foto, título,
  categoría y tipo de entrega; descripción, estado, campus, facultad y punto de
  encuentro se pueden dejar sin rellenar y el formulario aplica valores
  razonables (estado «bueno», punto «lugar acordado»).
- **Precio orientativo**: visible solo en «Vender», con un aviso claro de que
  no hay pagos gestionados por la plataforma.
- **Ciclo de vida explícito**: `Disponible → Reservado → Entregado`. Aceptar
  una solicitud reserva el objeto, completarlo lo marca como entregado con
  fecha, cancelar o rechazar lo devuelve al tablón y el resto de solicitudes
  pendientes se cierran al entregar.
- **Punto de encuentro**: la solicitud propone biblioteca, conserjería,
  cafetería, entrada, punto señalizado o lugar acordado, y la otra persona
  puede ajustarlo al aceptar.
- **Confianza**: insignia automática de correo institucional (informativa, no
  acredita matrícula), media de valoraciones 1–5 con comentarios, historial de
  intercambios completados, nivel por actividad y badges de trayectoria.
- **Valoración rápida**: tras cerrar una entrega, ambas partes pueden puntuar
  y comentar una sola vez; el comentario es público y no editable.
- **Impacto estimado**: objetos reutilizados, kilos de residuos evitados y
  ahorro económico estimados por categoría, en la portada y en Mi área.
- **Mi área**: objetos, solicitudes enviadas/recibidas, favoritos, panel de
  confianza y datos de la cuenta con exportación y supresión.
- **Puntos de entrega**: etiquetas orientativas; no son puntos oficiales.
- **Legal**: aviso legal, privacidad y condiciones en tres idiomas, con
  impresión/guardado en PDF desde el navegador.
- **Trilingüe**: ES / EN / GL con selector y rutas directas.

### Cómo se calcula el impacto

Las cifras son **estimaciones transparentes**, no mediciones ni una auditoría
ambiental. `CATEGORY_IMPACT` en `app.py` asigna a cada categoría un peso medio
y un valor de reposición; por cada objeto con estado `entregado` se suman esos
valores. En las ventas simbólicas el ahorro es la diferencia entre el valor de
reposición y el precio orientativo. La interfaz lo etiqueta siempre como
estimación y las condiciones de uso lo dejan por escrito.


## Interfaz y sistema de diseño

La interfaz es **mobile-first**: en móvil se navega con una barra inferior fija
y en escritorio con la barra superior. El catálogo usa tarjetas escaneables en
lugar de tablas densas.

**Tokens** (`:root` en `static/css/style.css`)

| Grupo | Variables | Uso |
|---|---|---|
| Verde orgánico | `--green-50 … --green-900` | marca, botones primarios, estados disponibles |
| Neutros cálidos | `--sand-50 … --sand-300`, `--ink`, `--ink-2`, `--muted` | fondos, jerarquía de texto |
| Semánticos | `--amber-*`, `--red-*`, `--blue-*`, `--coral-*` | reservado/pendiente, rechazado/cancelado, entregado, avisos de pago |
| Tipografía | `--font`, `--font-display`, `--text-xs … --text-3xl` | escala fluida con `clamp()`; serif editorial solo en titulares |
| Espacio y forma | `--s1 … --s16`, `--r-xs … --r-xl`, `--shadow-xs … --shadow-lg` | ritmo de 4 px, radios y elevación consistentes |
| Movimiento | `--ease`, `--fast`, `--slow` | transiciones cortas y predecibles |

**Componentes unificados**: `.btn` (primario, fantasma, suave, peligro),
`.chip`, `.pill`, `.badge`, `.status-pill`, `.card`, `.list-card`, `.field`,
`.upload-zone`, `.segment`, `.modal` (hoja inferior en móvil), `.toast`,
`.empty`, `skeleton`, `.notice`, `.impact-band`, `.trust-panel`, `.stars`,
`.rating-list`, `.badge-chip`, `.level-track` y `.rate-option`. La presentación se resuelve con variables y
clases; no se usan estilos inline para diseño.

**Experiencia móvil**

- Barra inferior fija (`< 960 px`) con cinco destinos y botón central de
  publicar; los mismos destinos aparecen en la barra superior de escritorio.
- Áreas táctiles mínimas de 44 × 44 px: `@media (pointer: coarse)` refuerza
  botones pequeños, chips y enlaces del pie.
- Chips de categoría en una fila con scroll horizontal, pegajosa en escritorio.
- Filtros de campus, estado, tipo, facultad y orden en una hoja inferior con
  «Ver resultados» y contador de filtros activos; la búsqueda del hero filtra
  en vivo con 320 ms de debounce y sin recargar la página.
- Ficha del objeto como hoja inferior, con acciones pegadas al borde
  (solicitar/guardar) y avisos secundarios plegados en `<details>`.
- Tarjetas con foto, título, categoría, estado, campus y acción principal; en
  móvil se oculta la descripción para priorizar el catálogo.
- Banda de impacto bajo las cifras de la portada y panel de confianza en Mi
  área (nivel, insignias, valoraciones e impacto propio) que se carga aparte
  para no bloquear el resto de la vista.
- Valoración con radios nativos de 44 px y comentario opcional; el estado
  «Valorado con n/5» sustituye al botón cuando ya se ha puntuado.

**Estados de interfaz**

- `skeleton` al cargar catálogo, estadísticas y «Mi área» (nunca pantallas en
  blanco).
- Estados vacíos accionables: publicar el primero, limpiar filtros o explorar.
- Errores con «Reintentar» y avisos `toast` con icono, cierre manual y barra de
  progreso; `toast` distinto para éxito, error e información.
- Botones de envío con `spinner` y texto («Publicando…», «Enviando…»,
  «Guardando…»).

**Accesibilidad**

- Contraste WCAG AA en texto principal y secundario, badges de estado y botones
  (≥ 4.5:1 para texto normal; el foco visible se adapta sobre fondos oscuros).
- Diálogos con `role="dialog"`, `aria-modal`, foco atrapado, cierre con `Escape`
  y restauración del foco al elemento de origen.
- `aria-pressed` en filtros y favoritos, `aria-selected` en pestañas,
  `aria-current="page"` en navegación y regiones `aria-live` para resultados y
  avisos.
- Enlace «saltar al contenido», etiquetas explícitas en todos los campos, iconos
  decorativos con `aria-hidden` y respeto a `prefers-reduced-motion`.

Los textos nuevos se añaden en los tres idiomas de `I18N` (`static/js/app.js`);
una comprobación rápida es que `es`, `en` y `gl` mantengan las mismas claves.

## API (resumen)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/healthz` | — | Sonda ligera para Render y monitores, sin consultas a BD |
| GET | `/api/health` | — | Estado, producto y versión legal |
| GET | `/api/stats` | — | Contadores reales, categorías e impacto estimado (caché de 15 s) |
| GET | `/api/impact/me` | ✓ | Impacto, valoraciones, nivel y badges propios |
| GET | `/api/items` | — | Listar objetos con filtros (`q`, `category`, `campus`, `condition`, `type`, `faculty`, `status`, `sort`) y paginación (`limit` ≤ 60, `offset`); devuelve `total` y `has_more` |
| GET | `/api/items/mine` | ✓ | Objetos propios, paginados |
| GET | `/api/items/:id` | — | Detalle con impacto y confianza del propietario, sin email |
| POST | `/api/items` | ✓ | Crear objeto; exige `private_seller`, foto y tipo |
| PATCH | `/api/items/:id` | ✓ dueño | Cambiar estado |
| DELETE | `/api/items/:id` | ✓ dueño | Eliminar objeto e imagen subida |
| POST | `/api/upload` | ✓ | Subir JPG/PNG/WebP: valida magic bytes, recorta a 1200 px, convierte a WebP ≤400 KB y borra EXIF/GPS; guarda en `media` y devuelve la URL |
| POST | `/api/auth/register` | — | Registro con `consent: true` |
| POST | `/api/auth/login` | — | Login → token |
| POST | `/api/auth/logout` | ✓ | Cerrar sesión actual |
| GET | `/api/auth/me` | — | Usuario actual y versión legal |
| POST | `/api/account/consent` | ✓ | Renovar consentimiento |
| GET | `/api/account/export` | ✓ | Exportar datos propios en JSON |
| DELETE | `/api/account/delete` | ✓ + contraseña | Suprimir cuenta y datos asociados |
| POST | `/api/items/:id/request` | ✓ | Solicitar objeto |
| GET | `/api/requests/mine` | ✓ | Solicitudes enviadas |
| GET | `/api/requests/received` | ✓ | Solicitudes recibidas |
| PATCH | `/api/requests/:id` | ✓ | Aceptar/rechazar/completar/cancelar y ajustar el punto |
| POST | `/api/requests/:id/rate` | ✓ | Valorar (1–5) una entrega completada |
| POST | `/api/items/:id/favorite` | ✓ | Alternar favorito |
| GET | `/api/favorites` | ✓ | Favoritos |
| GET | `/api/users/:id` | — | Perfil público mínimo con valoraciones y badges |

Rutas SPA directas: `/`, `/publicar`, `/puntos`, `/normas`, `/proyecto`,
`/mi-area`, `/aviso-legal`, `/privacidad`, `/condiciones`.

## Criterios de ingeniería

- **SQLite local + PostgreSQL alojado**: el mismo código funciona con SQLite
  para desarrollo y con PostgreSQL mediante `DATABASE_URL` para desplegar sin
  depender de almacenamiento local persistente.
- **Migración tolerante e idempotente**: `migrate_db()` añade
  `consent_at`, `consent_version`, `faculty`, `delivered_at` y el punto
  propuesto de cada solicitud a bases creadas por versiones anteriores, en
  SQLite y PostgreSQL, y rellena `delivered_at` de las entregas antiguas.
- **Valoración ligada a la entrega**: la tabla `ratings` es única por
  `(request_id, rater_id)`, solo admite solicitudes `completada` y participantes,
  y nunca permite autovalorarse.
- **Impacto calculado en servidor**: el cliente no envía cifras; se derivan de
  los objetos entregados y se muestran como estimación.
- **Arranque WSGI-compatible**: `bootstrap()` se ejecuta al importar el módulo,
  no solo con `python3 app.py`; en Render arranca con Gunicorn (`Procfile` y
  `render.yaml`).
- **Nada se pierde al redesplegar**: las fotos se guardan en la tabla `media`
  (`BYTEA` en PostgreSQL) y `/static/uploads/<archivo>` las sirve desde la base
  si el fichero no existe en disco. Al arrancar se importan las fotos antiguas
  del disco (`sync_uploads_to_db`) y se limpian las que nunca se publicaron.
- **Listados paginados**: `/api/items` y `/api/items/mine` aceptan `limit` y
  `offset`, devuelven `total` y `has_more`, y el catálogo pide páginas de 24 con
  un botón «Cargar más» en lugar de descargar toda la tabla.
- **Índices para los filtros reales**: `(status, created_at)`, `category`,
  `campus`, `(owner_id, created_at)`, además de los de solicitudes, sesiones y
  valoraciones.
- **Respuestas comprimidas y cacheadas**: Gzip para HTML/JSON/CSS/JS por encima
  de 700 bytes; CSS y JS se sirven con ETag, `immutable` y `?v=<huella del
  contenido>`; el shell SPA lleva `stale-while-revalidate` para pintar aunque el
  servicio esté despertando.
- **Aviso de arranque en frío**: si una petición tarda más de 2,5 s, el
  frontend muestra «El servidor se está despertando» y distingue los fallos de
  red con un reintento, en vez de dejar la pantalla congelada.
- **Validación en servidor** de longitudes, enumeraciones, precio, imagen,
  consentimiento y condición de particular.
- **CSP sin scripts inline**: la configuración se pasa como JSON en un bloque
  `application/json`; no hay manejadores `onclick` ni `onerror` embebidos.
- **Recursos propios**: se rechazan URL externas para imágenes de objeto.
- **i18n en frontend**: la API guarda el contenido tal como lo escribe la
  persona; las etiquetas y documentos se traducen en cliente.

## Limitaciones honestas

- No hay verificación real de matrícula, identidad ni titularidad de objetos.
- No hay moderación ni reportes todavía.
- En Render gratuito configura `DATABASE_URL` con PostgreSQL gestionado; si no,
  SQLite quedará en almacenamiento efímero y podría borrarse al reiniciar.
  Revisa los límites, pausas y copias del proveedor PostgreSQL.
- El plan gratuito de Render suspende el servicio por inactividad: la primera
  visita puede tardar decenas de segundos. La interfaz lo avisa, pero no se
  puede eliminar sin un plan de pago o un monitor externo.
- Las fotos ocupan espacio en la base de datos. Para un catálogo grande conviene
  moverlas a almacenamiento de objetos (S3, Cloudinary o Supabase Storage) con
  credenciales por variables de entorno; el código está preparado para cambiar
  `store_media`/`read_media` sin tocar las rutas.
- Las cifras de impacto son estimaciones por categoría, no mediciones: sirven
  para dar orden de magnitud y se etiquetan como tales.
- Las valoraciones no tienen moderación automática: son texto de las personas
  usuarias y pueden requerir revisión manual.
- Antes de uso real con datos personales o actividad económica, completa la
  identificación del responsable, el correo de contacto y una revisión
  jurídica/fiscal/LSSI específica.

## Despliegue

Consulta [DEPLOY.md](DEPLOY.md). El Blueprint usa el plan gratuito de Render,
`healthCheckPath: /healthz`, Gunicorn con 2 workers y 4 hilos, y solicita
`DATABASE_URL` para conectar PostgreSQL externo. La URL de base de datos es
secreta: no la guardes en Git.

---

## Equipo

Pavlo Kovalenko · Karen Itzel Sandoval Ramos · Okechukwu Patrick Okeh ·
Fernando Heriberto Cardenas Rubi · Alba Grille Louro · Filip Juran ·
Greypher Alisander Garcia Alvarado · Jacob Schaal · Antonio Domínguez Trapero

---

Circular Campus · CTC Congress
