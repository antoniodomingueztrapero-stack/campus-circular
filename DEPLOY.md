# Cómo compartir Circular Campus

Circular Campus es un prototipo independiente presentado en CTC Congress.
**No subas la base de datos**: `campus_circular.db` ya está en `.gitignore` y
el despliegue de Render usa una base efímera en `/tmp`.

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

## Enlace permanente gratis con Render

Render ofrece un plan gratuito con URL pública como
`https://campus-circular.onrender.com`. Solo necesitas una cuenta de GitHub.

1. Sube el repositorio `campus-circular` a GitHub **sin la base de datos**
   (ya está ignorada).
2. Entra en <https://render.com> → **New → Blueprint** o **Web Service** →
   conecta el repositorio y la rama correcta.
3. Render lee `render.yaml`:
   - Build: `pip install -r requirements.txt`
   - Start: `python3 app.py`
   - Health check: `/api/health`
   - `DATABASE=/tmp/campus_circular.db`
4. En **Environment**, sustituye antes de producción:
   - `CONTACT_EMAIL`: correo real de privacidad/contacto.
   - `CONTROLLER_NAME`: identificación real del responsable editorial.
   - `LEGAL_VERSION` y `LEGAL_UPDATED`: si actualizas los textos legales.
   - `SEED_DEMO=0` si no quieres objetos de ejemplo en un despliegue nuevo.
5. Pulsa **Create** y, cuando el health check esté en verde, comparte la URL.

Notas del plan gratuito:

- La primera visita tras un periodo de inactividad puede tardar en «despertar»
  el servicio. Es normal.
- La base SQLite en `/tmp` se reinicia si Render reinicia el servicio. Para
  datos reales, añade persistencia, copias de seguridad y una revisión de
  protección de datos; no basta con el almacenamiento efímero.
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
