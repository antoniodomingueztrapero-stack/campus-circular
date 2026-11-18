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
  sesión. En el despliegue gratuito, la base SQLite en `/tmp` puede ser
  efímera; un reinicio puede borrar datos, lo cual **no sustituye** una
  supresión formal ni una copia de seguridad.
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
| Base de datos | SQLite mediante `sqlite3` de la biblioteca estándar |
| Frontend | HTML + CSS + JavaScript vanilla, SPA sin build |
| i18n | ES / EN / GL en `static/js/app.js` y documentos legales |
| Auth | Token Bearer en `localStorage`, sesiones en BD, contraseñas con `werkzeug` |
| Imágenes | Fotografías locales en `static/img/` y subidas en `static/uploads/` |
| Seguridad | Validación en servidor, CSP, magic bytes, rutas locales, minimización |

Sin dependencias de frontend que compilar: `pip install -r requirements.txt`
y `python3 app.py` bastan.

## Estructura

```text
campus-circular/
├── app.py                  # API, arranque, seguridad, seed y derechos de cuenta
├── templates/index.html    # Shell SPA, cabecera, pie y configuración legal
├── static/
│   ├── css/style.css       # Diseño responsive y estilos de documentos legales
│   ├── js/app.js           # SPA, i18n, vistas, modales y cliente API
│   ├── img/                # Marca revisada, CTC Congress, equipo y fotografías locales
│   └── uploads/            # Imágenes subidas (ignoradas en Git)
├── requirements.txt
├── render.yaml
├── Procfile
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

La base y los objetos de ejemplo se crean automáticamente en el primer arranque.
El propietario de ejemplo es `Equipo Circular Campus`, con contraseña aleatoria
y no utilizable para iniciar sesión. Para reiniciar el demo, elimina el archivo
de base de datos configurado y vuelve a arrancar.

## Configuración

| Variable | Valor por defecto | Uso |
|---|---|---|
| `DATABASE` | `campus_circular.db` junto a `app.py` | Ruta SQLite; en Render se usa `/tmp/campus_circular.db` |
| `PORT` | `5000` | Puerto de escucha, `0.0.0.0` |
| `SEED_DEMO` | `1` | `0` desactiva los objetos de ejemplo |
| `CONTACT_EMAIL` | `privacidad@circular-campus.example` | **Sustituir por un correo real antes de producción** |
| `CONTROLLER_NAME` | `Equipo Circular Campus (proyecto académico independiente)` | Responsable editorial mostrado en los textos legales |
| `LEGAL_VERSION` | `2026-11-17` | Versión del consentimiento; cambiarla fuerza renovación |
| `LEGAL_UPDATED` | `2026-11-17` | Fecha visible en los documentos |

No se necesita `SECRET_KEY`: la app no usa cookies de sesión de Flask, sino
tokens Bearer aleatorios almacenados en el navegador.

## Funcionalidades

- **Explorar**: búsqueda, filtros por categoría, campus, estado, tipo y orden.
- **Publicar**: título, descripción honesta, categoría, estado, tipo, campus,
  punto de entrega, foto local y confirmación obligatoria de particular.
- **Precio orientativo**: visible solo en «Vender», con un aviso claro de que
  no hay pagos gestionados por la plataforma.
- **Solicitar**: mensaje breve; la otra persona acepta, rechaza o marca entrega.
- **Mi área**: objetos, solicitudes enviadas/recibidas, favoritos y panel de
  datos con exportación y supresión.
- **Confianza**: estado del objeto, normas, entrega en lugar público y nota
  clara de que no hay verificación oficial.
- **Puntos de entrega**: etiquetas orientativas; no son puntos oficiales.
- **Legal**: aviso legal, privacidad y condiciones en tres idiomas, con
  impresión/guardado en PDF desde el navegador.
- **Trilingüe**: ES / EN / GL con selector y rutas directas.
- **Estadísticas**: contadores reales de la base, sin métricas de impacto
  inventadas.

## API (resumen)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | — | Estado, producto y versión legal |
| GET | `/api/stats` | — | Contadores reales y categorías |
| GET | `/api/items` | — | Listar objetos y filtros |
| GET | `/api/items/:id` | — | Detalle con propietario mínimo, sin email |
| POST | `/api/items` | ✓ | Crear objeto; exige `private_seller` |
| PATCH | `/api/items/:id` | ✓ dueño | Cambiar estado |
| DELETE | `/api/items/:id` | ✓ dueño | Eliminar objeto e imagen subida |
| POST | `/api/upload` | ✓ | Subir imagen local validada por extensión y magic bytes |
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
| PATCH | `/api/requests/:id` | ✓ | Aceptar/rechazar/completar/cancelar |
| POST | `/api/items/:id/favorite` | ✓ | Alternar favorito |
| GET | `/api/favorites` | ✓ | Favoritos |
| GET | `/api/users/:id` | — | Perfil público mínimo |

Rutas SPA directas: `/`, `/publicar`, `/puntos`, `/normas`, `/proyecto`,
`/mi-area`, `/aviso-legal`, `/privacidad`, `/condiciones`.

## Criterios de ingeniería

- **SQLite + stdlib**: cero fricción para clase, sandbox y vista previa;
  migrable a Postgres cambiando `get_db()` y las consultas.
- **Migración tolerante**: `migrate_db()` añade `consent_at` y
  `consent_version` a bases creadas por versiones anteriores.
- **Arranque WSGI-compatible**: `bootstrap()` se ejecuta al importar el módulo,
  no solo con `python3 app.py`.
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
- El plan gratuito de Render puede reiniciar el servicio y perder la base
  efímera; no es adecuado para datos reales sin persistencia y copias.
- Solo se cuentan objetos, disponibilidad, entregas marcadas y cuentas.
- Antes de uso real con datos personales o actividad económica, completa la
  identificación del responsable, el correo de contacto y una revisión
  jurídica/fiscal/LSSI específica.

## Despliegue

Consulta [DEPLOY.md](DEPLOY.md). El Blueprint usa `healthCheckPath: /api/health`,
`DATABASE=/tmp/campus_circular.db` y no incluye secretos ni base de datos.

---

## Equipo

Pavlo Kovalenko · Karen Itzel Sandoval Ramos · Okechukwu Patrick Okeh ·
Fernando Heriberto Cardenas Rubi · Alba Grille Louro · Filip Juran ·
Greypher Alisander Garcia Alvarado · Jacob Schaal · Antonio Domínguez Trapero

---

Circular Campus · CTC Congress
