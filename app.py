"""
Circular Campus — prototipo independiente de reutilización e intercambio.

Backend: Flask + SQLite local o PostgreSQL gestionado en despliegue.
Frontend: SPA estática servida desde templates/ + static/, en ES / EN / GL.

Criterios de funcionamiento:
- Proyecto independiente: no usa marcas institucionales ni se presenta como un
  servicio oficial de ninguna universidad. Los campus son etiquetas geográficas.
- Pagos fuera de la plataforma: no se procesan pagos, no se cobran comisiones,
  no se custodian fondos, no se garantizan objetos ni se media en disputas.
  «Vender» publica únicamente un precio orientativo; cualquier contraprestación
  se acuerda directamente entre particulares, fuera de Circular Campus.
- Privacidad desde el diseño: consentimiento explícito en el registro, aviso
  legal / privacidad / condiciones en tres idiomas, mínimos datos de perfil,
  sin analítica ni recursos de terceros, exportación y supresión de cuenta.
- Las imágenes de ejemplo y de categoría son locales. No se aceptan URL externas
  para evitar peticiones a terceros desde el navegador.

Arranque:
    python3 app.py
    # http://127.0.0.1:5000, o la URL de vista previa / Render

Variables de entorno opcionales:
    DATABASE (SQLite local), DATABASE_URL (PostgreSQL gestionado), APP_ENV,
    PORT, SEED_DEMO, CONTACT_EMAIL, CONTROLLER_NAME, LEGAL_VERSION, LEGAL_UPDATED.
"""

import hashlib
import os
import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps
from urllib.parse import urlparse

import psycopg
from psycopg.rows import dict_row
from flask import Flask, g, jsonify, render_template, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
APP_ENV = os.environ.get("APP_ENV", "development").lower()
USE_POSTGRES = DATABASE_URL.startswith(("postgres://", "postgresql://"))
if DATABASE_URL and not USE_POSTGRES:
    raise RuntimeError("DATABASE_URL debe ser una URL PostgreSQL (postgres:// o postgresql://)")
if APP_ENV == "production" and not USE_POSTGRES:
    raise RuntimeError("En producción es obligatorio configurar DATABASE_URL para evitar perder datos")
DATABASE = os.environ.get("DATABASE", os.path.join(BASE_DIR, "campus_circular.db"))
if not USE_POSTGRES:
    os.makedirs(os.path.dirname(DATABASE) or ".", exist_ok=True)
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

SERVICE_NAME = "Circular Campus"
LEGAL_VERSION = os.environ.get("LEGAL_VERSION", "2026-11-17")
LEGAL_UPDATED = os.environ.get("LEGAL_UPDATED", "2026-11-17")
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "privacidad@circular-campus.example")
CONTROLLER_NAME = os.environ.get(
    "CONTROLLER_NAME", "Equipo Circular Campus (proyecto académico independiente)"
)
SESSION_DAYS = 30
SEED_DEMO = os.environ.get("SEED_DEMO", "1") != "0"
DB_INTEGRITY_ERRORS = (sqlite3.IntegrityError, psycopg.errors.IntegrityError)
DB_ERRORS = (sqlite3.Error, psycopg.Error)

CATEGORIES = [
    "libros", "ropa", "muebles", "estudio", "electronica",
    "cocina", "electrodomesticos", "deporte", "otros",
]
CONDITIONS = ["nuevo", "como_nuevo", "bueno", "usable"]
EXCHANGE_TYPES = ["regalar", "prestar", "intercambiar", "vender"]
CAMPUSES = ["vigo", "pontevedra", "ourense"]
HANDOVER_POINTS = ["biblioteca", "entrada", "cafeteria", "punto", "acordado"]
ITEM_STATUSES = ["disponible", "reservado", "entregado"]
REQUEST_STATUSES = ["pendiente", "aceptada", "rechazada", "cancelada", "completada"]

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_URL_LEN = 300

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
app.json.ensure_ascii = False

SPA_VIEWS = {
    "/": "home",
    "/publicar": "publish",
    "/puntos": "points",
    "/normas": "rules",
    "/proyecto": "about",
    "/mi-area": "my",
    "/aviso-legal": "legal",
    "/privacidad": "privacy",
    "/condiciones": "terms",
}

# Endpoints que deben seguir disponibles aunque una cuenta antigua aún no haya
# renovado su consentimiento (derechos de exportación/supresión y cierre).
ALLOW_WITHOUT_CONSENT = {
    "update_consent", "export_account", "delete_account", "logout",
}


def boot_config(view="home"):
    """Configuración pública que el frontend necesita para los textos legales."""
    return {
        "view": view,
        "service": SERVICE_NAME,
        "contactEmail": CONTACT_EMAIL,
        "controller": CONTROLLER_NAME,
        "legalVersion": LEGAL_VERSION,
        "legalUpdated": LEGAL_UPDATED,
        "sessionDays": SESSION_DAYS,
    }


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
class DatabaseConnection:
    """Small DB-API adapter: SQLite locally or PostgreSQL for hosted storage."""

    def __init__(self):
        self.is_postgres = USE_POSTGRES
        if self.is_postgres:
            self.raw = psycopg.connect(
                DATABASE_URL, row_factory=dict_row, connect_timeout=10
            )
        else:
            self.raw = sqlite3.connect(DATABASE, timeout=15)
            self.raw.row_factory = sqlite3.Row
            self.raw.execute("PRAGMA foreign_keys = ON")

    def execute(self, statement, params=()):
        if self.is_postgres:
            statement = statement.replace("?", "%s")
        return self.raw.execute(statement, params)

    def executescript(self, script):
        if self.is_postgres:
            script = script.replace(
                "INTEGER PRIMARY KEY AUTOINCREMENT", "BIGSERIAL PRIMARY KEY"
            ).replace("INTEGER NOT NULL REFERENCES", "BIGINT NOT NULL REFERENCES")
            script = script.replace("price REAL", "price DOUBLE PRECISION")
            for statement in script.split(";"):
                if statement.strip():
                    self.execute(statement)
        else:
            self.raw.executescript(script)

    def commit(self):
        self.raw.commit()

    def rollback(self):
        self.raw.rollback()

    def close(self):
        self.raw.close()


def connect_db():
    return DatabaseConnection()


def inserted_id(cursor):
    """Return an INSERT id across both backends (Postgres uses RETURNING id)."""
    row = cursor.fetchone()
    if USE_POSTGRES:
        return row["id"]
    # Exhaust SQLite's RETURNING cursor before committing the transaction.
    cursor.fetchall()
    return cursor.lastrowid


def get_db():
    if "db" not in g:
        g.db = connect_db()
        if not USE_POSTGRES:
            # La base contiene emails y hashes de contraseñas: no dejarla
            # legible para otros usuarios del sistema donde SQLite la crea.
            try:
                os.chmod(DATABASE, 0o600)
            except OSError:
                app.logger.warning("No se pudieron restringir los permisos de la base de datos")
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = connect_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            campus TEXT NOT NULL DEFAULT 'vigo',
            degree TEXT NOT NULL DEFAULT '',
            verified INTEGER NOT NULL DEFAULT 0,
            consent_at TEXT NOT NULL DEFAULT '',
            consent_version TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            condition TEXT NOT NULL,
            exchange_type TEXT NOT NULL,
            price REAL NOT NULL DEFAULT 0,
            campus TEXT NOT NULL,
            handover_point TEXT NOT NULL DEFAULT 'punto',
            image_url TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'disponible',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pendiente',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL,
            PRIMARY KEY (user_id, item_id)
        );
        """
    )
    db.commit()
    db.close()


def migrate_db():
    """Añade columnas y protege sesiones antiguas almacenadas en claro."""
    db = connect_db()
    try:
        if USE_POSTGRES:
            # Serializa cambios de esquema cuando arrancan varios workers.
            db.execute("LOCK TABLE users, sessions IN ACCESS EXCLUSIVE MODE")
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_at TEXT NOT NULL DEFAULT ''")
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_version TEXT NOT NULL DEFAULT ''")
            cols = {r["column_name"] for r in db.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = current_schema() AND table_name = 'users'"
            ).fetchall()}
        else:
            db.execute("BEGIN IMMEDIATE")
            cols = {r["name"] for r in db.execute("PRAGMA table_info(users)").fetchall()}
            if "consent_at" not in cols:
                db.execute("ALTER TABLE users ADD COLUMN consent_at TEXT NOT NULL DEFAULT ''")
            if "consent_version" not in cols:
                db.execute("ALTER TABLE users ADD COLUMN consent_version TEXT NOT NULL DEFAULT ''")

        # Las versiones anteriores guardaban el bearer token directamente. Como
        # son aleatorios de alta entropía, SHA-256 impide reutilizarlos si se
        # copia la base. La migración conserva las sesiones vigentes.
        for row in db.execute("SELECT token FROM sessions").fetchall():
            token = row["token"]
            if not re.fullmatch(r"[0-9a-f]{64}", token):
                digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
                db.execute("UPDATE sessions SET token = ? WHERE token = ?", (digest, token))
        db.commit()
    except (sqlite3.Error, psycopg.Error):
        db.rollback()
        raise
    finally:
        if not USE_POSTGRES:
            try:
                os.chmod(DATABASE, 0o600)
            except OSError:
                pass
        db.close()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def row_to_user(r):
    """Vista privada: solo se entrega a la propia cuenta autenticada."""
    if r is None:
        return None
    return {
        "id": r["id"],
        "name": r["name"],
        "email": r["email"],
        "campus": r["campus"],
        "academic_email": bool(r["verified"]),
        "consent_ok": bool(r["consent_at"]) and r["consent_version"] == LEGAL_VERSION,
        "consent_at": r["consent_at"],
        "consent_version": r["consent_version"],
        "created_at": r["created_at"],
    }


def row_to_public_user(r):
    """Vista pública mínima: nunca incluye email, titulación ni consentimiento."""
    if r is None:
        return None
    return {
        "id": r["id"],
        "name": r["name"],
        "campus": r["campus"],
        "academic_email": bool(r["verified"]),
    }


def row_to_item(r, fav=False):
    if r is None:
        return None
    return {
        "id": r["id"],
        "owner_id": r["owner_id"],
        "title": r["title"],
        "description": r["description"],
        "category": r["category"],
        "condition": r["condition"],
        "exchange_type": r["exchange_type"],
        "price": float(r["price"]),
        "campus": r["campus"],
        "handover_point": r["handover_point"],
        "image_url": r["image_url"],
        "status": r["status"],
        "created_at": r["created_at"],
        "is_favorite": bool(fav),
    }


def row_to_request(r):
    if r is None:
        return None
    return {
        "id": r["id"],
        "item_id": r["item_id"],
        "requester_id": r["requester_id"],
        "message": r["message"],
        "status": r["status"],
        "created_at": r["created_at"],
    }


# ---------------------------------------------------------------------------
# Validación y archivos
# ---------------------------------------------------------------------------
def valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ""))


def valid_password(password: str) -> bool:
    """Bound password hashing work and reject invalid Unicode safely."""
    try:
        return len(password) >= 8 and len(password.encode("utf-8")) <= 1024
    except UnicodeEncodeError:
        return False


def has_academic_domain(email: str) -> bool:
    """Insignia meramente informativa: NO acredita matrícula ni identidad."""
    try:
        domain = email.rsplit("@", 1)[1].lower().strip().rstrip(".")
    except Exception:
        return False
    return bool(
        re.search(r"(^|\.)(edu|ac)(\.|$)", domain)
        or domain.endswith((".edu", ".edu.es", ".ac.uk"))
        or domain.startswith(("alumnos.", "alumnado.", "estudiantes.", "students.", "campus."))
    )


def valid_local_image_url(url: str) -> bool:
    """Solo recursos propios: evita fugas a CDN / imágenes de terceros."""
    if not url:
        return True
    if len(url) > MAX_IMAGE_URL_LEN or url.startswith("//"):
        return False
    if any(ch.isspace() or ord(ch) < 32 for ch in url):
        return False
    parsed = urlparse(url)
    if parsed.scheme or parsed.netloc or ".." in parsed.path or "\\" in parsed.path:
        return False
    return parsed.path.startswith("/static/")


def remove_uploaded_file(url: str) -> bool:
    """Borra de forma segura una imagen subida por el usuario."""
    if not url or not url.startswith("/static/uploads/"):
        return False
    filename = secure_filename(os.path.basename(urlparse(url).path))
    if not filename or "." not in filename:
        return False
    root = os.path.abspath(UPLOAD_DIR)
    path = os.path.abspath(os.path.join(root, filename))
    if os.path.commonpath([root, path]) != root:
        return False
    try:
        os.remove(path)
        return True
    except FileNotFoundError:
        return False


def valid_image_bytes(head: bytes) -> bool:
    return (
        head.startswith(b"\xff\xd8\xff")
        or head[:8] == b"\x89PNG\r\n\x1a\n"
        or head[:6] in (b"GIF87a", b"GIF89a")
        or (head[:4] == b"RIFF" and head[8:12] == b"WEBP")
    )


def cleanup_expired_sessions(db):
    db.execute("DELETE FROM sessions WHERE expires_at <= ?", (now_iso(),))


def session_token_digest(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def current_user():
    auth = request.headers.get("Authorization", "")
    token = auth[7:].strip() if auth.startswith("Bearer ") else None
    if not token:
        return None
    db = get_db()
    row = db.execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = ? AND s.expires_at > ?",
        (session_token_digest(token), now_iso()),
    ).fetchone()
    return row_to_user(row) if row else None


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify({"error": "unauthorized", "message": "Inicia sesión para continuar."}), 401
        if not user.get("consent_ok") and fn.__name__ not in ALLOW_WITHOUT_CONSENT:
            return jsonify({
                "error": "consent_required",
                "message": "Acepta la política de privacidad vigente para seguir usando la cuenta.",
            }), 403
        return fn(user, *args, **kwargs)

    return wrapper


# ---------------------------------------------------------------------------
# Seed data — contenido de demostración, sin credenciales compartidas
# ---------------------------------------------------------------------------
SEED_OWNER = {
    "name": "Equipo Circular Campus",
    "email": "equipo@circular-campus.local",
    "campus": "vigo",
}

SEED_ITEMS = [
    {"owner": 0, "title": "Libro de Derecho Civil — edición 2023",
     "description": "Libro de texto usado un curso. Subrayados leves en los primeros capítulos, resto limpio. Incluyo apuntes de clase en PDF. Se entrega en mano.",
     "category": "libros", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "biblioteca", "image_url": "/static/img/items/libro-derecho.jpg"},
    {"owner": 0, "title": "Calculadora científica",
     "description": "Calculadora en perfecto estado, con funda y tapa. Puedo prestarla por un cuatrimestre; acordamos por escrito la fecha de devolución.",
     "category": "estudio", "condition": "como_nuevo", "exchange_type": "prestar", "price": 0,
     "campus": "vigo", "handover_point": "punto", "image_url": "/static/img/items/calculadora.jpg"},
    {"owner": 0, "title": "Chaqueta de invierno talla M",
     "description": "Chaqueta en buen estado, sin manchas ni roturas. Busco intercambiarla por otra talla o regalarla a quien la necesite.",
     "category": "ropa", "condition": "bueno", "exchange_type": "intercambiar", "price": 0,
     "campus": "vigo", "handover_point": "entrada", "image_url": "/static/img/items/chaqueta.jpg"},
    {"owner": 0, "title": "Escritorio pequeño para piso compartido",
     "description": "Escritorio de 110 x 55 cm, estable y sin daños. Hay que desmontarlo; puedo ayudar con el desmontaje en el punto de entrega.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "acordado", "image_url": "/static/img/items/escritorio.jpg"},
    {"owner": 0, "title": "Estantería pequeña de 3 baldas",
     "description": "Estantería de madera clara para libros y apuntes. En buen estado, sin arañazos visibles. Se entrega desmontada.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "pontevedra", "handover_point": "biblioteca", "image_url": "/static/img/items/estanteria.jpg"},
    {"owner": 0, "title": "Auriculares inalámbricos",
     "description": "Auriculares con estuche de carga y batería en buen estado. Precio orientativo; el pago, si procede, se acuerda directamente y fuera de la plataforma.",
     "category": "electronica", "condition": "como_nuevo", "exchange_type": "vender", "price": 15,
     "campus": "vigo", "handover_point": "punto", "image_url": "/static/img/items/auriculares.jpg"},
    {"owner": 0, "title": "Juego de ollas y sartenes",
     "description": "Set de cocina para piso compartido: dos ollas, dos sartenes y tapas. Usados pero en buen estado. Préstamo temporal con devolución acordada.",
     "category": "cocina", "condition": "bueno", "exchange_type": "prestar", "price": 0,
     "campus": "ourense", "handover_point": "cafeteria", "image_url": "/static/img/items/ollas.jpg"},
    {"owner": 0, "title": "Freidora de aire 4 L",
     "description": "Freidora de aire en buen estado, funciona sin problemas y se entrega con manual. La regalo porque en mi piso nuevo ya hay una.",
     "category": "electrodomesticos", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "punto", "image_url": "/static/img/items/freidora.jpg"},
    {"owner": 0, "title": "Apuntes completos de Ingeniería",
     "description": "Carpeta con apuntes, exámenes resueltos y prácticas de primeros cursos. En papel; puedo enviar fotos si hace falta antes de quedar.",
     "category": "libros", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "biblioteca", "image_url": "/static/img/items/apuntes.jpg"},
    {"owner": 0, "title": "Mochila 25 L con compartimento para portátil",
     "description": "Mochila resistente, como nueva y sin roturas. La intercambio por una más pequeña o la regalo.",
     "category": "ropa", "condition": "como_nuevo", "exchange_type": "intercambiar", "price": 0,
     "campus": "vigo", "handover_point": "entrada", "image_url": "/static/img/items/mochila.jpg"},
    {"owner": 0, "title": "Lámpara de escritorio LED",
     "description": "Lámpara con luz regulable, ideal para estudiar. En buen estado. Se entrega en un lugar público y acordado.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "acordado", "image_url": "/static/img/items/lampara.jpg"},
    {"owner": 0, "title": "Teclado inalámbrico silencioso",
     "description": "Teclado perfecto para biblioteca y aulas, funciona con pilas AA. Precio simbólico orientativo; Circular Campus no gestiona el cobro.",
     "category": "electronica", "condition": "bueno", "exchange_type": "vender", "price": 10,
     "campus": "pontevedra", "handover_point": "punto", "image_url": "/static/img/items/teclado.jpg"},
]


def seed_if_empty():
    db = connect_db()
    if db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"] > 0:
        db.close()
        return
    ts = now_iso()
    cur = db.execute(
        "INSERT INTO users (name, email, password_hash, campus, degree, verified, "
        "consent_at, consent_version, created_at) VALUES (?, ?, ?, ?, '', 0, '', '', ?) RETURNING id",
        (SEED_OWNER["name"], SEED_OWNER["email"],
         generate_password_hash(secrets.token_urlsafe(32)),
         SEED_OWNER["campus"], ts),
    )
    owner_id = inserted_id(cur)
    for it in SEED_ITEMS:
        db.execute(
            "INSERT INTO items (owner_id, title, description, category, condition, "
            "exchange_type, price, campus, handover_point, image_url, status, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?)",
            (owner_id, it["title"], it["description"], it["category"], it["condition"],
             it["exchange_type"], it["price"], it["campus"], it["handover_point"],
             it["image_url"], ts),
        )
    db.commit()
    db.close()


_BOOTSTRAPPED = False


def bootstrap():
    """Funciona tanto con `python3 app.py` como con un servidor WSGI."""
    global _BOOTSTRAPPED
    if _BOOTSTRAPPED:
        return
    init_db()
    migrate_db()
    if SEED_DEMO:
        seed_if_empty()
    _BOOTSTRAPPED = True


# ---------------------------------------------------------------------------
# Cabeceras de seguridad
# ---------------------------------------------------------------------------
@app.after_request
def security_headers(resp):
    csp = "; ".join([
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-src 'none'",
        "img-src 'self' data: blob:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "connect-src 'self'",
        "font-src 'self'",
        "form-action 'self'",
        "frame-ancestors *",
    ])
    resp.headers["Content-Security-Policy"] = csp
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    if request.path.startswith("/api/") and (
        "/auth/" in request.path or "/account/" in request.path
    ):
        resp.headers["Cache-Control"] = "no-store"
    return resp


@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "file_too_large", "message": "La imagen supera 5 MB."}), 413


# ---------------------------------------------------------------------------
# Routes — frontend
# ---------------------------------------------------------------------------
@app.get("/")
@app.get("/publicar")
@app.get("/puntos")
@app.get("/normas")
@app.get("/proyecto")
@app.get("/mi-area")
@app.get("/aviso-legal")
@app.get("/privacidad")
@app.get("/condiciones")
def spa_shell():
    return render_template("index.html", boot=boot_config(SPA_VIEWS.get(request.path, "home")))


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(BASE_DIR, "static", "img"), "favicon.ico")


@app.route("/static/uploads/<path:filename>")
def uploads(filename):
    return send_from_directory(UPLOAD_DIR, filename)


# ---------------------------------------------------------------------------
# Routes — API
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "service": "circular-campus",
        "product": SERVICE_NAME,
        "legal_version": LEGAL_VERSION,
        "time": now_iso(),
    })


@app.get("/api/stats")
def stats():
    db = get_db()
    total_items = db.execute("SELECT COUNT(*) c FROM items").fetchone()["c"]
    available = db.execute("SELECT COUNT(*) c FROM items WHERE status='disponible'").fetchone()["c"]
    delivered = db.execute("SELECT COUNT(*) c FROM items WHERE status='entregado'").fetchone()["c"]
    users = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
    by_category = db.execute(
        "SELECT category, COUNT(*) c FROM items GROUP BY category ORDER BY c DESC"
    ).fetchall()
    return jsonify({
        "total_items": total_items,
        "available": available,
        "delivered": delivered,
        "users": users,
        "by_category": [{"category": r["category"], "count": r["c"]} for r in by_category],
    })


@app.get("/api/items")
def list_items():
    db = get_db()
    q = (request.args.get("q") or "").strip().lower()
    category = request.args.get("category")
    campus = request.args.get("campus")
    condition = request.args.get("condition")
    exchange_type = request.args.get("type")
    status = request.args.get("status", "disponible")
    sort = request.args.get("sort", "recent")

    sql = "SELECT * FROM items WHERE 1=1"
    params = []
    if status:
        sql += " AND status = ?"
        params.append(status)
    if category and category in CATEGORIES:
        sql += " AND category = ?"
        params.append(category)
    if campus and campus in CAMPUSES:
        sql += " AND campus = ?"
        params.append(campus)
    if condition and condition in CONDITIONS:
        sql += " AND condition = ?"
        params.append(condition)
    if exchange_type and exchange_type in EXCHANGE_TYPES:
        sql += " AND exchange_type = ?"
        params.append(exchange_type)
    if q:
        sql += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%"])

    if sort == "price_asc":
        sql += " ORDER BY price ASC, created_at DESC"
    elif sort == "price_desc":
        sql += " ORDER BY price DESC, created_at DESC"
    else:
        sql += " ORDER BY created_at DESC"

    rows = db.execute(sql, params).fetchall()
    user = current_user()
    fav_ids = set()
    if user:
        fav_ids = {r["item_id"] for r in db.execute(
            "SELECT item_id FROM favorites WHERE user_id = ?", (user["id"],)).fetchall()}
    return jsonify({"items": [row_to_item(r, r["id"] in fav_ids) for r in rows]})


@app.get("/api/items/<int:item_id>")
def get_item(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    owner = db.execute("SELECT * FROM users WHERE id = ?", (row["owner_id"],)).fetchone()
    user = current_user()
    fav = False
    if user:
        fav = db.execute("SELECT 1 FROM favorites WHERE user_id=? AND item_id=?",
                         (user["id"], item_id)).fetchone() is not None
    item = row_to_item(row, fav)
    item["owner"] = row_to_public_user(owner)
    return jsonify({"item": item})


@app.post("/api/items")
@require_auth
def create_item(user):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    category = data.get("category")
    condition = data.get("condition")
    exchange_type = data.get("exchange_type")
    campus = data.get("campus", user["campus"])
    handover_point = data.get("handover_point", "punto")
    image_url = (data.get("image_url") or "").strip()
    private_seller = data.get("private_seller") is True
    try:
        price = float(data.get("price") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_price"}), 400

    if not private_seller:
        return jsonify({
            "error": "private_seller_required",
            "message": "Confirma que publicas como particular; no se admiten vendedores profesionales.",
        }), 400
    if len(title) < 3 or len(title) > 80:
        return jsonify({"error": "invalid_title", "message": "El título debe tener entre 3 y 80 caracteres."}), 400
    if len(description) < 10 or len(description) > 2000:
        return jsonify({"error": "invalid_description", "message": "La descripción debe tener entre 10 y 2000 caracteres."}), 400
    if category not in CATEGORIES:
        return jsonify({"error": "invalid_category"}), 400
    if condition not in CONDITIONS:
        return jsonify({"error": "invalid_condition"}), 400
    if exchange_type not in EXCHANGE_TYPES:
        return jsonify({"error": "invalid_exchange_type"}), 400
    if campus not in CAMPUSES:
        return jsonify({"error": "invalid_campus"}), 400
    if handover_point not in HANDOVER_POINTS:
        return jsonify({"error": "invalid_handover_point"}), 400
    if exchange_type != "vender":
        price = 0
    if price < 0 or price > 10000:
        return jsonify({"error": "invalid_price"}), 400
    if not valid_local_image_url(image_url):
        return jsonify({
            "error": "invalid_image_url",
            "message": "Usa una imagen subida a Circular Campus; no se permiten URL externas.",
        }), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO items (owner_id, title, description, category, condition, exchange_type, "
        "price, campus, handover_point, image_url, status, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?) RETURNING id",
        (user["id"], title, description, category, condition, exchange_type,
         price, campus, handover_point, image_url, now_iso()),
    )
    item_id = inserted_id(cur)
    db.commit()
    row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    return jsonify({"item": row_to_item(row)}), 201


@app.patch("/api/items/<int:item_id>")
@require_auth
def update_item(user, item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    if row["owner_id"] != user["id"]:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ITEM_STATUSES:
        return jsonify({"error": "invalid_status"}), 400
    db.execute("UPDATE items SET status = ? WHERE id = ?", (new_status, item_id))
    db.commit()
    row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    return jsonify({"item": row_to_item(row)})


@app.delete("/api/items/<int:item_id>")
@require_auth
def delete_item(user, item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    if row["owner_id"] != user["id"]:
        return jsonify({"error": "forbidden"}), 403
    image_url = row["image_url"]
    db.execute("DELETE FROM items WHERE id = ?", (item_id,))
    db.commit()
    remove_uploaded_file(image_url)
    return jsonify({"ok": True})


@app.post("/api/upload")
@require_auth
def upload(user):
    if "file" not in request.files:
        return jsonify({"error": "no_file"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "no_file"}), 400
    ext = os.path.splitext(f.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "invalid_type", "message": "Solo imágenes JPG, PNG, WebP o GIF."}), 400
    head = f.stream.read(12)
    f.stream.seek(0)
    if not valid_image_bytes(head):
        return jsonify({"error": "invalid_type", "message": "El archivo no parece una imagen válida."}), 400
    filename = f"{secrets.token_hex(16)}{ext}"
    f.save(os.path.join(UPLOAD_DIR, secure_filename(filename)))
    return jsonify({"url": f"/static/uploads/{filename}"}), 201


# --- Auth -------------------------------------------------------------------
@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "invalid_request"}), 400

    raw_name = data.get("name", "")
    raw_email = data.get("email", "")
    password = data.get("password", "")
    campus = data.get("campus", "vigo")
    if not isinstance(raw_name, str) or not isinstance(raw_email, str) or not isinstance(password, str):
        return jsonify({"error": "invalid_request"}), 400
    name = raw_name.strip()
    email = raw_email.strip().lower()
    consent = data.get("consent") is True

    if len(name) < 2 or len(name) > 60 or any(ord(ch) < 32 for ch in name):
        return jsonify({"error": "invalid_name"}), 400
    if len(email) > 254 or not valid_email(email):
        return jsonify({"error": "invalid_email"}), 400
    if not valid_password(password):
        return jsonify({"error": "invalid_password", "message": "La contraseña debe tener entre 8 y 1024 bytes."}), 400
    if not isinstance(campus, str) or campus not in CAMPUSES:
        return jsonify({"error": "invalid_campus"}), 400
    if not consent:
        return jsonify({
            "error": "consent_required",
            "message": "Debes aceptar la política de privacidad y las condiciones de uso.",
        }), 400

    db = get_db()
    ts = now_iso()
    token = secrets.token_urlsafe(32)
    try:
        # User y sesión comparten una transacción; nunca se devuelve éxito si
        # no quedaron ambos escritos de forma duradera en la base configurada.
        cur = db.execute(
            "INSERT INTO users (name, email, password_hash, campus, degree, verified, "
            "consent_at, consent_version, created_at) VALUES (?, ?, ?, ?, '', ?, ?, ?, ?) RETURNING id",
            (name, email, generate_password_hash(password), campus,
             1 if has_academic_domain(email) else 0, ts, LEGAL_VERSION, ts),
        )
        user_id = inserted_id(cur)
        cleanup_expired_sessions(db)
        db.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (session_token_digest(token), user_id,
             (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()),
        )
        db.commit()
    except DB_INTEGRITY_ERRORS:
        db.rollback()
        if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
            return jsonify({"error": "email_taken", "message": "Ya existe una cuenta con ese email."}), 409
        app.logger.exception("Error de integridad al crear una cuenta")
        return jsonify({"error": "registration_failed", "message": "No se pudo crear la cuenta. Inténtalo de nuevo."}), 500
    except DB_ERRORS:
        db.rollback()
        app.logger.exception("No se pudo guardar una cuenta en la base de datos")
        return jsonify({"error": "storage_unavailable", "message": "No se pudo guardar la cuenta en este momento. Inténtalo de nuevo más tarde."}), 503

    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return jsonify({"token": token, "user": row_to_user(row), "legal_version": LEGAL_VERSION}), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "invalid_request"}), 400
    raw_email = data.get("email", "")
    password = data.get("password", "")
    if not isinstance(raw_email, str) or not isinstance(password, str) or not valid_password(password):
        return jsonify({"error": "invalid_credentials", "message": "Email o contraseña incorrectos."}), 401
    email = raw_email.strip().lower()
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "invalid_credentials", "message": "Email o contraseña incorrectos."}), 401
    cleanup_expired_sessions(db)
    token = secrets.token_urlsafe(32)
    db.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (session_token_digest(token), row["id"],
         (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()),
    )
    db.commit()
    return jsonify({"token": token, "user": row_to_user(row), "legal_version": LEGAL_VERSION})


@app.post("/api/auth/logout")
@require_auth
def logout(user):
    auth = request.headers.get("Authorization", "")
    token = auth[7:].strip() if auth.startswith("Bearer ") else None
    db = get_db()
    if token:
        db.execute("DELETE FROM sessions WHERE token = ?", (session_token_digest(token),))
        db.commit()
    return jsonify({"ok": True})


@app.get("/api/auth/me")
def me():
    return jsonify({"user": current_user(), "legal_version": LEGAL_VERSION})


# --- Cuenta, privacidad y derechos -----------------------------------------
@app.post("/api/account/consent")
@require_auth
def update_consent(user):
    data = request.get_json(silent=True) or {}
    if data.get("consent") is not True:
        return jsonify({"error": "consent_required"}), 400
    db = get_db()
    db.execute(
        "UPDATE users SET consent_at = ?, consent_version = ? WHERE id = ?",
        (now_iso(), LEGAL_VERSION, user["id"]),
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    return jsonify({"user": row_to_user(row)})


@app.get("/api/account/export")
@require_auth
def export_account(user):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    items = [row_to_item(r) for r in db.execute(
        "SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]
    sent_requests = [row_to_request(r) for r in db.execute(
        "SELECT * FROM requests WHERE requester_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]
    favorites = [row_to_item(r, True) for r in db.execute(
        "SELECT i.* FROM favorites f JOIN items i ON i.id = f.item_id "
        "WHERE f.user_id = ? ORDER BY f.created_at DESC", (user["id"],)).fetchall()]
    sessions = db.execute("SELECT COUNT(*) c FROM sessions WHERE user_id = ?", (user["id"],)).fetchone()["c"]

    payload = {
        "service": SERVICE_NAME,
        "exported_at": now_iso(),
        "legal_version": LEGAL_VERSION,
        "profile": row_to_user(row),
        "items": items,
        "sent_requests": sent_requests,
        "favorites": favorites,
        "session_count": sessions,
        "notes": [
            "Exportación de los datos propios de la cuenta.",
            "No se incluyen contraseñas, tokens de sesión ni mensajes escritos por otras personas.",
            "La eliminación de cuenta borra perfil, sesiones, publicaciones, favoritos y solicitudes propias.",
        ],
    }
    resp = jsonify(payload)
    resp.headers["Content-Disposition"] = f'attachment; filename="circular-campus-export-{user["id"]}.json"'
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.delete("/api/account/delete")
@require_auth
def delete_account(user):
    data = request.get_json(silent=True) or {}
    password = data.get("password") or ""
    db = get_db()
    row = db.execute("SELECT password_hash FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "invalid_password", "message": "Confirma tu contraseña para eliminar la cuenta."}), 401

    image_urls = [r["image_url"] for r in db.execute(
        "SELECT image_url FROM items WHERE owner_id = ?", (user["id"],)).fetchall()]
    counts = {
        "items": db.execute("SELECT COUNT(*) c FROM items WHERE owner_id = ?", (user["id"],)).fetchone()["c"],
        "sent_requests": db.execute("SELECT COUNT(*) c FROM requests WHERE requester_id = ?", (user["id"],)).fetchone()["c"],
        "favorites": db.execute("SELECT COUNT(*) c FROM favorites WHERE user_id = ?", (user["id"],)).fetchone()["c"],
        "sessions": db.execute("SELECT COUNT(*) c FROM sessions WHERE user_id = ?", (user["id"],)).fetchone()["c"],
    }
    db.execute("DELETE FROM users WHERE id = ?", (user["id"],))
    db.commit()
    removed_files = sum(1 for url in image_urls if remove_uploaded_file(url))
    return jsonify({"ok": True, "deleted": counts, "removed_images": removed_files})


# --- Requests (solicitudes) -------------------------------------------------
@app.post("/api/items/<int:item_id>/request")
@require_auth
def create_request(user, item_id):
    db = get_db()
    item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        return jsonify({"error": "not_found"}), 404
    if item["owner_id"] == user["id"]:
        return jsonify({"error": "own_item", "message": "No puedes solicitar tu propio objeto."}), 400
    if item["status"] != "disponible":
        return jsonify({"error": "not_available", "message": "Este objeto ya no está disponible."}), 400
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if len(message) > 1000:
        return jsonify({"error": "message_too_long"}), 400
    existing = db.execute(
        "SELECT * FROM requests WHERE item_id=? AND requester_id=? AND status='pendiente'",
        (item_id, user["id"])).fetchone()
    if existing:
        return jsonify({"error": "already_requested", "message": "Ya tienes una solicitud pendiente para este objeto."}), 409
    cur = db.execute(
        "INSERT INTO requests (item_id, requester_id, message, status, created_at) "
        "VALUES (?, ?, ?, 'pendiente', ?) RETURNING id",
        (item_id, user["id"], message, now_iso()))
    request_id = inserted_id(cur)
    db.commit()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
    return jsonify({"request": row_to_request(row)}), 201


@app.get("/api/requests/mine")
@require_auth
def my_requests(user):
    db = get_db()
    rows = db.execute(
        "SELECT r.*, i.title as item_title, i.image_url as item_image, i.status as item_status "
        "FROM requests r JOIN items i ON i.id = r.item_id "
        "WHERE r.requester_id = ? ORDER BY r.created_at DESC", (user["id"],)).fetchall()
    out = []
    for r in rows:
        d = row_to_request(r)
        d["item_title"] = r["item_title"]
        d["item_image"] = r["item_image"]
        d["item_status"] = r["item_status"]
        out.append(d)
    return jsonify({"requests": out})


@app.get("/api/requests/received")
@require_auth
def received_requests(user):
    db = get_db()
    rows = db.execute(
        "SELECT r.*, i.title as item_title, i.image_url as item_image, u.name as requester_name "
        "FROM requests r JOIN items i ON i.id = r.item_id JOIN users u ON u.id = r.requester_id "
        "WHERE i.owner_id = ? ORDER BY r.created_at DESC", (user["id"],)).fetchall()
    out = []
    for r in rows:
        d = row_to_request(r)
        d["item_title"] = r["item_title"]
        d["item_image"] = r["item_image"]
        d["requester_name"] = r["requester_name"]
        out.append(d)
    return jsonify({"requests": out})


@app.patch("/api/requests/<int:request_id>")
@require_auth
def update_request(user, request_id):
    db = get_db()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    item = db.execute("SELECT * FROM items WHERE id = ?", (row["item_id"],)).fetchone()
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in REQUEST_STATUSES:
        return jsonify({"error": "invalid_status"}), 400

    is_owner = item and item["owner_id"] == user["id"]
    is_requester = row["requester_id"] == user["id"]
    if not (is_owner or is_requester):
        return jsonify({"error": "forbidden"}), 403
    if is_owner and new_status not in ("aceptada", "rechazada", "completada"):
        return jsonify({"error": "invalid_transition"}), 400
    if is_requester and not is_owner and new_status != "cancelada":
        return jsonify({"error": "invalid_transition"}), 400

    db.execute("UPDATE requests SET status = ? WHERE id = ?", (new_status, request_id))
    if new_status == "aceptada" and item:
        db.execute("UPDATE items SET status = 'reservado' WHERE id = ?", (item["id"],))
    if new_status == "completada" and item:
        db.execute("UPDATE items SET status = 'entregado' WHERE id = ?", (item["id"],))
    db.commit()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
    return jsonify({"request": row_to_request(row)})


# --- Favorites ---------------------------------------------------------------
@app.post("/api/items/<int:item_id>/favorite")
@require_auth
def toggle_favorite(user, item_id):
    db = get_db()
    item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        return jsonify({"error": "not_found"}), 404
    existing = db.execute("SELECT 1 FROM favorites WHERE user_id=? AND item_id=?",
                          (user["id"], item_id)).fetchone()
    if existing:
        db.execute("DELETE FROM favorites WHERE user_id=? AND item_id=?", (user["id"], item_id))
        db.commit()
        return jsonify({"is_favorite": False})
    db.execute("INSERT INTO favorites (user_id, item_id, created_at) VALUES (?, ?, ?)",
               (user["id"], item_id, now_iso()))
    db.commit()
    return jsonify({"is_favorite": True})


@app.get("/api/favorites")
@require_auth
def favorites(user):
    db = get_db()
    rows = db.execute(
        "SELECT i.* FROM items i JOIN favorites f ON f.item_id = i.id "
        "WHERE f.user_id = ? ORDER BY f.created_at DESC", (user["id"],)).fetchall()
    return jsonify({"items": [row_to_item(r, True) for r in rows]})


@app.get("/api/users/<int:user_id>")
def public_user(user_id):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    u = row_to_public_user(row)
    u["items_count"] = db.execute("SELECT COUNT(*) c FROM items WHERE owner_id=?", (user_id,)).fetchone()["c"]
    return jsonify({"user": u})


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "not_found"}), 404
    return render_template("index.html", boot=boot_config("home")), 200


bootstrap()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
