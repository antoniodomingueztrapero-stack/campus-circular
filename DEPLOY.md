# Cómo compartir Campus Circular

Campus Circular es un prototipo independiente presentado en CTC Congress.
**No subas la base de datos ni su URL**: `campus_circular.db` está en `.gitignore`
y `DATABASE_URL` es un secreto que solo se configura en el panel del proveedor.

No hay credenciales compartidas. Cada persona se registra con su propio correo
válido y publica sus objetos. Los objetos de ejemplo pertenecen a
`Equipo Campus Circular`, una cuenta de sistema con contraseña aleatoria y no
utilizable para iniciar sesión.

Antes de compartir un enlace con datos reales, configura un correo de contacto
real y revisa el apartado legal de [README.md](README.md).

---

## Pagos

No hay pasarela de pago, comisión, monedero, depósito en garantía ni reembolso
gestionado por la plataforma. El precio de «Vender» es orientativo y cualquier
pago se acuerda directamente entre particulares, fuera de Campus Circular.
La web lo indica en la portada, al publicar, en la ficha de objeto, en las
normas y en las condiciones de uso.

---

## Vista previa en vivo

Si tu proveedor ofrece un entorno de pruebas con URL temporal, puedes copiar ese
enlace y compartirlo para probar la web en grupo mientras siga activo; para un
enlace estable, despliega en Render.

## Despliegue gratis: Render + PostgreSQL externo

La web se puede servir en el plan gratuito de Render y guardar los datos en un
proveedor PostgreSQL que ofrezca un nivel gratuito (por ejemplo, Neon, si su
plan gratuito está disponible para tu cuenta). No necesitas contratar un disco
persistente de Render. Los límites, pausas y condiciones dependen del proveedor
externo; revisa allí sus condiciones actuales.

1. Crea una base PostgreSQL en el proveedor que elijas. Copia su cadena de
   conexión **con SSL activado** (`postgresql://...`). No la pongas en Git ni
   la envíes por mensajes: es una credencial.
2. Sube el repositorio `campus-circular` a GitHub sin ningún archivo de base de
   datos y conecta esa rama en Render (**New → Blueprint**).
3. El Blueprint configura la web como gratuita y pide `DATABASE_URL` como
   variable secreta. Pega ahí la cadena PostgreSQL del proveedor y guarda.
   También puedes establecerla en **Environment** del servicio existente.
4. Render ejecuta `pip install -r requirements.txt`, arranca con Gunicorn
   (`gunicorn app:app --workers 1 --threads 8`, ver `Procfile` y `render.yaml`)
   y comprueba `/healthz`, una sonda que no consulta la base de datos. Al
   iniciar, la app crea/migra sus tablas en PostgreSQL automáticamente.
   `APP_ENV=production` hace que el servicio falle de forma segura si falta
   `DATABASE_URL`, en vez de recurrir a SQLite efímero.
5. Configura `CONTACT_EMAIL`, `CONTROLLER_NAME` y, si corresponde, las versiones
   legales. Cambia `SEED_DEMO=0` si no quieres objetos de demostración.
   `UNIVERSITY_DOMAINS` permite ajustar, separados por comas, los dominios de
   correo que muestran la insignia informativa de estudiante.
   Deja `ALLOW_EMBED=0` salvo que necesites mostrar la app dentro de un iframe
   ajeno durante el desarrollo: con 0 la CSP envía
   `frame-ancestors 'self'` y `X-Frame-Options: SAMEORIGIN`.
   `CORS_ORIGINS` debe contener tu dominio real (`https://campus-circular.onrender.com`
   o el personalizado): es la única lista de orígenes con permiso para llamar a
   la API desde otro sitio. Deja `RATE_LIMIT_ENABLED=1` y `TRUST_PROXY=1`.
6. Espera a que el health check esté en verde y prueba crear una cuenta; luego
   cierra sesión y vuelve a entrar para comprobar el guardado.

Notas importantes:

- Render puede dormir en el plan gratuito; la base de datos externa conserva
  sus datos según las condiciones y cuotas de su proveedor. Ningún nivel gratis
  garantiza servicio permanente, copias de seguridad ni disponibilidad.
- Mantén privada la URL de conexión y usa la cadena con TLS/SSL del proveedor.
  Nunca la pegues en código, commits, capturas públicas ni en este chat.
- La app crea un esquema vacío; **no importa automáticamente** cuentas antiguas
  de SQLite. Una cuenta que ya desapareció del almacenamiento temporal no puede
  recuperarse desde la app.
- Revisa las cuotas y la política de pausa/expiración del proveedor elegido y
  configura copias exportables si los datos son importantes.
- No configures secretos ni claves de pago: no se integran pagos.
- **Fotos**: se guardan en la tabla `media` de PostgreSQL (`BYTEA`), así que
  sobreviven a cada despliegue y reinicio del plan gratuito. `/static/uploads/…`
  las sirve desde la base si el fichero no está en el disco del contenedor, con
  `Cache-Control: immutable` y ETag. No hay credenciales de almacenamiento de
  objetos que configurar.
- Si algún día el catálogo crece y las fotos pesan demasiado para la base,
  sustituye `store_media`/`read_media` por S3, Cloudinary o Supabase Storage y
  pasa las claves por variables de entorno (documentadas en `.env.example`).
  Nunca las escribas en el código.
- **Exposición (coste 0 €)**: con `SEED_DEMO=1` el botón *Probar al instante*
  crea una cuenta temporal por visitante, sin registro ni servicios externos.
  El catálogo es compartido: lo que publica una persona lo ve el resto al
  momento. Al caducar la cuenta (`DEMO_TTL_HOURS`, 24 h por defecto) **sus
  objetos se conservan** y pasan a la cuenta de muestra, así que la pared de
  objetos del congreso no se vacía; solo se borra la cuenta y su sesión. Con
  muchas personas en el mismo wifi, sube `API_RATE_LIMIT` (por ejemplo 900).
  Las imágenes y el catálogo viajan en el propio repositorio: no hay
  almacenamiento ni base de datos de pago.
- **Arranque en frío**: en el plan gratuito el servicio se suspende sin
  tráfico. La primera visita puede tardar decenas de segundos; la web muestra
  «El servidor se está despertando» a partir de 2,5 s y ofrece reintento si
  falla la red. Un monitor de uptime que llame a `/healthz` cada pocos minutos
  reduce las esperas.
- No uses marcas institucionales ni presentes la web como servicio oficial.

## Ejecutarla en local

```bash
cd campus-circular
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python3 app.py
# Abrir http://127.0.0.1:5000
```

Puedes comprimir la carpeta y compartirla, pero cada ordenador tendrá su
propia copia con sus propios datos. Excluye siempre `campus_circular.db`,
`.venv/`, `__pycache__/` y `static/uploads/*`.

---

## Mensaje listo para compartir

> Hola! He montado **Campus Circular**, un prototipo independiente para dar una
> segunda vida a libros, ropa, muebles, calculadoras y otros materiales.
>
> Entrad aquí: **[PEGA AQUÍ EL ENLACE]**
> 1. Pulsad **Crear cuenta** y registráos con vuestro correo.
> 2. Pulsad **Publicar** y subid un objeto que ya no uséis, con foto y una
>    descripción honesta de su estado.
> 3. Buscad lo que necesitéis y enviad una solicitud. Quedamos en un lugar
>    público y acordamos la entrega.
>
> Está en español, inglés y gallego. Importante: **no hay pagos dentro de la
> web**; si alguien indica un precio, es orientativo y se acuerda directamente
> entre particulares, fuera de la plataforma. No es un servicio oficial de
> ninguna universidad. Si algo falla, me decís y lo arreglo. ¡Gracias!

---

## Seguridad en producción

- **CORS**: `CORS_ORIGINS` con tu dominio exacto (sin barra final). Cualquier
  otro origen no recibe cabeceras CORS y el navegador no puede leer la API.
  Como la autenticación usa cabecera `Authorization` y no cookies, no hace falta
  `Access-Control-Allow-Credentials`.
- **Límites**: activos por defecto (`RATE_LIMIT_ENABLED=1`). Devuelven `429`
  con `Retry-After`. Se aplican por IP (resuelta con `ProxyFix`) y por cuenta.
  El despliegue usa **un worker con 8 hilos** para que los contadores sean
  exactos y el consumo de RAM bajo; si algún día se añaden más workers, el
  límite efectivo se multiplica y conviene un almacén compartido (Redis).
- **Cabeceras**: CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `Cross-Origin-Opener-Policy` y HSTS cuando la petición llega por HTTPS
  (`X-Forwarded-Proto` con `TRUST_PROXY=1`).
- **Moderación**: un reporte por cuenta y objeto; a los
  `REPORT_HIDE_THRESHOLD` reportes de cuentas distintas (3 por defecto) el
  objeto sale del catálogo y de las estadísticas, y su dueño ve «En revisión».
  Comprobación rápida tras un incidente:

```sql
SELECT r.created_at, r.reason, r.comment, i.id, i.title, i.hidden_at
FROM reports r JOIN items i ON i.id = r.item_id
ORDER BY r.created_at DESC LIMIT 50;
```

- **Sesiones**: tokens hasheados en la base, caducidad de 30 días y máximo 8 por
  cuenta. Cerrar sesión borra el token de ese dispositivo.
- **Revisión periódica recomendada**: `reports` abiertos, cuentas creadas en la
  última hora, objetos retirados y errores 429 anómalos en los logs de Render.
- **Nunca** subas `.env`, `campus_circular.db` ni la URL de PostgreSQL al
  repositorio: `.gitignore` ya los excluye.

## Rendimiento y caché

- `/api/items` y `/api/items/mine` aceptan `limit` (máximo 60) y `offset` y
  devuelven `total` y `has_more`; el catálogo pide 24 y añade «Cargar más».
- `/api/stats` se cachea 15 s en memoria y se invalida al crear, editar o
  borrar objetos y al cambiar el estado de una entrega.
- HTML, JSON, CSS y JS se comprimen con Gzip si superan 700 bytes. CSS y JS se
  sirven con ETag, `Cache-Control: immutable` de un año y `?v=<huella>`.
- Las fotos se reescalan a 1200 px, se convierten a WebP (calidad 82 → 45 hasta
  ≤400 KB) y pierden los metadatos EXIF/GPS antes de guardarse.
- Las imágenes del sitio (`static/img`) tienen variantes WebP a 320/480/720 px
  y un respaldo JPEG/PNG de 800 px, servidas con `<picture>` + `srcset`. El
  manifiesto (`static/img/manifest.json`) se inyecta en el HTML, así que no hay
  peticiones extra. Con esto la portada pasa de ~1,5 MB a ~340 KB en móvil y
  ~186 KB en escritorio. Si añades fotos nuevas: `.venv/bin/python
  tools/optimize_images.py` y commitea las variantes y el manifiesto.
- Índices: `(status, created_at)`, `category`, `campus`, `(owner_id,
  created_at)`, `requests(requester_id|status)`, `sessions(user_id)`,
  `media(created_at)`.

## Verificación rápida

- `/healthz` responde `{"ok": true}` sin tocar la base de datos y es la ruta que
  usa Render como health check; `/api/health` añade producto y versión legal.
- `curl -H "Accept-Encoding: gzip" -sI https://TU-SERVICIO.onrender.com/`
  devuelve `Content-Encoding: gzip` y `Cache-Control`.
- No existe ninguna credencial compartida: un correo no registrado no puede
  entrar.
- `/aviso-legal`, `/privacidad` y `/condiciones` cargan directamente y están
  enlazados desde el pie en los tres idiomas.
- El registro exige casilla de consentimiento sin marcar; sin ella devuelve
  `consent_required`.
- Crear un objeto exige `private_seller: true` y solo acepta imágenes locales.
- Desde **Mi área** se pueden descargar los datos y eliminar la cuenta.
- El repositorio no contiene `.db`, `.sqlite`, `.sqlite3` ni volcados SQL.
- Las fotos subidas siguen apareciendo después de un redespliegue (viven en
  `media`, no en el disco del contenedor).
- `.env.example` documenta las variables sin credenciales reales.

---

## Equipo

Pavlo Kovalenko · Karen Itzel Sandoval Ramos · Okechukwu Patrick Okeh ·
Fernando Heriberto Cardenas Rubi · Alba Grille Louro · Filip Juran ·
Greypher Alisander Garcia Alvarado · Jacob Schaal · Antonio Domínguez Trapero

---

Campus Circular · CTC Congress
