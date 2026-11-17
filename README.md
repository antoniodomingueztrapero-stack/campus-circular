# Campus Circular — CTC-07 · Universidade de Vigo

**Reutilización e intercambio de materiales universitarios.**
**Reuse and exchange of university materials.**

Versión funcional de la plataforma propuesta en el Abstract CTC-07: estudiantes
publican, buscan y solicitan objetos (libros, ropa, muebles, calculadoras…)
con fotos, descripción del estado y entrega en el campus.

> Investigación base: encuesta bilingüe con 26 respuestas y 6 entrevistas
> (21–25 oct 2026). Hallazgos clave: 81% tenía objetos útiles que ya no
> necesitaba; 69% había conseguido algo de segunda mano en el último año;
> estado (77%) y confianza (50%) son las barreras principales; 50% prefiere
> punto de intercambio en el campus.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python 3 + Flask 3 (API REST JSON) |
| Base de datos | SQLite (stdlib `sqlite3`, sin driver extra) |
| Frontend | HTML + CSS + JS vanilla (SPA, sin build) |
| i18n | ES / EN / GL en frontend (diccionario en `static/js/app.js`) |
| Auth | Token Bearer (sesiones en BD, 30 días), contraseñas con `werkzeug` |
| Subida de imágenes | `static/uploads/` (JPG/PNG/WebP/GIF, máx. 5 MB) |

Sin dependencias de frontend que compilar: `pip install -r requirements.txt`
y `python3 app.py` es suficiente.

## Estructura

```
campus-circular/
├── app.py                  # Backend: API + sirve el frontend + seed
├── requirements.txt
├── campus_circular.db      # SQLite (se crea solo al arrancar)
├── templates/
│   └── index.html          # Shell SPA
└── static/
    ├── css/style.css       # Diseño responsive
    ├── js/app.js           # SPA: i18n ES/EN/GL, vistas, modales, API client
    └── uploads/            # Imágenes subidas por usuarios
```

## Cómo ejecutar

```bash
cd campus-circular
pip install -r requirements.txt
python3 app.py
# Abrir http://127.0.0.1:5000
```

La base de datos y los datos de demostración se crean automáticamente en el
primer arranque (`seed_if_empty()`). Para reiniciar los datos demo, borra
`campus_circular.db` y vuelve a arrancar.

### Cuentas: registro propio, sin cuentas demo

No hay credenciales compartidas. Cada estudiante se registra con su propio
email; si el dominio es `@alumnos.uvigo.es`, `@uvigo.gal` o `@uvigo.es`
obtiene la insignia **Verificado/a UVigo**.

Los objetos de ejemplo pertenecen al usuario de sistema «Equipo CTC-07»,
cuya contraseña es aleatoria y nunca se muestra: nadie puede iniciar
sesión con él. Sirven solo para ver cómo funciona la plataforma.

Para compartirla con el grupo y desplegarla con URL pública gratuita,
consulta [DEPLOY.md](DEPLOY.md).

## Funcionalidades

- **Explorar**: buscador + filtros por categoría, campus, estado, tipo y orden.
- **Categorías** (taxonomía de la encuesta Q6/Q10 + deporte y otros):
  libros, ropa, muebles, calculadoras/material de estudio, electrónica,
  cocina/hogar, pequeños electrodomésticos, deporte y ocio, otros.
- **Publicar**: título, descripción honesta del estado, categoría, estado
  (nuevo / como nuevo / bueno / usable con marcas), tipo (regalar / prestar /
  intercambiar / vender con precio), campus, punto de entrega y foto
  (URL o subida).
- **Solicitar**: mensaje al propietario; el propietario acepta/rechaza;
  al aceptar el objeto pasa a *reservado*; al completar, a *entregado*.
- **Mi área**: mis objetos (cambiar estado, eliminar), mis solicitudes,
  solicitudes recibidas y favoritos.
- **Confianza**: insignia UVigo, descripción obligatoria del estado, normas
  claras de préstamo, puntos de intercambio públicos del campus.
- **Puntos de intercambio**: biblioteca, entrada principal, cafetería, punto
  habilitado y lugar acordado (Vigo, Pontevedra, Ourense).
- **Trilingüe**: ES / EN / GL con selector en la cabecera.
- **Estadísticas**: objetos publicados, disponibles, reutilizados y usuarios.

## API (resumen)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | — | Estado del servicio |
| GET | `/api/stats` | — | Contadores y categorías |
| GET | `/api/items?q=&category=&campus=&condition=&type=&sort=` | — | Listar objetos |
| GET | `/api/items/:id` | — | Detalle + propietario |
| POST | `/api/items` | ✓ | Crear objeto |
| PATCH | `/api/items/:id` | ✓ dueño | Cambiar estado |
| DELETE | `/api/items/:id` | ✓ dueño | Eliminar |
| POST | `/api/upload` | ✓ | Subir imagen (multipart) |
| POST | `/api/auth/register` | — | Registro |
| POST | `/api/auth/login` | — | Login → token |
| POST | `/api/auth/logout` | ✓ | Cerrar sesión |
| GET | `/api/auth/me` | — | Usuario actual |
| POST | `/api/items/:id/request` | ✓ | Solicitar objeto |
| GET | `/api/requests/mine` | ✓ | Mis solicitudes |
| GET | `/api/requests/received` | ✓ | Solicitudes recibidas |
| PATCH | `/api/requests/:id` | ✓ | Aceptar/rechazar/completar/cancelar |
| POST | `/api/items/:id/favorite` | ✓ | Alternar favorito |
| GET | `/api/favorites` | ✓ | Mis favoritos |
| GET | `/api/users/:id` | — | Perfil público mínimo |

## Decisiones de ingeniería

- **SQLite + stdlib**: cero fricción para ejecutar en clase y en el sandbox;
  migrable a Postgres cambiando `get_db()` y las consultas.
- **Validación en servidor** de todos los campos (longitudes, enums, precio,
  URL de imagen) además de la validación del formulario.
- **Sin framework JS**: la SPA es JS vanilla con render por vistas; fácil de
  auditar y de extender a React/Vue después si se desea.
- **i18n en frontend**: la API es neutral al idioma (guarda el contenido tal
  como lo escribe el usuario); las etiquetas de categoría/estado/tipo se
  traducen en cliente.
- **Privacidad**: el perfil público no expone email; solo nombre, campus,
  titulación y número de objetos.

## Limitaciones honestas y próximos pasos

- Datos demo ficticios inspirados en la investigación; no hay verificación
  real de matrícula UVigo (solo dominio del email).
- Sin mensajería en tiempo real: la solicitud incluye un mensaje; un chat
  sería el siguiente paso.
- Sin moderación ni reportes; añadir antes de un despliegue real.
- Sin métricas de impacto ambiental: no se inventan kilos ni euros ahorrados
  (la propia investigación lo advierte). Contar solo objetos entregados.
- Siguientes pasos propuestos: SSO UVigo, fotos múltiples por objeto,
  valoraciones entre usuarios, búsqueda por titulación/curso (petición de
  las entrevistas) y test de usabilidad con estudiantes.

## Equipo

CTC-07 · Universidade de Vigo — Antonio Domínguez Trapero, Pavlo Kovalenko,
Karen Itzel Sandoval Ramos, Okechukwu Patrick Okeh, Fernando Heriberto
Cardenas Rubi, Alba Grille Louro, Filip Juran, Greypher Alisander Garcia
Alvarado, Jacob Schaal.
