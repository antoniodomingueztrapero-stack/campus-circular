# Cómo compartir Circular Campus

Circular Campus es un prototipo independiente presentado en CTC Congress.
**No subas la base de datos ni su URL**: `campus_circular.db` está en `.gitignore`
y `DATABASE_URL` es un secreto que solo se configura en el panel del proveedor.

No hay credenciales compartidas. Cada persona se registra con su propio correo
válido y publica sus objetos. Los objetos de ejemplo pertenecen a
`Equipo Circular Campus`, una cuenta de sistema con contraseña aleatoria y no
utilizable para iniciar sesión.

Antes de compartir un enlace con datos reales, configura un correo de contacto
real y revisa el apartado legal de [README.md](README.md).

---

## Pagos

No hay pasarela de pago, comisión, monedero, depósito en garantía ni reembolso
gestionado por la plataforma. El precio de «Vender» es orientativo y cualquier
pago se acuerda directamente entre particulares, fuera de Circular Campus.
La web lo indica en la portada, al publicar, en la ficha de objeto, en las
normas y en las condiciones de uso.

---

## Vista previa en vivo

La web puede abrirse desde el botón de vista previa del entorno de desarrollo.
Copia ese enlace y compártelo para probarla. Está disponible mientras el
servicio siga activo; para un enlace estable, usa Render.

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
4. Render ejecuta `pip install -r requirements.txt`, arranca `python3 app.py`
   y comprueba `/api/health`. Al iniciar, la app crea/migra sus tablas en
   PostgreSQL automáticamente. `APP_ENV=production` hace que el servicio falle
   de forma segura si falta `DATABASE_URL`, en vez de recurrir a SQLite efímero.
5. Configura `CONTACT_EMAIL`, `CONTROLLER_NAME` y, si corresponde, las versiones
   legales. Cambia `SEED_DEMO=0` si no quieres objetos de demostración.
   `UNIVERSITY_DOMAINS` permite ajustar, separados por comas, los dominios de
   correo que muestran la insignia informativa de estudiante.
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

> Hola! He montado **Circular Campus**, un prototipo independiente para dar una
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

## Verificación rápida

- `/api/health` responde con `ok: true`, `product: Circular Campus` y la versión
  legal.
- No existe ninguna credencial compartida: un correo no registrado no puede
  entrar.
- `/aviso-legal`, `/privacidad` y `/condiciones` cargan directamente y están
  enlazados desde el pie en los tres idiomas.
- El registro exige casilla de consentimiento sin marcar; sin ella devuelve
  `consent_required`.
- Crear un objeto exige `private_seller: true` y solo acepta imágenes locales.
- Desde **Mi área** se pueden descargar los datos y eliminar la cuenta.
- El repositorio no contiene `.db`, `.sqlite`, `.sqlite3` ni volcados SQL.

---

## Equipo

Pavlo Kovalenko · Karen Itzel Sandoval Ramos · Okechukwu Patrick Okeh ·
Fernando Heriberto Cardenas Rubi · Alba Grille Louro · Filip Juran ·
Greypher Alisander Garcia Alvarado · Jacob Schaal · Antonio Domínguez Trapero

---

Circular Campus · CTC Congress
