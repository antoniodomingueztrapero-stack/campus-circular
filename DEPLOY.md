# Cómo compartir Campus Circular con tus amigos del grupo

Ya **no hay cuentas demo**. Cada persona se registra con su propio email
(idealmente `@alumnos.uvigo.es` / `@uvigo.gal` para la insignia de
verificado) y publica sus objetos reales. Los objetos de ejemplo pertenecen
al «Equipo CTC-07» y nadie puede iniciar sesión con ellos.

Tienes 3 formas de compartirla, de más rápida a más permanente:

---

## Opción A — Enlace de vista previa (ahora mismo)

La web está corriendo en la vista previa en vivo de esta conversación
(boton **Campus Circular** / LIVE PREVIEW). Copia ese enlace y pégalo en
el grupo de WhatsApp/Drive. Tus amigos abren el enlace, pulsan
**Crear cuenta**, se registran y ya pueden publicar y solicitar.

⚠️ Este enlace vive mientras dure el entorno de esta conversación.
Para el trabajo del grupo, usa la Opción B.

## Opción B — Enlace permanente gratis con Render (recomendado, 5 min)

Render ofrece un plan gratuito con URL pública tipo
`https://campus-circular.onrender.com`. Solo necesitas una cuenta de GitHub.

1. Sube esta carpeta `campus-circular/` a un repositorio en GitHub
   (sin la base de datos: ya está en `.gitignore`).
2. Entra en <https://render.com> → **New → Web Service** → conecta el repo.
3. Render detecta `render.yaml` y rellena solo:
   - Build: `pip install -r requirements.txt`
   - Start: `python3 app.py`
4. Pulsa **Create Web Service**. En 2–3 minutos tendrás la URL pública.
5. Comparte esa URL en el grupo. Todos se registran con su email y publican.

Notas del plan gratuito:
- La primera visita tras 15 min de inactividad tarda ~30–50 s en
  «despertar» el servicio. Es normal.
- La base SQLite se reinicia si Render reinicia el servicio. Para un
  proyecto de clase es aceptable; si necesitáis persistencia, el siguiente
  paso sería Postgres (cambiar `get_db()` en `app.py`).

## Opción C — Ejecutarla en tu ordenador y pasar el zip

Si alguien quiere probarla sin internet:

```bash
cd campus-circular
pip install -r requirements.txt
python3 app.py
# Abrir http://127.0.0.1:5000
```

Puedes comprimir la carpeta y subirla a la carpeta compartida de Drive
del grupo. Cada ordenador tendrá su propia copia con sus propios datos
(no se comparten objetos entre ordenadores en esta opción).

---

## Qué decir en el grupo (mensaje listo para copiar)

> Hola! He montado **Campus Circular** (CTC-07): una web para regalar,
> prestar, intercambiar o vender materiales entre estudiantes de la UVigo
> (libros, ropa, muebles, calculadoras…).
>
> Entrad aquí: **[PEGA AQUÍ EL ENLACE]**
> 1. Pulsa **Crear cuenta** y regístrate con vuestro email de la UVigo.
> 2. Pulsa **Publicar** y subid un objeto que ya no uséis (con foto y
>    descripción honesta del estado).
> 3. Buscad lo que necesitéis y enviad la solicitud. Quedamos en un punto
>    del campus (biblioteca, entrada principal…).
>
> Está en español, inglés y gallego. Si algo falla, me decís y lo arreglo.
> Gracias!

---

## Verificación rápida (sin cuentas demo)

- No existe ninguna credencial compartida: si alguien intenta entrar con
  un email que no registró, el login falla.
- Los objetos de ejemplo aparecen como propiedad de «Equipo CTC-07» y
  sirven para ver cómo funciona antes de publicar los vuestros.
- Para empezar de cero en un despliegue nuevo, basta con no subir
  `campus_circular.db` (ya está ignorado en git).
