"""
Campus Circular — prototipo independiente de reutilización e intercambio.

Backend: Flask + SQLite local o PostgreSQL gestionado en despliegue.
Frontend: SPA estática servida desde templates/ + static/, en ES / EN / GL.

Criterios de funcionamiento:
- Proyecto independiente: no usa marcas institucionales ni se presenta como un
  servicio oficial de ninguna universidad. Los campus son etiquetas geográficas.
- Pagos fuera de la plataforma: no se procesan pagos, no se cobran comisiones,
  no se custodian fondos, no se garantizan objetos ni se media en disputas.
  «Vender» publica únicamente un precio orientativo; cualquier contraprestación
  se acuerda directamente entre particulares, fuera de Campus Circular.
- Privacidad desde el diseño: consentimiento explícito en el registro, aviso
  legal / privacidad / condiciones en tres idiomas, mínimos datos de perfil,
  sin analítica ni recursos de terceros, exportación y supresión de cuenta.
- Las imágenes de ejemplo y de categoría son locales. No se aceptan URL externas
  para evitar peticiones a terceros desde el navegador.

Arranque:
    python3 app.py
    # http://127.0.0.1:5000, o la URL pública del despliegue

Variables de entorno opcionales:
    DATABASE (SQLite local), DATABASE_URL (PostgreSQL gestionado), APP_ENV,
    PORT, SEED_DEMO, CONTACT_EMAIL, CONTROLLER_NAME, LEGAL_VERSION, LEGAL_UPDATED,
    UNIVERSITY_DOMAINS (dominios de correo institucional aceptados).
"""

import gzip
import hashlib
import json
import io
import math
import mimetypes
import os
import re
import secrets
import sqlite3
import threading
import time
import unicodedata
from collections import deque
from datetime import datetime, timedelta, timezone
from functools import wraps
from urllib.parse import urlparse

import psycopg
from PIL import Image, ImageOps, UnidentifiedImageError
from psycopg.rows import dict_row
from flask import (
    Flask, Response, g, jsonify, make_response, render_template, request,
    send_from_directory,
)
from werkzeug.middleware.proxy_fix import ProxyFix
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

SERVICE_NAME = "Campus Circular"
LEGAL_VERSION = os.environ.get("LEGAL_VERSION", "2026-11-20")
LEGAL_UPDATED = os.environ.get("LEGAL_UPDATED", "2026-11-20")
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "campuscircular@hotmail.com")
CONTROLLER_NAME = os.environ.get(
    "CONTROLLER_NAME", "Equipo Campus Circular (proyecto académico independiente)"
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
HANDOVER_POINTS = ["biblioteca", "conserjeria", "cafeteria", "entrada", "punto", "acordado"]
FACULTIES = ["ingenieria", "ciencias", "salud", "sociales", "humanidades", "artes"]
ITEM_STATUSES = ["disponible", "reservado", "entregado"]
# Cuentas de demostración: efímeras, sin datos personales y solo con SEED_DEMO=1.
# Lo que publican NO se borra: al caducar la cuenta, sus objetos se transfieren a
# la cuenta de muestra para que el catálogo siga siendo compartido y visible.
DEMO_EMAIL_DOMAIN = "demo.campus-circular.local"
try:
    DEMO_TTL_HOURS = max(1, int(os.environ.get("DEMO_TTL_HOURS", "24")))
except ValueError:
    DEMO_TTL_HOURS = 24
DEMO_NAME = "Invitado CTC"
REQUEST_STATUSES = ["pendiente", "aceptada", "rechazada", "cancelada", "completada"]
RATING_MIN = 1
RATING_MAX = 5
RATING_COMMENT_MAX = 300

# Dominios de correo institucional que otorgan la insignia informativa. La
# lista es configurable con UNIVERSITY_DOMAINS (separada por comas) y además se
# aceptan subdominios (alumnos., estudantes.) y los sufijos académicos .edu/.ac.
DEFAULT_UNIVERSITY_DOMAINS = (
    "uvigo.gal,uvigo.es,udc.gal,udc.es,usc.gal,usc.es,uned.es,uoc.edu,"
    "upm.es,upv.es,uam.es,ub.edu,uab.cat,upf.edu,ucm.es,ugr.es,us.es,uma.es,"
    "unizar.es,unav.es,uib.es,ull.es,ulpgc.es,unican.es,uniovi.es,uv.es,"
    "ujaen.es,uclm.es,uah.es,uex.es,unex.es,ubu.es,unileon.es,usal.es,uva.es,"
    "upo.es,uco.es,uhu.es,uca.es,ehu.eus,ehu.es,upna.es,unirioja.es,uax.es,"
    "ucavila.es,ucjc.edu,uneatlantico.es,usal.es,universidadviu.es"
)
UNIVERSITY_DOMAINS = frozenset(
    d.strip().lower()
    for d in os.environ.get("UNIVERSITY_DOMAINS", DEFAULT_UNIVERSITY_DOMAINS).split(",")
    if d.strip()
)

# Estimaciones orientativas por categoría (no medidas): peso medio de un objeto
# reutilizado y valor de reposición aproximado. Se muestran siempre como
# estimación y nunca se presentan como impacto auditado.
CATEGORY_IMPACT = {
    "libros": {"kg": 1.1, "value": 18},
    "ropa": {"kg": 0.9, "value": 22},
    "muebles": {"kg": 11.0, "value": 45},
    "estudio": {"kg": 0.6, "value": 24},
    "electronica": {"kg": 1.4, "value": 38},
    "cocina": {"kg": 2.4, "value": 26},
    "electrodomesticos": {"kg": 4.2, "value": 40},
    "deporte": {"kg": 2.0, "value": 25},
    "otros": {"kg": 1.5, "value": 15},
}
IMPACT_LEVELS = [("semilla", 0), ("brote", 2), ("arbol", 5), ("bosque", 10)]

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
# Las fotos se reescalan y recomprimen en servidor: el máximo real servido
# ronda 150–350 KB, no los 5 MB que se aceptan a la entrada.
MAX_IMAGE_DIMENSION = 1200
MAX_IMAGE_BYTES = 400 * 1024
MAX_SOURCE_PIXELS = 40_000_000
IMAGE_QUALITY = 82
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_URL_LEN = 300
DEFAULT_PAGE_SIZE = 24
MAX_PAGE_SIZE = 60
STATS_CACHE_SECONDS = 15
COMPRESSIBLE_TYPES = (
    "text/", "application/json", "application/javascript", "text/javascript",
    "application/xml", "image/svg+xml",
)
COMPRESS_MIN_BYTES = 700
UPLOAD_URL_PREFIX = "/static/uploads/"

# --- Seguridad: límites de uso, CORS y moderación --------------------------
# Ventana deslizante en memoria por proceso: con varios workers el límite real
# es (workers × límite). Suficiente para frenar fuerza bruta y spam sin añadir
# Redis ni otro servicio externo.
# En una exposición todos los asistentes comparten la IP del wifi: conviene poder
# subir el techo global sin tocar el código (API_RATE_LIMIT=900, por ejemplo).
try:
    API_RATE_LIMIT = max(60, int(os.environ.get("API_RATE_LIMIT", "300")))
except ValueError:
    API_RATE_LIMIT = 300

RATE_LIMITS = {
    "api": (API_RATE_LIMIT, 60),  # techo global por IP para /api/
    "login": (10, 300),        # intentos de acceso por IP
    "login_account": (6, 300),  # intentos por cuenta, aunque cambie la IP
    "register": (5, 3600),     # cuentas nuevas por IP
    "item": (12, 3600),        # publicaciones por cuenta
    "upload": (25, 3600),      # fotos subidas por cuenta
    "request": (20, 3600),     # solicitudes enviadas por cuenta
    "report": (10, 3600),      # reportes enviados por cuenta
    "message": (30, 3600),     # mensajes dentro de una solicitud
    "profile": (10, 3600),     # cambios de perfil por cuenta
    "password": (5, 3600),     # cambios de contraseña por cuenta
    "item_edit": (60, 3600),   # ediciones de publicaciones por cuenta
    "restore": (30, 3600),     # restauraciones de publicaciones (moderación)
    "demo": (40, 3600),        # cuentas temporales (exposición con IP compartida)
}
MAX_JSON_BYTES = 64 * 1024
DEFAULT_CORS_ORIGINS = "https://campus-circular.onrender.com"
CORS_ORIGINS = frozenset(
    origin.strip().rstrip("/")
    for origin in os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
)
REPORT_REASONS = ["spam", "inapropiado", "estafa", "duplicado", "otro"]
REPORT_COMMENT_MAX = 300
REPORT_HIDE_THRESHOLD = max(1, int(os.environ.get("REPORT_HIDE_THRESHOLD", "3") or 3))
# Cuentas autorizadas para revisar y restaurar publicaciones ocultas por
# reportes. Lista de correos separados por comas; vacía = nadie puede
# restaurar (la moderación queda pendiente de configurar la variable).
ADMIN_EMAILS = frozenset(
    e.strip().lower()
    for e in os.environ.get("ADMIN_EMAILS", "").split(",")
    if e.strip()
)
SESSIONS_PER_USER = 8
DUMMY_PASSWORD_HASH = generate_password_hash("contrasena-senuelo-sin-uso-0123456789")

app = Flask(__name__)
# Render (y cualquier proxy) termina TLS y añade X-Forwarded-*. Sin esto,
# request.remote_addr sería el proxy y los límites por IP no servirían.
# Ajustable con TRUST_PROXY=0 si se sirve sin proxy delante.
_TRUST_PROXY_HOPS = max(0, int(os.environ.get("TRUST_PROXY", "1") or 0))
if _TRUST_PROXY_HOPS:
    app.wsgi_app = ProxyFix(
        app.wsgi_app, x_for=_TRUST_PROXY_HOPS, x_proto=_TRUST_PROXY_HOPS,
        x_host=_TRUST_PROXY_HOPS,
    )
if APP_ENV != "production":
    # En local no hay CORS que restringir: la SPA se sirve del mismo origen.
    CORS_ORIGINS = CORS_ORIGINS | {
        "http://localhost:5000", "http://127.0.0.1:5000", "http://0.0.0.0:5000",
    }
# Embeber la app en un iframe ajeno solo tiene sentido en local (preview). En
# producción el valor por defecto es `frame-ancestors 'self'`; ALLOW_EMBED=1 lo
# relaja de forma explícita y ALLOW_EMBED=0 lo fuerza cerrado.
ALLOW_EMBED = (
    os.environ.get("ALLOW_EMBED", "").strip().lower() in ("1", "true", "yes", "on")
    if os.environ.get("ALLOW_EMBED", "").strip()
    else APP_ENV != "production"
)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
# Los estáticos con nombre fijo se cachean una semana; CSS y JS llevan versión
# en la URL y se sirven con caché inmutable (ver `asset_file`).
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 7 * 24 * 3600
app.json.ensure_ascii = False


def _asset_version() -> str:
    """Huella corta de CSS+JS para invalidar la caché al desplegar."""
    digest = hashlib.sha256()
    for rel in ("css/style.css", "js/app.js"):
        try:
            with open(os.path.join(BASE_DIR, "static", rel), "rb") as fh:
                digest.update(fh.read())
        except OSError:
            digest.update(rel.encode("utf-8"))
    return digest.hexdigest()[:10]


ASSET_VERSION = _asset_version()


def _load_img_manifest() -> dict:
    """Variantes responsive por imagen (lo genera tools/optimize_images.py).

    Si el fichero no existe la app sigue funcionando: el frontend cae a `<img>`
    con la URL original.
    """
    path = os.path.join(BASE_DIR, "static", "img", "manifest.json")
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


IMG_MANIFEST = _load_img_manifest()

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
        "assetVersion": ASSET_VERSION,
        "pageSize": DEFAULT_PAGE_SIZE,
        "imgManifest": IMG_MANIFEST,
        "demoMode": SEED_DEMO,
        "demoTtlHours": DEMO_TTL_HOURS,
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
            # WAL permite lecturas concurrentes durante una escritura y evita
            # los bloqueos típicos en el servidor de desarrollo.
            try:
                self.raw.execute("PRAGMA journal_mode = WAL")
                self.raw.execute("PRAGMA synchronous = NORMAL")
                self.raw.execute("PRAGMA busy_timeout = 5000")
            except sqlite3.Error:
                pass

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
            script = script.replace("bytes BLOB NOT NULL", "bytes BYTEA NOT NULL")
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


def pagination_args(default=DEFAULT_PAGE_SIZE):
    """(`limit`, `offset`) saneados para cualquier listado."""
    try:
        limit = int(request.args.get("limit", default))
    except (TypeError, ValueError):
        limit = default
    try:
        offset = int(request.args.get("offset", 0))
    except (TypeError, ValueError):
        offset = 0
    return max(1, min(limit, MAX_PAGE_SIZE)), max(0, min(offset, 200_000))


def page_payload(rows, total, limit, offset, serializer):
    items = [serializer(r) for r in rows]
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(items) < total,
    }


def get_db():
    # Arranque perezoso: importar el módulo no toca la base ni el disco.
    # La primera conexión de cada proceso inicializa el esquema (y, si
    # procede, la demo) respetando los valores *actuales* de DATABASE,
    # SEED_DEMO y UPLOAD_DIR, para que los tests puedan reasignarlos.
    ensure_bootstrapped()
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


def _rollback_quietly():
    """Rollback defensivo de la conexión de la petición, si la hay."""
    try:
        db = g.get("db")
    except Exception:  # noqa: BLE001 - fuera de contexto de app no hay nada que revertir
        db = None
    if db is not None:
        try:
            db.rollback()
        except Exception:  # noqa: BLE001 - la conexión ya puede estar cerrada
            pass


def _storage_unavailable():
    """Respuesta 503 uniforme tras un error de base de datos."""
    _rollback_quietly()
    return jsonify({
        "error": "storage_unavailable",
        "message": "No se pudo guardar en este momento. Inténtalo de nuevo más tarde.",
    }), 503


def _acquire_write_lock(db):
    """Serializa escritores en SQLite; en PostgreSQL se bloquea por fila.

    En SQLite, ``BEGIN IMMEDIATE`` adquiere el bloqueo de escritura al
    inicio de la transacción, de modo que el ``SELECT`` posterior ve un
    estado estable. Si ya hay una transacción abierta se ignora el error.
    En PostgreSQL el llamante debe bloquear la fila con ``_lock_item_row``.
    """
    if USE_POSTGRES:
        return
    try:
        db.execute("BEGIN IMMEDIATE")
    except DB_ERRORS:
        pass


def _lock_item_row(db, item_id):
    """Bloquea la fila del objeto en PostgreSQL (``FOR UPDATE``)."""
    if USE_POSTGRES:
        db.execute("SELECT id FROM items WHERE id = ? FOR UPDATE", (item_id,))


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
            faculty TEXT NOT NULL DEFAULT '',
            image_url TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'disponible',
            delivered_at TEXT NOT NULL DEFAULT '',
            hidden_at TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL DEFAULT '',
            handover_point TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pendiente',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL,
            PRIMARY KEY (user_id, item_id)
        );
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
            rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            rated_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            score INTEGER NOT NULL,
            comment TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            UNIQUE (request_id, rater_id)
        );
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reason TEXT NOT NULL,
            comment TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'abierto',
            created_at TEXT NOT NULL,
            UNIQUE (item_id, reporter_id)
        );
        CREATE TABLE IF NOT EXISTS media (
            filename TEXT PRIMARY KEY,
            content_type TEXT NOT NULL,
            bytes BLOB NOT NULL,
            size INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_items_status_created ON items(status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
        CREATE INDEX IF NOT EXISTS idx_items_campus ON items(campus);
        CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_requests_item ON requests(item_id);
        CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);
        CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
        CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings(rated_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at);
        CREATE INDEX IF NOT EXISTS idx_reports_item ON reports(item_id);
        -- Una sola solicitud pendiente por (objeto, solicitante): la
        -- unicidad se impone en la base para que dos peticiones
        -- concurrentes no creen duplicados (ver create_request).
        CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_pending_unique
            ON requests(item_id, requester_id) WHERE status = 'pendiente';
        -- El índice suelto de status queda cubierto por (status, created_at).
        DROP INDEX IF EXISTS idx_items_status;
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
            db.execute("LOCK TABLE users, sessions, items, requests IN ACCESS EXCLUSIVE MODE")
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_at TEXT NOT NULL DEFAULT ''")
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_version TEXT NOT NULL DEFAULT ''")
            db.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS faculty TEXT NOT NULL DEFAULT ''")
            db.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS delivered_at TEXT NOT NULL DEFAULT ''")
            db.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS hidden_at TEXT NOT NULL DEFAULT ''")
            db.execute("ALTER TABLE requests ADD COLUMN IF NOT EXISTS handover_point TEXT NOT NULL DEFAULT ''")
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
            item_cols = {r["name"] for r in db.execute("PRAGMA table_info(items)").fetchall()}
            if "faculty" not in item_cols:
                db.execute("ALTER TABLE items ADD COLUMN faculty TEXT NOT NULL DEFAULT ''")
            if "delivered_at" not in item_cols:
                db.execute("ALTER TABLE items ADD COLUMN delivered_at TEXT NOT NULL DEFAULT ''")
            if "hidden_at" not in item_cols:
                db.execute("ALTER TABLE items ADD COLUMN hidden_at TEXT NOT NULL DEFAULT ''")
            request_cols = {r["name"] for r in db.execute("PRAGMA table_info(requests)").fetchall()}
            if "handover_point" not in request_cols:
                db.execute("ALTER TABLE requests ADD COLUMN handover_point TEXT NOT NULL DEFAULT ''")

        # Los objetos ya entregados antes de existir `delivered_at` se fechan con
        # su fecha de publicación para no perder el histórico de impacto.
        db.execute(
            "UPDATE items SET delivered_at = created_at "
            "WHERE status = 'entregado' AND delivered_at = ''"
        )
        db.execute(
            "UPDATE requests SET handover_point = COALESCE("
            "(SELECT handover_point FROM items WHERE items.id = requests.item_id), '') "
            "WHERE handover_point = ''"
        )

        # Las versiones anteriores guardaban el bearer token directamente. Como
        # son aleatorios de alta entropía, SHA-256 impide reutilizarlos si se
        # copia la base. La migración conserva las sesiones vigentes.
        for row in db.execute("SELECT token FROM sessions").fetchall():
            token = row["token"]
            if not re.fullmatch(r"[0-9a-f]{64}", token):
                digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
                db.execute("UPDATE sessions SET token = ? WHERE token = ?", (digest, token))

        # Unicidad de la solicitud pendiente por (objeto, solicitante): antes
        # de crear el índice parcial hay que cancelar los duplicados que
        # pudieran existir por carreras entre peticiones concurrentes. Se
        # conserva la más antigua (menor id) y el resto pasa a `cancelada`.
        db.execute(
            "UPDATE requests SET status = 'cancelada' WHERE status = 'pendiente' "
            "AND id NOT IN (SELECT MIN(id) FROM requests WHERE status = 'pendiente' "
            "GROUP BY item_id, requester_id)"
        )
        db.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_pending_unique "
            "ON requests(item_id, requester_id) WHERE status = 'pendiente'"
        )
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
        "academic_email": bool(r["verified"]) or is_university_email(r["email"]),
        "university_verified": bool(r["verified"]) or is_university_email(r["email"]),
        "consent_ok": bool(r["consent_at"]) and r["consent_version"] == LEGAL_VERSION,
        "consent_at": r["consent_at"],
        "consent_version": r["consent_version"],
        "created_at": r["created_at"],
    }


def row_to_public_user(r):
    """Vista pública mínima: nunca incluye email, titulación ni consentimiento."""
    if r is None:
        return None
    verified = bool(r["verified"]) or is_university_email(r["email"])
    return {
        "id": r["id"],
        "name": r["name"],
        "campus": r["campus"],
        "academic_email": verified,
        "university_verified": verified,
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
        "faculty": r["faculty"] or "",
        "handover_point": r["handover_point"],
        "image_url": r["image_url"],
        "status": r["status"],
        "created_at": r["created_at"],
        "delivered_at": r["delivered_at"] or "",
        "hidden": bool(r["hidden_at"]) if "hidden_at" in r.keys() else False,
        "impact": item_impact(r),
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
        "handover_point": r["handover_point"] or "",
        "status": r["status"],
        "created_at": r["created_at"],
    }


# ---------------------------------------------------------------------------
# Impacto, confianza y valoraciones
# ---------------------------------------------------------------------------
def item_impact(item) -> dict:
    """Estimación transparente por categoría: peso medio y valor de reposición.

    No es una medición: sirve para dar una idea del orden de magnitud y se
    presenta siempre como estimación en la interfaz.
    """
    estimate = CATEGORY_IMPACT.get(item["category"], CATEGORY_IMPACT["otros"])
    price = float(item["price"] or 0)
    if item["exchange_type"] == "vender":
        savings = max(0.0, estimate["value"] - price)
    else:
        savings = float(estimate["value"])
    return {
        "kg": estimate["kg"],
        "savings": round(savings, 2),
        "retail_value": estimate["value"],
    }


def impact_summary(db, owner_id=None) -> dict:
    sql = ("SELECT category, exchange_type, price FROM items "
           "WHERE status = 'entregado' AND hidden_at = ''")
    params = ()
    if owner_id is not None:
        sql += " AND owner_id = ?"
        params = (owner_id,)
    rows = db.execute(sql, params).fetchall()
    kg = 0.0
    savings = 0.0
    by_category = {}
    for r in rows:
        impact = item_impact(r)
        kg += impact["kg"]
        savings += impact["savings"]
        bucket = by_category.setdefault(
            r["category"], {"category": r["category"], "count": 0, "kg": 0.0, "savings": 0.0}
        )
        bucket["count"] += 1
        bucket["kg"] += impact["kg"]
        bucket["savings"] += impact["savings"]
    for bucket in by_category.values():
        bucket["kg"] = round(bucket["kg"], 1)
        bucket["savings"] = round(bucket["savings"], 2)
    return {
        "reused": len(rows),
        "kg": round(kg, 1),
        "savings": round(savings, 2),
        "by_category": sorted(by_category.values(), key=lambda b: (-b["count"], b["category"])),
    }


def level_for(count: int) -> dict:
    current = IMPACT_LEVELS[0]
    following = None
    for key, threshold in IMPACT_LEVELS:
        if count >= threshold:
            current = (key, threshold)
        elif following is None:
            following = (key, threshold)
    progress = 100
    if following:
        span = following[1] - current[1]
        progress = int(round((count - current[1]) * 100 / span)) if span else 100
    return {
        "key": current[0],
        "count": count,
        "next": following[0] if following else None,
        "next_at": following[1] if following else None,
        "progress": max(0, min(100, progress)),
    }


def rating_summary(db, user_id, limit=3) -> dict:
    agg = db.execute(
        "SELECT COUNT(*) c, AVG(score) a FROM ratings WHERE rated_id = ?", (user_id,)
    ).fetchone()
    count = agg["c"] or 0
    average = round(float(agg["a"]), 2) if agg["a"] is not None else 0.0
    recent = []
    if count:
        rows = db.execute(
            "SELECT ra.score, ra.comment, ra.created_at, u.name AS rater_name "
            "FROM ratings ra JOIN users u ON u.id = ra.rater_id "
            "WHERE ra.rated_id = ? ORDER BY ra.created_at DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
        recent = [
            {
                "score": r["score"],
                "comment": r["comment"],
                "created_at": r["created_at"],
                "rater_name": r["rater_name"],
            }
            for r in rows
        ]
    return {"count": count, "average": average, "recent": recent}


def exchange_summary(db, user_id) -> dict:
    given = db.execute(
        "SELECT COUNT(*) c FROM items WHERE owner_id = ? AND status = 'entregado'", (user_id,)
    ).fetchone()["c"]
    received = db.execute(
        "SELECT COUNT(*) c FROM requests r JOIN items i ON i.id = r.item_id "
        "WHERE r.requester_id = ? AND r.status = 'completada' AND i.owner_id <> ?",
        (user_id, user_id),
    ).fetchone()["c"]
    completed = db.execute(
        "SELECT COUNT(*) c FROM requests r JOIN items i ON i.id = r.item_id "
        "WHERE r.status = 'completada' AND (i.owner_id = ? OR r.requester_id = ?)",
        (user_id, user_id),
    ).fetchone()["c"]
    return {"completed": completed, "given": given, "received": received}


def user_trust(db, user_row) -> dict:
    """Capa de confianza pública: insignia, valoraciones, historial e impacto."""
    uid = user_row["id"]
    exchanges = exchange_summary(db, uid)
    return {
        "verified": bool(user_row["verified"]) or is_university_email(user_row["email"]),
        "rating": rating_summary(db, uid),
        "exchanges": exchanges,
        "impact": impact_summary(db, uid),
        "level": level_for(exchanges["completed"]),
    }


def badges_for(trust) -> list:
    exchanges = trust["exchanges"]
    return [
        {"key": "verified", "earned": bool(trust["verified"])},
        {"key": "first_delivery", "earned": exchanges["given"] >= 1},
        {"key": "five_exchanges", "earned": exchanges["completed"] >= 5},
        {"key": "ten_kg", "earned": trust["impact"]["kg"] >= 10},
        {"key": "rated", "earned": trust["rating"]["count"] >= 1},
    ]


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


# Claves que aparecen en cualquier filtración: la longitud mínima no las frena.
WEAK_PASSWORDS = frozenset({
    "123456789", "1234567890", "12345678", "12345678910", "password",
    "password1", "password123", "contrasena", "contraseña", "qwertyui",
    "qwerty123", "iloveyou", "11111111", "00000000", "abc12345",
    "admin123", "welcome1", "letmein1", "universidad", "estudiante",
    "1234abcd", "a1234567", "passw0rd", "holahola", "campus123",
})


def password_problem(password: str, email: str = "") -> str:
    """Código de error de la contraseña, o cadena vacía si es aceptable.

    Se aplica igual en el registro y en el cambio de contraseña para que la
    regla no dependa de por dónde entre el usuario.
    """
    if not valid_password(password):
        return "invalid_password"
    lowered = password.strip().lower()
    if lowered in WEAK_PASSWORDS or len(set(password)) == 1:
        return "weak_password"
    local = (email or "").split("@")[0].strip().lower()
    if len(local) >= 4 and lowered == local:
        return "weak_password"
    return ""


WEAK_PASSWORD_MESSAGE = (
    "Esa contraseña es demasiado común. Usa una frase o combinación que no "
    "aparezca en filtraciones conocidas."
)


ACCENT_MAP = {
    "á": "a", "à": "a", "ä": "a", "â": "a", "ã": "a", "å": "a",
    "é": "e", "è": "e", "ë": "e", "ê": "e",
    "í": "i", "ì": "i", "ï": "i", "î": "i",
    "ó": "o", "ò": "o", "ö": "o", "ô": "o", "õ": "o",
    "ú": "u", "ù": "u", "ü": "u", "û": "u",
    "ñ": "n", "ç": "c",
}


def fold_text(value: str) -> str:
    """Minúsculas y sin acentos: «lampara» encuentra «Lámpara»."""
    return "".join(ACCENT_MAP.get(ch, ch) for ch in (value or "").lower())


def folded_column(column: str) -> str:
    """Expresión SQL que pliega acentos para la búsqueda.

    En PostgreSQL se usa ``translate()`` (una sola función, mucho más
    barata que 25 ``REPLACE()`` anidados). En SQLite no hay ``translate``,
    así que se mantiene la cadena de ``REPLACE()``; el coste es lineal en
    el número de filas escaneadas y no hay índice de texto completo, por
    lo que la búsqueda sigue acotada a 4 términos (ver ``list_items``).
    """
    if USE_POSTGRES:
        src = "".join(ACCENT_MAP.keys())
        dst = "".join(ACCENT_MAP.values())
        return f"TRANSLATE(LOWER({column}), '{src}', '{dst}')"
    expr = f"LOWER({column})"
    for src, dst in ACCENT_MAP.items():
        expr = f"REPLACE({expr}, '{src}', '{dst}')"
    return expr


def escape_like(term: str) -> str:
    """Escapa los comodines de ``LIKE`` (``%``, ``_`` y ``\\``).

    Sin esto, buscar ``%`` coincidía con todo el catálogo. Debe usarse
    siempre junto con ``LIKE ? ESCAPE '\\'``.
    """
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def email_domain(email: str) -> str:
    try:
        return email.rsplit("@", 1)[1].lower().strip().rstrip(".")
    except (AttributeError, IndexError):
        return ""


def is_university_email(email: str) -> bool:
    """Insignia meramente informativa: NO acredita matrícula ni identidad.

    Se apoya en una lista configurable de dominios institucionales y, como red
    de seguridad, en los sufijos académicos habituales (.edu, .ac.xx) y en los
    subdominios de alumnado. El resultado se calcula, no se confía al azar de
    una columna antigua.
    """
    domain = email_domain(email)
    if not domain or "." not in domain:
        return False
    for known in UNIVERSITY_DOMAINS:
        if domain == known or domain.endswith("." + known):
            return True
    if re.search(r"(^|\.)edu(\.[a-z]{2})?$", domain):
        return True
    if re.search(r"\.ac\.[a-z]{2}$", domain):
        return True
    return domain.startswith(
        ("alumnos.", "alumnado.", "estudiantes.", "students.", "campus.")
    )


# Alias conservado para llamadas y pruebas existentes.
has_academic_domain = is_university_email


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


def optimize_image(raw: bytes) -> bytes:
    """Reescala a 1200 px, corrige orientación y recomprime a WebP.

    Al recomprimir se pierden los metadatos EXIF (incluidas coordenadas GPS),
    que en fotos de móvil son datos personales que no necesitamos.
    """
    try:
        with Image.open(io.BytesIO(raw)) as probe:
            # El formato real manda: un GIF renombrado a .png no se acepta.
            if probe.format not in {"JPEG", "PNG", "WEBP"}:
                raise ValueError("invalid_image")
            if probe.width * probe.height > MAX_SOURCE_PIXELS:
                raise ValueError("image_too_large")
            probe.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("invalid_image") from exc

    with Image.open(io.BytesIO(raw)) as source:
        img = ImageOps.exif_transpose(source)
        if img.mode in ("P", "LA", "RGBA"):
            img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)
        quality = IMAGE_QUALITY
        while True:
            buffer = io.BytesIO()
            img.save(buffer, format="WEBP", quality=quality, method=4)
            data = buffer.getvalue()
            if len(data) <= MAX_IMAGE_BYTES or quality <= 45:
                return data
            quality -= 10


def image_filename() -> str:
    return f"{secrets.token_hex(16)}.webp"


def store_media(db, filename: str, data: bytes, content_type: str) -> None:
    """Guarda la imagen en la base de datos: sobrevive a reinicios de Render."""
    db.execute(
        "INSERT INTO media (filename, content_type, bytes, size, created_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (filename, content_type, data, len(data), now_iso()),
    )


def read_media(db, filename: str):
    return db.execute(
        "SELECT content_type, bytes FROM media WHERE filename = ?", (filename,)
    ).fetchone()


def safe_upload_name(name: str) -> str:
    filename = secure_filename(os.path.basename(name or ""))
    if not filename or "." not in filename:
        return ""
    root = os.path.abspath(UPLOAD_DIR)
    path = os.path.abspath(os.path.join(root, filename))
    if os.path.commonpath([root, path]) != root:
        return ""
    return filename


def remove_uploaded_file(url: str) -> bool:
    """Borra una imagen subida del disco y de la base de datos."""
    if not url or not url.startswith(UPLOAD_URL_PREFIX):
        return False
    filename = safe_upload_name(urlparse(url).path)
    if not filename:
        return False
    removed = False
    try:
        os.remove(os.path.join(UPLOAD_DIR, filename))
        removed = True
    except FileNotFoundError:
        pass
    except OSError:
        app.logger.warning("No se pudo borrar la imagen %s del disco", filename)
    # Conexión propia: la limpieza puede ocurrir fuera de una petición y no
    # debe reabrir la transacción en curso.
    db = connect_db()
    try:
        db.execute("DELETE FROM media WHERE filename = ?", (filename,))
        db.commit()
        removed = True
    except DB_ERRORS:
        db.rollback()
        app.logger.exception("No se pudo borrar la imagen %s de la base de datos", filename)
    finally:
        db.close()
    return removed


def sync_uploads_to_db() -> int:
    """Importa a la base las imágenes que aún viven solo en disco.

    Necesario para no perder las fotos subidas antes de este cambio cuando
    Render recicle el contenedor tras un despliegue.
    """
    try:
        names = [f for f in os.listdir(UPLOAD_DIR)
                 if os.path.splitext(f)[1].lower() in ALLOWED_EXTENSIONS]
    except OSError:
        return 0
    if not names:
        return 0
    db = connect_db()
    imported = 0
    try:
        existing = {r["filename"] for r in db.execute("SELECT filename FROM media").fetchall()}
        for name in names:
            if name in existing:
                continue
            path = os.path.join(UPLOAD_DIR, name)
            try:
                if os.path.getsize(path) > MAX_UPLOAD_BYTES:
                    continue
                with open(path, "rb") as fh:
                    data = fh.read()
            except OSError:
                continue
            if not valid_image_bytes(data[:12]):
                continue
            content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
            db.execute(
                "INSERT INTO media (filename, content_type, bytes, size, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (name, content_type, data, len(data), now_iso()),
            )
            imported += 1
        if imported:
            db.commit()
    except DB_ERRORS:
        db.rollback()
        app.logger.exception("No se pudieron importar las imágenes locales a la base de datos")
        return 0
    finally:
        db.close()
    return imported


def cleanup_orphan_media(days: int = 7) -> int:
    """Elimina fotos subidas que nunca llegaron a publicarse."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    db = connect_db()
    try:
        cur = db.execute(
            "DELETE FROM media WHERE created_at < ? AND filename NOT IN ("
            "SELECT SUBSTR(image_url, ?) FROM items WHERE image_url LIKE ?)",
            (cutoff, len(UPLOAD_URL_PREFIX) + 1, UPLOAD_URL_PREFIX + "%"),
        )
        db.commit()
        return cur.rowcount if cur.rowcount and cur.rowcount > 0 else 0
    except DB_ERRORS:
        db.rollback()
        app.logger.exception("No se pudieron limpiar las imágenes huérfanas")
        return 0
    finally:
        db.close()


def valid_image_bytes(head: bytes) -> bool:
    return (
        head.startswith(b"\xff\xd8\xff")
        or head[:8] == b"\x89PNG\r\n\x1a\n"
        or head[:6] in (b"GIF87a", b"GIF89a")
        or (head[:4] == b"RIFF" and head[8:12] == b"WEBP")
    )


def cleanup_expired_sessions(db):
    db.execute("DELETE FROM sessions WHERE expires_at <= ?", (now_iso(),))


def trim_sessions(db, user_id):
    """Limita las sesiones vivas por cuenta (si se filtra un token, hay tope)."""
    db.execute(
        "DELETE FROM sessions WHERE user_id = ? AND token NOT IN ("
        "SELECT token FROM sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT ?)",
        (user_id, user_id, SESSIONS_PER_USER - 1),
    )


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


def is_admin_user(user) -> bool:
    """Cuenta de moderación: su correo está en la lista `ADMIN_EMAILS`."""
    if not user:
        return False
    return (user.get("email") or "").strip().lower() in ADMIN_EMAILS


# ---------------------------------------------------------------------------
# Seed data — contenido de demostración, sin credenciales compartidas
# ---------------------------------------------------------------------------
SEED_OWNER = {
    "name": "Equipo Campus Circular",
    "email": "equipo@campus-circular.local",
    "campus": "vigo",
}

SEED_ITEMS = [
    {"owner": 0, "title": "Libro de Derecho Civil — edición 2023",
     "description": "Libro de texto usado un curso. Subrayados leves en los primeros capítulos, resto limpio. Incluyo apuntes de clase en PDF. Se entrega en mano.",
     "category": "libros", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "faculty": "sociales", "campus": "vigo", "handover_point": "biblioteca", "image_url": "/static/img/items/libro-derecho.jpg"},
    {"owner": 0, "title": "Calculadora científica",
     "description": "Calculadora en perfecto estado, con funda y tapa. Puedo prestarla por un cuatrimestre; acordamos por escrito la fecha de devolución.",
     "category": "estudio", "condition": "como_nuevo", "exchange_type": "prestar", "price": 0,
     "faculty": "ciencias", "campus": "vigo", "handover_point": "punto", "image_url": "/static/img/items/calculadora.jpg"},
    {"owner": 0, "title": "Chaqueta de invierno talla M",
     "description": "Chaqueta en buen estado, sin manchas ni roturas. Busco intercambiarla por otra talla o regalarla a quien la necesite.",
     "category": "ropa", "condition": "bueno", "exchange_type": "intercambiar", "price": 0,
     "faculty": "sociales", "campus": "vigo", "handover_point": "entrada", "image_url": "/static/img/items/chaqueta.jpg"},
    {"owner": 0, "title": "Escritorio pequeño para piso compartido",
     "description": "Escritorio de 110 x 55 cm, estable y sin daños. Hay que desmontarlo; puedo ayudar con el desmontaje en el punto de entrega.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "faculty": "ingenieria", "campus": "vigo", "handover_point": "conserjeria", "image_url": "/static/img/items/escritorio.jpg"},
    {"owner": 0, "title": "Estantería pequeña de 3 baldas",
     "description": "Estantería de madera clara para libros y apuntes. En buen estado, sin arañazos visibles. Se entrega desmontada.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "faculty": "humanidades", "campus": "pontevedra", "handover_point": "biblioteca", "image_url": "/static/img/items/estanteria.jpg"},
    {"owner": 0, "title": "Auriculares inalámbricos",
     "description": "Auriculares con estuche de carga y batería en buen estado. Precio orientativo; el pago, si procede, se acuerda directamente y fuera de la plataforma.",
     "category": "electronica", "condition": "como_nuevo", "exchange_type": "vender", "price": 15,
     "faculty": "ingenieria", "campus": "vigo", "handover_point": "punto", "image_url": "/static/img/items/auriculares.jpg"},
    {"owner": 0, "title": "Juego de ollas y sartenes",
     "description": "Set de cocina para piso compartido: dos ollas, dos sartenes y tapas. Usados pero en buen estado. Préstamo temporal con devolución acordada.",
     "category": "cocina", "condition": "bueno", "exchange_type": "prestar", "price": 0,
     "faculty": "sociales", "campus": "ourense", "handover_point": "cafeteria", "image_url": "/static/img/items/ollas.jpg"},
    {"owner": 0, "title": "Freidora de aire 4 L",
     "description": "Freidora de aire en buen estado, funciona sin problemas y se entrega con manual. La regalo porque en mi piso nuevo ya hay una.",
     "category": "electrodomesticos", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "faculty": "sociales", "campus": "vigo", "handover_point": "punto", "image_url": "/static/img/items/freidora.jpg"},
    {"owner": 0, "title": "Apuntes completos de Ingeniería",
     "description": "Carpeta con apuntes, exámenes resueltos y prácticas de primeros cursos. En papel; puedo enviar fotos si hace falta antes de quedar.",
     "category": "libros", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "faculty": "ingenieria", "campus": "vigo", "handover_point": "biblioteca", "image_url": "/static/img/items/apuntes.jpg"},
    {"owner": 0, "title": "Mochila 25 L con compartimento para portátil",
     "description": "Mochila resistente, como nueva y sin roturas. La intercambio por una más pequeña o la regalo.",
     "category": "ropa", "condition": "como_nuevo", "exchange_type": "intercambiar", "price": 0,
     "faculty": "artes", "campus": "vigo", "handover_point": "entrada", "image_url": "/static/img/items/mochila.jpg"},
    {"owner": 0, "title": "Lámpara de escritorio LED",
     "description": "Lámpara con luz regulable, ideal para estudiar. En buen estado. Se entrega en un lugar público y acordado.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "faculty": "artes", "campus": "vigo", "handover_point": "acordado", "image_url": "/static/img/items/lampara.jpg"},
    {"owner": 0, "title": "Teclado inalámbrico silencioso",
     "description": "Teclado perfecto para biblioteca y aulas, funciona con pilas AA. Precio simbólico orientativo; Campus Circular no gestiona el cobro.",
     "category": "electronica", "condition": "bueno", "exchange_type": "vender", "price": 10,
     "faculty": "ciencias", "campus": "pontevedra", "handover_point": "conserjeria", "image_url": "/static/img/items/teclado.jpg"},
]


SEED_PEERS = [
    {"name": "Lucía Ferreiro", "email": "lucia.ferreiro@uvigo.gal", "campus": "vigo"},
    {"name": "Diego Camba", "email": "diego.camba@uvigo.gal", "campus": "vigo"},
]

# Historial de entregas ya cerradas: da contexto a las valoraciones y a las
# cifras de impacto de la demo. Las cifras son estimaciones por categoría.
SEED_HISTORY = [
    {"owner": 0, "title": "Bicicleta urbana revisada",
     "description": "Bicicleta de ciudad con frenos y cambios revisados. La compré de segunda mano y la vendo al acabar el curso.",
     "category": "deporte", "condition": "bueno", "exchange_type": "vender", "price": 45,
     "campus": "vigo", "faculty": "ingenieria", "handover_point": "conserjeria",
     "image_url": "/static/img/items/deporte.jpg", "days_ago": 26},
    {"owner": 0, "title": "Tres libros de primero de carrera",
     "description": "Manuales de primero con subrayados a lápiz. Los regalo juntos para que no acaben en un contenedor.",
     "category": "libros", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "faculty": "sociales", "handover_point": "biblioteca",
     "image_url": "/static/img/items/libros.jpg", "days_ago": 19},
    {"owner": 0, "title": "Silla plegable de escritorio",
     "description": "Silla sencilla y estable, se pliega para transportarla. Perfecta para pisos pequeños.",
     "category": "muebles", "condition": "usable", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "faculty": "ingenieria", "handover_point": "punto",
     "image_url": "/static/img/items/muebles.jpg", "days_ago": 15},
    {"owner": 1, "title": "Juego de sartenes antiadherentes",
     "description": "Dos sartenes en buen estado, con alguna marca de uso. Las dejé limpias para la entrega.",
     "category": "cocina", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "faculty": "sociales", "handover_point": "cafeteria",
     "image_url": "/static/img/items/cocina.jpg", "days_ago": 12},
    {"owner": 1, "title": "Monitor de 22 pulgadas",
     "description": "Monitor con cable HDMI y base original. Lo cambié por uno más grande y funciona sin problemas.",
     "category": "electronica", "condition": "bueno", "exchange_type": "vender", "price": 25,
     "campus": "vigo", "faculty": "ingenieria", "handover_point": "conserjeria",
     "image_url": "/static/img/items/electronica.jpg", "days_ago": 9},
    {"owner": 0, "title": "Jersey de lana talla L",
     "description": "Jersey de invierno en muy buen estado, sin bolitas. Lo intercambié por otro de otra talla.",
     "category": "ropa", "condition": "como_nuevo", "exchange_type": "intercambiar", "price": 0,
     "campus": "vigo", "faculty": "artes", "handover_point": "entrada",
     "image_url": "/static/img/items/ropa.jpg", "days_ago": 7},
    {"owner": 0, "title": "Calculadora con funda",
     "description": "Calculadora científica completa, con funda y pilas nuevas.",
     "category": "estudio", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "faculty": "ciencias", "handover_point": "biblioteca",
     "image_url": "/static/img/items/estudio.jpg", "days_ago": 4},
    {"owner": 2, "title": "Microondas pequeño de 700 W",
     "description": "Microondas de sobremesa que funcionaba perfectamente. Se lo quedó otra persona del campus.",
     "category": "electrodomesticos", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "pontevedra", "faculty": "ciencias", "handover_point": "punto",
     "image_url": "/static/img/items/electrodomesticos.jpg", "days_ago": 3},
]

# Intercambios cerrados de la demo: (índice de SEED_HISTORY, solicitante).
# El solicitante 0 es la cuenta del equipo; 1 y 2, las personas de ejemplo.
SEED_DEALS = [(0, 1, 5, "Todo perfecto: la bici estaba como decía y la entrega fue puntual."),
              (1, 2, 4, "Los libros llegaron limpios y bien embalados. Gracias."),
              (3, 0, 5, "Muy amable y flexible con el horario de entrega."),
              (4, 0, 4, "El monitor funciona bien; quedamos en conserjería sin problema.")]


def iso_days_ago(days: int, hours: int = 0) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days, hours=hours)).isoformat()


def _insert_history(db, owner_ids, peer_ids):
    """Inserta el historial de entregas y las valoraciones de la demo."""
    if db.execute("SELECT 1 FROM items WHERE status = 'entregado' LIMIT 1").fetchone():
        return
    item_ids = []
    for entry in SEED_HISTORY:
        created = iso_days_ago(entry["days_ago"], hours=6)
        delivered = iso_days_ago(entry["days_ago"] - 2) if entry["days_ago"] > 2 else created
        cur = db.execute(
            "INSERT INTO items (owner_id, title, description, category, condition, "
            "exchange_type, price, campus, handover_point, faculty, image_url, status, "
            "delivered_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'entregado', ?, ?) "
            "RETURNING id",
            (owner_ids[entry["owner"]], entry["title"], entry["description"], entry["category"],
             entry["condition"], entry["exchange_type"], entry["price"], entry["campus"],
             entry["handover_point"], entry["faculty"], entry["image_url"], delivered, created),
        )
        item_ids.append(inserted_id(cur))

    for item_index, requester, score, comment in (SEED_DEALS if peer_ids else []):
        item_id = item_ids[item_index]
        owner_id = owner_ids[SEED_HISTORY[item_index]["owner"]]
        if requester == 0:
            requester_id = owner_ids[0]
        else:
            requester_id = peer_ids[requester - 1]
        created = iso_days_ago(SEED_HISTORY[item_index]["days_ago"] - 1)
        cur = db.execute(
            "INSERT INTO requests (item_id, requester_id, message, handover_point, status, "
            "created_at) VALUES (?, ?, ?, ?, 'completada', ?) RETURNING id",
            (item_id, requester_id, "", SEED_HISTORY[item_index]["handover_point"], created),
        )
        request_id = inserted_id(cur)
        if requester_id == owner_id:
            continue
        db.execute(
            "INSERT INTO ratings (request_id, rater_id, rated_id, score, comment, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (request_id, requester_id, owner_id, score, comment, iso_days_ago(1)),
        )


def seed_if_empty():
    """Datos de demostración, serializados entre workers.

    Gunicorn arranca varios procesos a la vez: sin este bloqueo, dos workers
    veían la base vacía e insertaban las mismas cuentas, y el segundo tumbaba
    el arranque con una violación de unicidad.
    """
    db = connect_db()
    try:
        if USE_POSTGRES:
            db.execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE")
        else:
            db.execute("BEGIN IMMEDIATE")
        _seed_locked(db)
    except DB_ERRORS:
        db.rollback()
        app.logger.warning("La demo ya estaba sembrada por otro proceso", exc_info=True)
    finally:
        db.close()


def _seed_locked(db):
    if db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"] > 0:
        # Bases ya existentes: solo se completa el historial de la demo cuando
        # la única cuenta es la del equipo y todavía no hay entregas.
        if SEED_DEMO:
            existing = db.execute("SELECT id, email FROM users").fetchall()
            if len(existing) == 1 and existing[0]["email"] == SEED_OWNER["email"]:
                _insert_history(db, [existing[0]["id"], existing[0]["id"], existing[0]["id"]], [])
                db.commit()
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
    peer_ids = []
    for peer in SEED_PEERS:
        cur = db.execute(
            "INSERT INTO users (name, email, password_hash, campus, degree, verified, "
            "consent_at, consent_version, created_at) VALUES (?, ?, ?, ?, '', ?, '', '', ?) "
            "RETURNING id",
            (peer["name"], peer["email"], generate_password_hash(secrets.token_urlsafe(32)),
             peer["campus"], 1 if is_university_email(peer["email"]) else 0, ts),
        )
        peer_ids.append(inserted_id(cur))

    for it in SEED_ITEMS:
        db.execute(
            "INSERT INTO items (owner_id, title, description, category, condition, "
            "exchange_type, price, campus, handover_point, faculty, image_url, status, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?)",
            (owner_id, it["title"], it["description"], it["category"], it["condition"],
             it["exchange_type"], it["price"], it["campus"], it["handover_point"],
             it["faculty"], it["image_url"], ts),
        )

    _insert_history(db, [owner_id] + peer_ids, peer_ids)
    db.commit()


_BOOTSTRAPPED = False
_BOOTSTRAPPED_FOR = None
_BOOTSTRAP_LOCK = threading.Lock()


def _bootstrap_key():
    """Identidad de la configuración que ya se inicializó.

    Incluye los globales que los tests reasignan (``DATABASE``,
    ``SEED_DEMO``, ``UPLOAD_DIR``) para que cambiarlos vuelva a ejecutar
    el arranque sobre la nueva base sin necesidad de reiniciar el proceso.
    """
    return (DATABASE, DATABASE_URL, bool(SEED_DEMO), UPLOAD_DIR)


def bootstrap(force: bool = False):
    """Inicializa esquema, migración, imágenes legacy y demo (idempotente).

    Importar ``app`` ya no ejecuta esta función: se invoca de forma
    perezosa en la primera conexión (``get_db``) y de forma explícita al
    arrancar con ``python3 app.py``. Así, importar el módulo en tests o
    en un worker WSGI no muta la base ni el disco hasta que llega la
    primera petición que necesita datos.
    """
    global _BOOTSTRAPPED, _BOOTSTRAPPED_FOR
    key = _bootstrap_key()
    if not force and _BOOTSTRAPPED_FOR == key:
        return
    with _BOOTSTRAP_LOCK:
        if not force and _BOOTSTRAPPED_FOR == key:
            return
        init_db()
        migrate_db()
        # Las fotos subidas antes de guardarse en base de datos viven solo en el
        # disco efímero: se importan para que sobrevivan al siguiente despliegue.
        try:
            imported = sync_uploads_to_db()
            if imported:
                app.logger.info("Importadas %s imágenes locales a la base de datos", imported)
            cleanup_orphan_media()
        except Exception:  # noqa: BLE001 - el arranque no debe romperse por esto
            app.logger.exception("No se pudo sincronizar el almacenamiento de imágenes")
        if SEED_DEMO:
            try:
                seed_if_empty()
            except DB_ERRORS:
                # Los objetos de ejemplo nunca deben impedir que la web arranque.
                app.logger.exception("No se pudo sembrar la demo")
        _BOOTSTRAPPED_FOR = key
        _BOOTSTRAPPED = True


def ensure_bootstrapped():
    """Punto de entrada perezoso usado por ``get_db``."""
    bootstrap()


# ---------------------------------------------------------------------------
# Seguridad: límites de uso y saneado de texto
# ---------------------------------------------------------------------------
_RATE_LOCK = threading.Lock()
_RATE_HITS = {}


def rate_limits_enabled() -> bool:
    """Activo por defecto; las pruebas lo desactivan con TESTING.

    Se puede forzar con `RATE_LIMIT_ENABLED=1|0` o con
    `app.config["RATE_LIMIT_ENABLED"]`.
    """
    override = app.config.get("RATE_LIMIT_ENABLED")
    if override is not None:
        return bool(override)
    env = os.environ.get("RATE_LIMIT_ENABLED")
    if env is not None and env != "":
        return env not in ("0", "false", "False")
    return not app.config.get("TESTING", False)


def client_ip() -> str:
    """IP real del cliente (ProxyFix resuelve X-Forwarded-For)."""
    return (request.remote_addr or "desconocida").strip()


def rate_limit_retry(bucket: str, identity: str = "") -> int:
    """Devuelve segundos de espera si se superó el límite, o 0 si hay hueco."""
    limit, window = RATE_LIMITS[bucket]
    key = (bucket, f"{client_ip()}|{identity}" if identity else client_ip())
    now = time.monotonic()
    with _RATE_LOCK:
        hits = _RATE_HITS.setdefault(key, deque())
        while hits and now - hits[0] >= window:
            hits.popleft()
        if len(hits) >= limit:
            return max(1, int(window - (now - hits[0])) + 1)
        hits.append(now)
        if len(_RATE_HITS) > 20000:  # poda defensiva de memoria
            for stale in [k for k, v in _RATE_HITS.items() if not v][:5000]:
                _RATE_HITS.pop(stale, None)
        return 0


def rate_limited(bucket: str, identity: str = ""):
    """Respuesta 429 lista para devolver, o None si la petición puede seguir."""
    if not rate_limits_enabled():
        return None
    retry = rate_limit_retry(bucket, identity)
    if not retry:
        return None
    resp = jsonify({
        "error": "rate_limited",
        "message": "Demasiados intentos seguidos. Espera un momento y vuelve a probar.",
        "retry_after": retry,
    })
    resp.status_code = 429
    resp.headers["Retry-After"] = str(retry)
    resp.headers["Cache-Control"] = "no-store"
    return resp


def reset_rate_limits():
    """Las pruebas y los reinicios limpian la ventana en memoria."""
    with _RATE_LOCK:
        _RATE_HITS.clear()


# Caracteres invisibles (zero-width y de control bidireccional) que se usan
# para camuflar texto: se eliminan siempre.
_INVISIBLE = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u200e\u200f"
                                    "\u202a\u202b\u202c\u202d\u202e"
                                    "\u2060\u2066\u2067\u2068\u2069\ufeff"), None)


def clean_text(value, *, multiline: bool = False, max_len: int = 2000) -> str:
    """Normaliza texto de usuario en servidor.

    - NFKC: evita homoglifos y caracteres de compatibilidad.
    - Fuera caracteres invisibles y de control (los que rompen listados o
      intentan inyectar saltos en cabeceras).
    - Colapsa espacios y saltos de línea repetidos.
    Nunca confía en lo que ya validó el navegador.
    """
    if not isinstance(value, str):
        return ""
    text = unicodedata.normalize("NFKC", value).translate(_INVISIBLE)
    if multiline:
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = "".join(ch for ch in text if ch in "\n\t" or ord(ch) >= 32)
        text = re.sub(r"[^\S\n]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
    else:
        text = "".join(" " if ord(ch) < 32 else ch for ch in text)
        text = re.sub(r"\s+", " ", text)
    return text.strip()[:max_len]


def has_forbidden_text(value: str) -> bool:
    """Texto que no debería llegar a la base ni a una cabecera."""
    return any(ord(ch) < 32 and ch not in "\n\t" for ch in value or "")


def cors_origin_allowed(origin: str) -> bool:
    return bool(origin) and origin.rstrip("/") in CORS_ORIGINS


@app.before_request
def guard_requests():
    """Techo de peticiones por IP y tope de cuerpo JSON."""
    if request.method == "OPTIONS":
        return None
    if not request.path.startswith("/api/"):
        return None
    limited = rate_limited("api")
    if limited:
        return limited
    if (request.mimetype or "").startswith("application/json"):
        length = request.content_length or 0
        if length > MAX_JSON_BYTES:
            return jsonify({
                "error": "payload_too_large",
                "message": "El contenido enviado es demasiado grande.",
            }), 413
    return None


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
        "frame-ancestors " + ("*" if ALLOW_EMBED else "'self'"),
    ])
    resp.headers["Content-Security-Policy"] = csp
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    resp.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    if not ALLOW_EMBED:
        # Respaldo para navegadores sin soporte de frame-ancestors.
        resp.headers["X-Frame-Options"] = "SAMEORIGIN"
    resp.headers["X-Permitted-Cross-Domain-Policies"] = "none"
    if request.is_secure:
        # Render sirve por HTTPS; esto evita la primera petición en claro.
        resp.headers.setdefault(
            "Strict-Transport-Security", "max-age=15552000; includeSubDomains"
        )

    # CORS explícito: solo los orígenes de la lista reciben permiso. La API usa
    # tokens en cabecera (no cookies), así que no se habilitan credenciales.
    origin = (request.headers.get("Origin") or "").strip()
    if request.path.startswith("/api/") and origin:
        resp.headers.add("Vary", "Origin")
        if cors_origin_allowed(origin):
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
            resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            resp.headers["Access-Control-Max-Age"] = "600"
            resp.headers["Access-Control-Expose-Headers"] = "Retry-After"

    if request.path.startswith("/api/") and (
        "/auth/" in request.path or "/account/" in request.path
    ):
        resp.headers["Cache-Control"] = "no-store"
    elif request.path.startswith("/static/img/") and resp.status_code == 200:
        # Fotos con nombre estable: una semana de caché evita volver a bajarlas
        # en cada visita sin complicar la invalidación.
        resp.headers.setdefault("Cache-Control", "public, max-age=604800")
    return resp


@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "file_too_large", "message": "La imagen supera 5 MB."}), 413


@app.after_request
def compress_response(resp):
    """Gzip para HTML, JSON, CSS y JS; nunca para imágenes ni respuestas 304."""
    if request.method == "HEAD" or resp.direct_passthrough or resp.is_streamed:
        return resp
    if resp.status_code < 200 or resp.status_code >= 300:
        return resp
    if resp.headers.get("Content-Encoding") or request.headers.get("Range"):
        return resp
    if "gzip" not in request.accept_encodings:
        return resp
    ctype = (resp.content_type or "").lower()
    if not any(ctype.startswith(prefix) for prefix in COMPRESSIBLE_TYPES):
        return resp
    data = resp.get_data()
    if len(data) < COMPRESS_MIN_BYTES:
        return resp
    packed = gzip.compress(data, compresslevel=6)
    if len(packed) >= len(data) * 0.95:
        return resp
    resp.set_data(packed)
    resp.headers["Content-Encoding"] = "gzip"
    resp.headers["Vary"] = "Accept-Encoding"
    # El ETag anterior describía la representación sin comprimir.
    resp.headers.pop("ETag", None)
    return resp


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
    resp = make_response(
        render_template("index.html", boot=boot_config(SPA_VIEWS.get(request.path, "home")))
    )
    # La portada no contiene datos personales: una caché muy corta permite
    # pintar el esqueleto mientras el servicio gratuito vuelve a arrancar.
    resp.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=300"
    return resp


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(BASE_DIR, "static", "img"), "favicon.ico")


@app.route("/static/uploads/<path:filename>")
def uploads(filename):
    """Sirve la imagen desde disco o, si el contenedor se recicló, desde la BD."""
    name = safe_upload_name(filename)
    if not name:
        return jsonify({"error": "not_found"}), 404
    path = os.path.join(UPLOAD_DIR, name)
    if os.path.isfile(path):
        resp = send_from_directory(UPLOAD_DIR, name)
    else:
        row = read_media(get_db(), name)
        if not row:
            return jsonify({"error": "not_found"}), 404
        resp = Response(row["bytes"], mimetype=row["content_type"])
        resp.set_etag(hashlib.sha256(row["bytes"]).hexdigest()[:24])
        resp = resp.make_conditional(request)
    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return resp


ASSET_TYPES = {
    "css/style.css": "text/css; charset=utf-8",
    "js/app.js": "application/javascript; charset=utf-8",
}
_ASSET_CACHE = {}


def _load_asset(rel: str):
    """Lee el activo una vez y lo reutiliza hasta que cambie en disco."""
    path = os.path.join(BASE_DIR, "static", rel)
    stat = os.stat(path)
    key = (stat.st_mtime_ns, stat.st_size)
    cached = _ASSET_CACHE.get(rel)
    if cached and cached["key"] == key:
        return cached
    with open(path, "rb") as fh:
        raw = fh.read()
    packed = gzip.compress(raw, compresslevel=9)
    entry = {
        "key": key,
        "raw": raw,
        "gzip": packed,
        "etag": hashlib.sha256(raw).hexdigest()[:24],
        "gzip_etag": hashlib.sha256(packed).hexdigest()[:24],
        "mimetype": ASSET_TYPES[rel],
    }
    _ASSET_CACHE[rel] = entry
    return entry


@app.get("/static/css/style.css")
@app.get("/static/js/app.js")
def static_asset():
    """Sirve CSS/JS con ETag, caché inmutable y compresión gzip.

    La plantilla añade `?v=<huella>` para que un despliegue estrene URL y la
    caché inmutable sea segura.
    """
    rel = request.path[len("/static/"):]
    entry = ASSET_TYPES.get(rel)
    if not entry:
        return jsonify({"error": "not_found"}), 404
    try:
        asset = _load_asset(rel)
    except OSError:
        return jsonify({"error": "not_found"}), 404
    # Se negocia la codificación en el propio activo para que cada
    # representación (gzip o identidad) tenga un ETag válido y responda 304.
    if "gzip" in request.accept_encodings:
        resp = Response(asset["gzip"], mimetype=entry)
        resp.set_etag(asset["gzip_etag"])
        resp.headers["Content-Encoding"] = "gzip"
        resp.headers["Vary"] = "Accept-Encoding"
    else:
        resp = Response(asset["raw"], mimetype=entry)
        resp.set_etag(asset["etag"])
    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return resp.make_conditional(request)


# ---------------------------------------------------------------------------
# Routes — API
# ---------------------------------------------------------------------------
@app.get("/healthz")
def healthz():
    """Sonda barata para Render y monitores: no toca la base de datos."""
    resp = jsonify({"ok": True, "service": "campus-circular"})
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.get("/api/health")
def health():
    resp = jsonify({
        "ok": True,
        "service": "campus-circular",
        "product": SERVICE_NAME,
        "legal_version": LEGAL_VERSION,
        "time": now_iso(),
    })
    resp.headers["Cache-Control"] = "no-store"
    return resp


_STATS_CACHE = {}


def invalidate_stats():
    """Los contadores públicos se recalculan tras cualquier cambio de objeto."""
    _STATS_CACHE.clear()


@app.get("/api/stats")
def stats():
    key = DATABASE_URL or DATABASE
    now = time.monotonic()
    cached = _STATS_CACHE.get(key)
    if (
        cached
        and not app.config.get("TESTING")
        and now - cached[0] < STATS_CACHE_SECONDS
    ):
        payload = cached[1]
    else:
        db = get_db()
        # Una sola consulta en lugar de tres: menos viajes a la base.
        row = db.execute(
            "SELECT COUNT(*) total, "
            "SUM(CASE WHEN status = 'disponible' THEN 1 ELSE 0 END) available, "
            "SUM(CASE WHEN status = 'entregado' THEN 1 ELSE 0 END) delivered "
            "FROM items WHERE hidden_at = ''"
        ).fetchone()
        users = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
        by_category = db.execute(
            "SELECT category, COUNT(*) c FROM items WHERE hidden_at = '' "
            "GROUP BY category ORDER BY c DESC"
        ).fetchall()
        payload = {
            "total_items": row["total"] or 0,
            "available": row["available"] or 0,
            "delivered": row["delivered"] or 0,
            "users": users,
            "by_category": [{"category": r["category"], "count": r["c"]} for r in by_category],
            "impact": impact_summary(db),
        }
        _STATS_CACHE[key] = (now, payload)
    resp = jsonify(payload)
    resp.headers["Cache-Control"] = f"public, max-age={STATS_CACHE_SECONDS}"
    return resp


@app.get("/api/impact/me")
@require_auth
def my_impact(user):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    trust = user_trust(db, row)
    return jsonify({
        "impact": trust["impact"],
        "rating": trust["rating"],
        "exchanges": trust["exchanges"],
        "level": trust["level"],
        "verified": trust["verified"],
        "badges": badges_for(trust),
    })


@app.get("/api/items")
def list_items():
    db = get_db()
    # Acotado: una búsqueda no necesita más de 100 caracteres y así el LIKE
    # mantiene un coste predecible.
    q = (request.args.get("q") or "").strip().lower()[:100]
    category = request.args.get("category")
    campus = request.args.get("campus")
    condition = request.args.get("condition")
    exchange_type = request.args.get("type")
    faculty = request.args.get("faculty")
    status = request.args.get("status", "disponible")
    sort = request.args.get("sort", "recent")
    limit, offset = pagination_args()

    where = ["hidden_at = ''"]
    params = []
    if status:
        where.append("status = ?")
        params.append(status)
    if category and category in CATEGORIES:
        where.append("category = ?")
        params.append(category)
    if campus and campus in CAMPUSES:
        where.append("campus = ?")
        params.append(campus)
    if condition and condition in CONDITIONS:
        where.append("condition = ?")
        params.append(condition)
    if exchange_type and exchange_type in EXCHANGE_TYPES:
        where.append("exchange_type = ?")
        params.append(exchange_type)
    if faculty and faculty in FACULTIES:
        where.append("faculty = ?")
        params.append(faculty)
    # Búsqueda por palabras: todas deben aparecer en el título o la descripción,
    # así «libro derecho» no devuelve cualquier libro ni cualquier derecho.
    terms = [term for term in fold_text(q).split() if term][:4]
    if terms:
        title_folded = folded_column("title")
        desc_folded = folded_column("description")
        for term in terms:
            # `escape_like` + `ESCAPE '\'`: un `%` o `_` del usuario es
            # texto literal, no un comodín que devuelva todo el catálogo.
            where.append(
                f"({title_folded} LIKE ? ESCAPE '\\' OR {desc_folded} LIKE ? ESCAPE '\\')"
            )
            params.extend([f"%{escape_like(term)}%", f"%{escape_like(term)}%"])

    clause = " FROM items WHERE " + " AND ".join(where)
    total = db.execute("SELECT COUNT(*) c" + clause, params).fetchone()["c"]

    if sort == "price_asc":
        order = " ORDER BY price ASC, created_at DESC"
    elif sort == "price_desc":
        order = " ORDER BY price DESC, created_at DESC"
    else:
        order = " ORDER BY created_at DESC"

    rows = db.execute(
        "SELECT *" + clause + order + " LIMIT ? OFFSET ?",
        [*params, limit, offset],
    ).fetchall()
    user = current_user()
    fav_ids = set()
    if user:
        fav_ids = {r["item_id"] for r in db.execute(
            "SELECT item_id FROM favorites WHERE user_id = ?", (user["id"],)).fetchall()}

    payload = page_payload(rows, total, limit, offset,
                           lambda r: row_to_item(r, r["id"] in fav_ids))
    return jsonify(payload)


@app.get("/api/items/mine")
@require_auth
def my_items(user):
    """Objetos propios, sin filtrar en cliente todo el catálogo."""
    db = get_db()
    limit, offset = pagination_args(default=MAX_PAGE_SIZE)
    total = db.execute(
        "SELECT COUNT(*) c FROM items WHERE owner_id = ?", (user["id"],)
    ).fetchone()["c"]
    rows = db.execute(
        "SELECT *, (SELECT COUNT(*) FROM reports WHERE reports.item_id = items.id) "
        "AS reports_count FROM items WHERE owner_id = ? "
        "ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (user["id"], limit, offset),
    ).fetchall()

    def serialize(row):
        payload = row_to_item(row)
        payload["reports"] = row["reports_count"] or 0
        return payload

    return jsonify(page_payload(rows, total, limit, offset, serialize))


@app.get("/api/items/<int:item_id>")
def get_item(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    user = current_user()
    is_owner = bool(user and user["id"] == row["owner_id"])
    if row["hidden_at"] and not is_owner:
        # Un objeto retirado por moderación deja de existir para el resto.
        return jsonify({"error": "not_found"}), 404
    owner = db.execute("SELECT * FROM users WHERE id = ?", (row["owner_id"],)).fetchone()
    fav = False
    if user:
        fav = db.execute("SELECT 1 FROM favorites WHERE user_id=? AND item_id=?",
                         (user["id"], item_id)).fetchone() is not None
    item = row_to_item(row, fav)
    public_owner = row_to_public_user(owner)
    if public_owner:
        trust = user_trust(db, owner)
        public_owner["rating"] = trust["rating"]
        public_owner["exchanges"] = trust["exchanges"]
        public_owner["level"] = trust["level"]
        public_owner["impact"] = trust["impact"]
    item["owner"] = public_owner
    if is_owner:
        item["reports"] = db.execute(
            "SELECT COUNT(*) c FROM reports WHERE item_id = ?", (item_id,)
        ).fetchone()["c"]
    return jsonify({"item": item})


@app.post("/api/items")
@require_auth
def create_item(user):
    limited = rate_limited("item", str(user["id"]))
    if limited:
        return limited
    data = request.get_json(silent=True) or {}
    title = clean_text(data.get("title"), max_len=80)
    description = clean_text(data.get("description"), multiline=True, max_len=2000)
    category = data.get("category")
    # El formulario rápido solo exige foto, título, categoría y tipo. El resto
    # de campos toma un valor razonable para publicar en menos de un minuto.
    condition = data.get("condition") or "bueno"
    exchange_type = data.get("exchange_type")
    campus = data.get("campus") or user["campus"]
    handover_point = data.get("handover_point") or "acordado"
    faculty = clean_text(data.get("faculty"), max_len=40)
    image_url = clean_text(data.get("image_url"), max_len=MAX_IMAGE_URL_LEN)
    private_seller = data.get("private_seller") is True
    try:
        price = float(data.get("price") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_price"}), 400
    if not math.isfinite(price):
        return jsonify({"error": "invalid_price"}), 400

    if not private_seller:
        return jsonify({
            "error": "private_seller_required",
            "message": "Confirma que publicas como particular; no se admiten vendedores profesionales.",
        }), 400
    if len(title) < 3 or len(title) > 80:
        return jsonify({"error": "invalid_title", "message": "El título debe tener entre 3 y 80 caracteres."}), 400
    if description and (len(description) < 10 or len(description) > 2000):
        return jsonify({"error": "invalid_description", "message": "La descripción, si la escribes, debe tener entre 10 y 2000 caracteres."}), 400
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
    if faculty and faculty not in FACULTIES:
        return jsonify({"error": "invalid_faculty"}), 400
    if exchange_type != "vender":
        price = 0
    if price < 0 or price > 10000:
        return jsonify({"error": "invalid_price"}), 400
    if not image_url:
        return jsonify({
            "error": "image_required",
            "message": "Añade una foto del objeto: es obligatoria para publicar.",
        }), 400
    if not valid_local_image_url(image_url):
        return jsonify({
            "error": "invalid_image_url",
            "message": "Usa una imagen subida a Campus Circular; no se permiten URL externas.",
        }), 400

    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO items (owner_id, title, description, category, condition, exchange_type, "
            "price, campus, handover_point, faculty, image_url, status, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?) RETURNING id",
            (user["id"], title, description, category, condition, exchange_type,
             price, campus, handover_point, faculty, image_url, now_iso()),
        )
        item_id = inserted_id(cur)
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo crear la publicación")
        return _storage_unavailable()
    invalidate_stats()
    try:
        row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo releer la publicación creada")
        return _storage_unavailable()
    return jsonify({"item": row_to_item(row)}), 201


EDITABLE_ITEM_FIELDS = {
    "title", "description", "category", "condition", "exchange_type",
    "price", "campus", "faculty", "handover_point",
}


@app.patch("/api/items/<int:item_id>")
@require_auth
def update_item(user, item_id):
    """Edita una publicación propia y/o cambia su estado.

    Los campos de contenido se validan con las mismas reglas que al publicar:
    el editor de la interfaz no puede saltarse ninguna comprobación del servidor.
    """
    limited = rate_limited("item_edit", str(user["id"]))
    if limited:
        return limited
    db = get_db()
    try:
        _acquire_write_lock(db)
        _lock_item_row(db, item_id)
        row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo leer la publicación para editarla")
        return _storage_unavailable()
    if not row:
        _rollback_quietly()
        return jsonify({"error": "not_found"}), 404
    if row["owner_id"] != user["id"]:
        _rollback_quietly()
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "invalid_request"}), 400
    if not data:
        return jsonify({"error": "nothing_to_update"}), 400

    # --- estado ---------------------------------------------------------
    new_status = data.get("status", row["status"])
    if new_status not in ITEM_STATUSES:
        return jsonify({"error": "invalid_status"}), 400

    # --- contenido ------------------------------------------------------
    title = clean_text(data["title"], max_len=80) if "title" in data else row["title"]
    if len(title) < 3 or len(title) > 80:
        return jsonify({
            "error": "invalid_title",
            "message": "El título debe tener entre 3 y 80 caracteres.",
        }), 400
    description = (
        clean_text(data["description"], multiline=True, max_len=2000)
        if "description" in data else row["description"]
    )
    if description and (len(description) < 10 or len(description) > 2000):
        return jsonify({
            "error": "invalid_description",
            "message": "La descripción, si la escribes, debe tener entre 10 y 2000 caracteres.",
        }), 400
    category = data.get("category", row["category"])
    if category not in CATEGORIES:
        return jsonify({"error": "invalid_category"}), 400
    condition = data.get("condition", row["condition"])
    if condition not in CONDITIONS:
        return jsonify({"error": "invalid_condition"}), 400
    exchange_type = data.get("exchange_type", row["exchange_type"])
    if exchange_type not in EXCHANGE_TYPES:
        return jsonify({"error": "invalid_exchange_type"}), 400
    campus = data.get("campus", row["campus"])
    if campus not in CAMPUSES:
        return jsonify({"error": "invalid_campus"}), 400
    faculty = (
        clean_text(data["faculty"], max_len=40) if "faculty" in data
        else (row["faculty"] or "")
    )
    if faculty and faculty not in FACULTIES:
        return jsonify({"error": "invalid_faculty"}), 400
    handover_point = data.get("handover_point", row["handover_point"])
    if handover_point not in HANDOVER_POINTS:
        return jsonify({"error": "invalid_handover_point"}), 400
    try:
        price = float(data.get("price", row["price"]))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_price"}), 400
    if not math.isfinite(price) or price < 0 or price > 10000:
        return jsonify({"error": "invalid_price"}), 400
    if exchange_type != "vender":
        price = 0

    delivered_at = row["delivered_at"] or ""
    if new_status == "entregado":
        delivered_at = delivered_at or now_iso()
    elif new_status != row["status"]:
        delivered_at = ""

    try:
        cur = db.execute(
            "UPDATE items SET title = ?, description = ?, category = ?, condition = ?, "
            "exchange_type = ?, price = ?, campus = ?, faculty = ?, handover_point = ?, "
            "status = ?, delivered_at = ? WHERE id = ?",
            (title, description, category, condition, exchange_type, price, campus,
             faculty, handover_point, new_status, delivered_at, item_id),
        )
        if cur.rowcount == 0:
            db.rollback()
            return jsonify({"error": "not_found"}), 404
        if new_status == "entregado" and row["status"] != "entregado":
            # Cerrar también la solicitud aceptada evita intercambios a medias.
            db.execute(
                "UPDATE requests SET status = 'completada' "
                "WHERE item_id = ? AND status = 'aceptada'", (item_id,))
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo guardar la edición de la publicación")
        return _storage_unavailable()
    invalidate_stats()
    try:
        row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo releer la publicación editada")
        return _storage_unavailable()
    return jsonify({"item": row_to_item(row)})


@app.delete("/api/items/<int:item_id>")
@require_auth
def delete_item(user, item_id):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo leer la publicación para eliminarla")
        return _storage_unavailable()
    if not row:
        return jsonify({"error": "not_found"}), 404
    if row["owner_id"] != user["id"]:
        return jsonify({"error": "forbidden"}), 403
    image_url = row["image_url"]
    try:
        cur = db.execute("DELETE FROM items WHERE id = ?", (item_id,))
        if cur.rowcount == 0:
            db.rollback()
            return jsonify({"error": "not_found"}), 404
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo eliminar la publicación")
        return _storage_unavailable()
    invalidate_stats()
    # La foto solo se borra si ninguna otra publicación la referencia todavía
    # (puede compartirse al editar o reutilizar una subida).
    try:
        in_use = image_url and db.execute(
            "SELECT 1 FROM items WHERE image_url = ?", (image_url,)).fetchone()
    except DB_ERRORS:
        in_use = None
    if not in_use:
        remove_uploaded_file(image_url)
    return jsonify({"ok": True})


@app.post("/api/items/<int:item_id>/report")
@require_auth
def report_item(user, item_id):
    """Moderación mínima: una persona, un reporte por objeto.

    Al alcanzar `REPORT_HIDE_THRESHOLD` denuncias de cuentas distintas, el
    objeto se retira del catálogo (`hidden_at`). Inserción, recuento y ocultación
    ocurren en la misma transacción para que dos reportes concurrentes no
    dejen el recuento a medias. La restauración es posible desde
    `POST /api/items/<id>/restore` (cuentas de `ADMIN_EMAILS`), que registra
    el resultado de la revisión marcando los reportes como `resuelto`.
    """
    limited = rate_limited("report", str(user["id"]))
    if limited:
        return limited
    db = get_db()
    try:
        _acquire_write_lock(db)
        _lock_item_row(db, item_id)
        item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo leer el objeto para reportarlo")
        return _storage_unavailable()
    if not item or item["hidden_at"]:
        _rollback_quietly()
        return jsonify({"error": "not_found"}), 404
    if item["owner_id"] == user["id"]:
        _rollback_quietly()
        return jsonify({
            "error": "own_item",
            "message": "No puedes reportar tu propia publicación.",
        }), 400
    data = request.get_json(silent=True) or {}
    reason = data.get("reason")
    if reason not in REPORT_REASONS:
        _rollback_quietly()
        return jsonify({"error": "invalid_reason"}), 400
    comment = clean_text(data.get("comment"), multiline=True, max_len=REPORT_COMMENT_MAX)
    try:
        db.execute(
            "INSERT INTO reports (item_id, reporter_id, reason, comment, status, created_at) "
            "VALUES (?, ?, ?, ?, 'abierto', ?)",
            (item_id, user["id"], reason, comment, now_iso()),
        )
        reports = db.execute(
            "SELECT COUNT(DISTINCT reporter_id) c FROM reports WHERE item_id = ?", (item_id,)
        ).fetchone()["c"]
        hidden = False
        if reports >= REPORT_HIDE_THRESHOLD:
            cur = db.execute(
                "UPDATE items SET hidden_at = ? WHERE id = ? AND hidden_at = ''",
                (now_iso(), item_id),
            )
            hidden = cur.rowcount == 1
        db.commit()
    except DB_INTEGRITY_ERRORS:
        db.rollback()
        return jsonify({
            "error": "already_reported",
            "message": "Ya has reportado esta publicación.",
        }), 409
    except DB_ERRORS:
        app.logger.exception("No se pudo guardar un reporte")
        return _storage_unavailable()
    if hidden:
        invalidate_stats()
    return jsonify({"reported": True, "reports": reports, "hidden": hidden}), 201


@app.post("/api/items/<int:item_id>/restore")
@require_auth
def restore_item(user, item_id):
    """Revisión y restauración de una publicación oculta por reportes.

    Solo las cuentas incluidas en la variable de entorno `ADMIN_EMAILS`
    (lista de correos separados por comas) pueden restaurar. La restauración
    deja constancia del estado de moderación: los reportes abiertos del
    objeto pasan a `resuelto` y el objeto vuelve al catálogo. Si llegan
    nuevos reportes hasta el umbral, se oculta de nuevo.
    """
    if not is_admin_user(user):
        return jsonify({
            "error": "forbidden",
            "message": "Solo las cuentas de moderación pueden restaurar publicaciones.",
        }), 403
    limited = rate_limited("restore", str(user["id"]))
    if limited:
        return limited
    db = get_db()
    try:
        _acquire_write_lock(db)
        _lock_item_row(db, item_id)
        item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        if not item:
            _rollback_quietly()
            return jsonify({"error": "not_found"}), 404
        if not item["hidden_at"]:
            _rollback_quietly()
            return jsonify({
                "error": "not_hidden",
                "message": "Esta publicación no está oculta.",
            }), 400
        # Estado de moderación registrado: la revisión cierra los reportes.
        db.execute(
            "UPDATE reports SET status = 'resuelto' WHERE item_id = ? AND status = 'abierto'",
            (item_id,),
        )
        db.execute("UPDATE items SET hidden_at = '' WHERE id = ?", (item_id,))
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo restaurar la publicación")
        return _storage_unavailable()
    invalidate_stats()
    try:
        item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo releer la publicación restaurada")
        return _storage_unavailable()
    app.logger.info("Publicación %s restaurada tras revisión", item_id)
    return jsonify({"item": row_to_item(item), "restored": True})


@app.post("/api/upload")
@require_auth
def upload(user):
    limited = rate_limited("upload", str(user["id"]))
    if limited:
        return limited
    if "file" not in request.files:
        return jsonify({"error": "no_file"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "no_file"}), 400
    ext = os.path.splitext(f.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "invalid_type",
            "message": "Solo se aceptan imágenes JPG, PNG o WebP.",
        }), 400
    raw = f.stream.read(MAX_UPLOAD_BYTES + 1)
    if not raw:
        return jsonify({"error": "no_file"}), 400
    if len(raw) > MAX_UPLOAD_BYTES:
        return jsonify({"error": "file_too_large", "message": "La imagen supera 5 MB."}), 413
    if not valid_image_bytes(raw[:12]):
        return jsonify({
            "error": "invalid_type",
            "message": "El archivo no parece una imagen válida.",
        }), 400
    try:
        optimized = optimize_image(raw)
    except ValueError as exc:
        if str(exc) == "image_too_large":
            return jsonify({
                "error": "image_too_large",
                "message": "La imagen tiene demasiados píxeles; usa una foto más pequeña.",
            }), 413
        return jsonify({
            "error": "invalid_type",
            "message": "No se pudo leer la imagen; prueba con otro archivo.",
        }), 400

    filename = image_filename()
    db = get_db()
    try:
        store_media(db, filename, optimized, "image/webp")
        db.commit()
    except DB_ERRORS:
        db.rollback()
        app.logger.exception("No se pudo guardar la imagen")
        return jsonify({
            "error": "storage_unavailable",
            "message": "No se pudo guardar la imagen. Inténtalo de nuevo.",
        }), 503
    return jsonify({
        "url": f"{UPLOAD_URL_PREFIX}{filename}",
        "bytes": len(optimized),
        "content_type": "image/webp",
    }), 201


# --- Auth -------------------------------------------------------------------
@app.post("/api/auth/register")
def register():
    limited = rate_limited("register")
    if limited:
        return limited
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "invalid_request"}), 400

    raw_name = data.get("name", "")
    raw_email = data.get("email", "")
    password = data.get("password", "")
    campus = data.get("campus", "vigo")
    if not isinstance(raw_name, str) or not isinstance(raw_email, str) or not isinstance(password, str):
        return jsonify({"error": "invalid_request"}), 400
    name = clean_text(raw_name, max_len=60)
    email = clean_text(raw_email, max_len=254).lower()
    consent = data.get("consent") is True

    if len(name) < 2 or len(name) > 60 or any(ord(ch) < 32 for ch in name):
        return jsonify({"error": "invalid_name"}), 400
    if len(email) > 254 or not valid_email(email):
        return jsonify({"error": "invalid_email"}), 400
    problem = password_problem(password, email)
    if problem == "invalid_password":
        return jsonify({"error": "invalid_password", "message": "La contraseña debe tener entre 8 y 1024 bytes."}), 400
    if problem:
        return jsonify({"error": "weak_password", "message": WEAK_PASSWORD_MESSAGE}), 400
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
        trim_sessions(db, user_id)
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


def recycle_expired_demo_accounts(db) -> int:
    """Caduca cuentas demo conservando sus publicaciones.

    Los objetos se reasignan a la cuenta de muestra (`SEED_OWNER`): el catálogo
    del congreso sigue mostrando lo que subió cada visitante aunque su sesión
    temporal ya no exista.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=DEMO_TTL_HOURS)).isoformat()
    expired = [r["id"] for r in db.execute(
        "SELECT id FROM users WHERE email LIKE ? AND created_at < ?",
        (f"%@{DEMO_EMAIL_DOMAIN}", cutoff)).fetchall()]
    if not expired:
        return 0
    keeper_id = showcase_owner_id(db)
    for user_id in expired:
        if keeper_id and keeper_id != user_id:
            db.execute("UPDATE items SET owner_id = ? WHERE owner_id = ?",
                       (keeper_id, user_id))
        db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    return len(expired)


def showcase_owner_id(db):
    """Cuenta que conserva lo publicado por los visitantes.

    Es la cuenta de muestra del catálogo (`SEED_OWNER`). Si la base no la tiene
    todavía se crea aquí, con una contraseña aleatoria que nadie usa, para que
    ninguna publicación se quede sin dueño.
    """
    row = db.execute("SELECT id FROM users WHERE email = ?",
                     (SEED_OWNER["email"],)).fetchone()
    if row:
        return row["id"]
    ts = now_iso()
    try:
        cur = db.execute(
            "INSERT INTO users (name, email, password_hash, campus, degree, verified, "
            "consent_at, consent_version, created_at) VALUES (?, ?, ?, ?, '', 0, ?, ?, ?) RETURNING id",
            (SEED_OWNER["name"], SEED_OWNER["email"],
             generate_password_hash(secrets.token_urlsafe(32)),
             SEED_OWNER["campus"], ts, LEGAL_VERSION, ts),
        )
        return inserted_id(cur)
    except DB_ERRORS:
        db.rollback()
        return None


DELETED_USER_EMAIL = "cuenta-eliminada@campus-circular.invalid"
DELETED_USER_NAME = "Cuenta eliminada"


def deleted_user_id(db):
    """Cuenta fantasma que conserva el historial escrito por otras personas.

    Al eliminar una cuenta, lo que otras personas escribieron (solicitudes
    recibidas, valoraciones y reportes) no se destruye: se reasigna a esta
    cuenta irrepetible para que su historial siga siendo suyo. Se crea con
    una contraseña aleatoria que nadie usa, igual que la cuenta de muestra.
    """
    row = db.execute("SELECT id FROM users WHERE email = ?",
                     (DELETED_USER_EMAIL,)).fetchone()
    if row:
        return row["id"]
    ts = now_iso()
    try:
        cur = db.execute(
            "INSERT INTO users (name, email, password_hash, campus, degree, verified, "
            "consent_at, consent_version, created_at) VALUES (?, ?, ?, ?, '', 0, ?, ?, ?) RETURNING id",
            (DELETED_USER_NAME, DELETED_USER_EMAIL,
             generate_password_hash(secrets.token_urlsafe(32)),
             "vigo", ts, LEGAL_VERSION, ts),
        )
        return inserted_id(cur)
    except DB_INTEGRITY_ERRORS:
        # Otra eliminación concurrente la creó antes: reutilizar la existente.
        row = db.execute("SELECT id FROM users WHERE email = ?",
                         (DELETED_USER_EMAIL,)).fetchone()
        return row["id"] if row else None
    except DB_ERRORS:
        db.rollback()
        return None


@app.post("/api/auth/demo")
def demo_login():
    """Cuenta temporal para probar la app en la exposición (CTC).

    Solo existe cuando la app corre con datos de demostración (SEED_DEMO=1).
    Cada visitante recibe su propia cuenta efímera, así nadie puede tocar el
    trabajo de otra persona, y se borran solas pasadas `DEMO_TTL_HOURS` horas
    (24 por defecto): sin cron ni servicios externos.
    """
    if not SEED_DEMO:
        return jsonify({"error": "demo_disabled"}), 404
    limited = rate_limited("demo")
    if limited:
        return limited

    db = get_db()
    try:
        # Limpieza perezosa: barata, sin tareas programadas y sin perder nada de
        # lo que la gente publicó.
        recycle_expired_demo_accounts(db)
    except DB_ERRORS:
        db.rollback()

    stamp = int(time.time())
    token = secrets.token_urlsafe(32)
    ts = now_iso()
    email = f"demo-{stamp}-{secrets.token_hex(3)}@{DEMO_EMAIL_DOMAIN}"
    try:
        cur = db.execute(
            "INSERT INTO users (name, email, password_hash, campus, degree, verified, "
            "consent_at, consent_version, created_at) VALUES (?, ?, ?, ?, '', 0, ?, ?, ?) RETURNING id",
            (DEMO_NAME, email, generate_password_hash(secrets.token_urlsafe(24)),
             "vigo", ts, LEGAL_VERSION, ts),
        )
        user_id = inserted_id(cur)
        cleanup_expired_sessions(db)
        db.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (session_token_digest(token), user_id,
             (datetime.now(timezone.utc) + timedelta(hours=DEMO_TTL_HOURS)).isoformat()),
        )
        db.commit()
    except DB_ERRORS:
        db.rollback()
        app.logger.exception("No se pudo crear la cuenta de demostración")
        return jsonify({
            "error": "storage_unavailable",
            "message": "No se pudo abrir la demo ahora mismo. Inténtalo de nuevo.",
        }), 503

    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return jsonify({
        "token": token,
        "user": row_to_user(row),
        "legal_version": LEGAL_VERSION,
        "demo": True,
        "ttl_hours": DEMO_TTL_HOURS,
    }), 201


@app.post("/api/auth/login")
def login():
    limited = rate_limited("login")
    if limited:
        return limited
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "invalid_request"}), 400
    raw_email = data.get("email", "")
    password = data.get("password", "")
    if not isinstance(raw_email, str) or not isinstance(password, str) or not valid_password(password):
        return jsonify({"error": "invalid_credentials", "message": "Email o contraseña incorrectos."}), 401
    email = clean_text(raw_email, max_len=254).lower()
    # Además del límite por IP, se acota por cuenta para frenar la fuerza bruta
    # distribuida contra un mismo correo.
    limited = rate_limited("login_account", email)
    if limited:
        return limited
    db = get_db()
    try:
        row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo leer la cuenta en el login")
        return _storage_unavailable()
    # Se compara siempre contra un hash: el tiempo de respuesta no revela si el
    # correo existe.
    stored_hash = row["password_hash"] if row else DUMMY_PASSWORD_HASH
    password_ok = check_password_hash(stored_hash, password)
    if not row or not password_ok:
        return jsonify({"error": "invalid_credentials", "message": "Email o contraseña incorrectos."}), 401
    try:
        cleanup_expired_sessions(db)
        trim_sessions(db, row["id"])
        token = secrets.token_urlsafe(32)
        db.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (session_token_digest(token), row["id"],
             (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()),
        )
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo crear la sesión en el login")
        return _storage_unavailable()
    return jsonify({"token": token, "user": row_to_user(row), "legal_version": LEGAL_VERSION})


@app.post("/api/auth/logout")
@require_auth
def logout(user):
    auth = request.headers.get("Authorization", "")
    token = auth[7:].strip() if auth.startswith("Bearer ") else None
    db = get_db()
    if token:
        try:
            db.execute("DELETE FROM sessions WHERE token = ?", (session_token_digest(token),))
            db.commit()
        except DB_ERRORS:
            app.logger.exception("No se pudo cerrar la sesión")
            return _storage_unavailable()
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
    try:
        db.execute(
            "UPDATE users SET consent_at = ?, consent_version = ? WHERE id = ?",
            (now_iso(), LEGAL_VERSION, user["id"]),
        )
        db.commit()
        row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo guardar el consentimiento")
        return _storage_unavailable()
    return jsonify({"user": row_to_user(row)})


@app.patch("/api/account/profile")
@require_auth
def update_profile(user):
    """Cambia nombre y campus. El email no se edita: exigiría verificarlo."""
    limited = rate_limited("profile", str(user["id"]))
    if limited:
        return limited
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "invalid_request"}), 400

    name = clean_text(data.get("name"), max_len=60) if "name" in data else None
    campus = data.get("campus") if "campus" in data else None
    if name is None and campus is None:
        return jsonify({"error": "nothing_to_update"}), 400
    if name is not None and (len(name) < 2 or len(name) > 60):
        return jsonify({
            "error": "invalid_name",
            "message": "El nombre debe tener entre 2 y 60 caracteres.",
        }), 400
    if campus is not None and campus not in CAMPUSES:
        return jsonify({"error": "invalid_campus"}), 400

    db = get_db()
    try:
        if name is not None:
            db.execute("UPDATE users SET name = ? WHERE id = ?", (name, user["id"]))
        if campus is not None:
            db.execute("UPDATE users SET campus = ? WHERE id = ?", (campus, user["id"]))
        db.commit()
        row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo guardar el perfil")
        return _storage_unavailable()
    return jsonify({"user": row_to_user(row)})


@app.post("/api/account/password")
@require_auth
def change_password(user):
    """Cambia la contraseña y cierra el resto de sesiones de la cuenta."""
    limited = rate_limited("password", str(user["id"]))
    if limited:
        return limited
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "invalid_request"}), 400
    current = data.get("current_password")
    new = data.get("new_password")
    if not isinstance(current, str) or not isinstance(new, str):
        return jsonify({"error": "invalid_request"}), 400
    db = get_db()
    row = db.execute(
        "SELECT password_hash, email FROM users WHERE id = ?", (user["id"],)
    ).fetchone()
    if not row:
        return jsonify({"error": "unauthorized"}), 401
    if not check_password_hash(row["password_hash"], current):
        return jsonify({
            "error": "invalid_current_password",
            "message": "La contraseña actual no es correcta.",
        }), 403
    problem = password_problem(new, row["email"])
    if problem == "invalid_password":
        return jsonify({
            "error": "invalid_password",
            "message": "La contraseña nueva debe tener al menos 8 caracteres.",
        }), 400
    if problem:
        return jsonify({"error": "weak_password", "message": WEAK_PASSWORD_MESSAGE}), 400
    if check_password_hash(row["password_hash"], new):
        return jsonify({
            "error": "same_password",
            "message": "La contraseña nueva debe ser distinta de la actual.",
        }), 400

    try:
        db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (generate_password_hash(new), user["id"]),
        )
        # Se conserva la sesión desde la que se cambia y se cierran las demás: si
        # alguien había entrado con la contraseña antigua, deja de valer.
        auth = request.headers.get("Authorization", "")
        token = auth[7:].strip() if auth.startswith("Bearer ") else ""
        closed = 0
        if token:
            rows = db.execute(
                "SELECT token FROM sessions WHERE user_id = ?", (user["id"],)
            ).fetchall()
            keep = session_token_digest(token)
            for row_token in rows:
                if row_token["token"] != keep:
                    db.execute("DELETE FROM sessions WHERE token = ?", (row_token["token"],))
                    closed += 1
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo cambiar la contraseña")
        return _storage_unavailable()
    return jsonify({"ok": True, "sessions_closed": closed})


@app.get("/api/account/export")
@require_auth
def export_account(user):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        items = [row_to_item(r) for r in db.execute(
            "SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]
        sent_requests = [row_to_request(r) for r in db.execute(
            "SELECT * FROM requests WHERE requester_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]
        received_requests = [row_to_request(r) for r in db.execute(
            "SELECT * FROM requests WHERE item_id IN (SELECT id FROM items WHERE owner_id = ?) "
            "ORDER BY created_at DESC", (user["id"],)).fetchall()]
        favorites = [row_to_item(r, True) for r in db.execute(
            "SELECT i.* FROM favorites f JOIN items i ON i.id = f.item_id "
            "WHERE f.user_id = ? ORDER BY f.created_at DESC", (user["id"],)).fetchall()]
        sessions = db.execute("SELECT COUNT(*) c FROM sessions WHERE user_id = ?", (user["id"],)).fetchone()["c"]
        my_ratings = [dict(r) for r in db.execute(
            "SELECT request_id, rated_id, score, comment, created_at FROM ratings "
            "WHERE rater_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]
        # Valoraciones que otras personas escribieron sobre esta cuenta:
        # se exportan igualmente porque son datos visibles para la persona
        # interesada y el borrado no debe pillarla por sorpresa.
        ratings_received = [dict(r) for r in db.execute(
            "SELECT request_id, rater_id, score, comment, created_at FROM ratings "
            "WHERE rated_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]
        reports_filed = [dict(r) for r in db.execute(
            "SELECT item_id, reason, comment, status, created_at FROM reports "
            "WHERE reporter_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]
    except DB_ERRORS:
        app.logger.exception("No se pudo generar la exportación")
        return _storage_unavailable()

    payload = {
        "service": SERVICE_NAME,
        "exported_at": now_iso(),
        "legal_version": LEGAL_VERSION,
        "profile": row_to_user(row),
        "items": items,
        "sent_requests": sent_requests,
        "received_requests": received_requests,
        "favorites": favorites,
        "ratings_written": my_ratings,
        "ratings_received": ratings_received,
        "reports_filed": reports_filed,
        "session_count": sessions,
        "notes": [
            "Exportación completa de los datos de la cuenta, incluidos los mensajes y valoraciones que otras personas escribieron y son visibles para ti.",
            "No se incluyen contraseñas ni tokens de sesión.",
            "La eliminación de cuenta borra tu perfil, tus sesiones, tus publicaciones, tus favoritos y tus valoraciones propias; las solicitudes recibidas, las valoraciones y los reportes escritos por otras personas se conservan en una cuenta eliminada para no destruir su historial.",
        ],
    }
    resp = jsonify(payload)
    resp.headers["Content-Disposition"] = f'attachment; filename="campus-circular-export-{user["id"]}.json"'
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.delete("/api/account/delete")
@require_auth
def delete_account(user):
    data = request.get_json(silent=True) or {}
    password = data.get("password") or ""
    db = get_db()
    try:
        row = db.execute("SELECT password_hash FROM users WHERE id = ?", (user["id"],)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo leer la cuenta para eliminarla")
        return _storage_unavailable()
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "invalid_password", "message": "Confirma tu contraseña para eliminar la cuenta."}), 401

    try:
        _acquire_write_lock(db)
        image_urls = sorted({r["image_url"] for r in db.execute(
            "SELECT image_url FROM items WHERE owner_id = ? AND image_url <> ''",
            (user["id"],)).fetchall()})
        counts = {
            "items": db.execute("SELECT COUNT(*) c FROM items WHERE owner_id = ?", (user["id"],)).fetchone()["c"],
            "sent_requests": db.execute("SELECT COUNT(*) c FROM requests WHERE requester_id = ?", (user["id"],)).fetchone()["c"],
            "received_requests": db.execute(
                "SELECT COUNT(*) c FROM requests WHERE item_id IN (SELECT id FROM items WHERE owner_id = ?)",
                (user["id"],)).fetchone()["c"],
            "favorites": db.execute("SELECT COUNT(*) c FROM favorites WHERE user_id = ?", (user["id"],)).fetchone()["c"],
            "sessions": db.execute("SELECT COUNT(*) c FROM sessions WHERE user_id = ?", (user["id"],)).fetchone()["c"],
            "ratings_written": db.execute("SELECT COUNT(*) c FROM ratings WHERE rater_id = ?", (user["id"],)).fetchone()["c"],
            "ratings_received": db.execute("SELECT COUNT(*) c FROM ratings WHERE rated_id = ?", (user["id"],)).fetchone()["c"],
            "reports_filed": db.execute("SELECT COUNT(*) c FROM reports WHERE reporter_id = ?", (user["id"],)).fetchone()["c"],
        }

        # --- Historial ajeno: se conserva, nunca se destruye ---------------
        ghost = deleted_user_id(db)
        if ghost:
            # Los reportes emitidos son la evidencia de moderación de las
            # publicaciones de otras personas. Si la cuenta fantasma ya tiene
            # un reporte sobre el mismo objeto, se conserva el más antiguo.
            db.execute(
                "DELETE FROM reports WHERE reporter_id = ? AND item_id IN "
                "(SELECT item_id FROM reports WHERE reporter_id = ?)",
                (user["id"], ghost))
            db.execute("UPDATE reports SET reporter_id = ? WHERE reporter_id = ?",
                       (ghost, user["id"]))
            # Mis solicitudes enviadas se anonimizan (sin mensaje) para que la
            # otra persona conserve su historial; el texto era mío y se borra.
            # Las pendientes duplicadas de la cuenta fantasma se cancelan para
            # respetar la unicidad de una solicitud pendiente por objeto.
            db.execute(
                "UPDATE requests SET status = 'cancelada' "
                "WHERE requester_id = ? AND status = 'pendiente' AND item_id IN "
                "(SELECT item_id FROM requests WHERE requester_id = ? AND status = 'pendiente')",
                (user["id"], ghost))
            db.execute("UPDATE requests SET requester_id = ?, message = '' WHERE requester_id = ?",
                       (ghost, user["id"]))
            # Valoraciones recibidas son textos escritos por otras personas.
            db.execute("UPDATE ratings SET rated_id = ? WHERE rated_id = ?", (ghost, user["id"]))
            # Las publicaciones se vacían y ocultan: el contenido y la foto se
            # borran de verdad, pero la referencia se conserva para no romper
            # las solicitudes recibidas ni las valoraciones de otras personas.
            db.execute(
                "UPDATE items SET owner_id = ?, title = 'Publicación eliminada', description = '', "
                "image_url = '', hidden_at = ? WHERE owner_id = ?",
                (ghost, now_iso(), user["id"]))

        # --- Datos propios: se eliminan -----------------------------------
        db.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
        db.execute("DELETE FROM favorites WHERE user_id = ?", (user["id"],))
        db.execute("DELETE FROM ratings WHERE rater_id = ?", (user["id"],))
        db.execute("DELETE FROM users WHERE id = ?", (user["id"],))
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo eliminar la cuenta")
        return _storage_unavailable()

    # Las fotos solo se borran del disco si ninguna publicación restante
    # (por ejemplo, otra reutilizando la misma imagen) las referencia.
    removed_files = 0
    for url in image_urls:
        try:
            in_use = db.execute("SELECT 1 FROM items WHERE image_url = ?", (url,)).fetchone()
        except DB_ERRORS:
            in_use = None
        if not in_use and remove_uploaded_file(url):
            removed_files += 1
    return jsonify({"ok": True, "deleted": counts, "removed_images": removed_files})


# --- Requests (solicitudes) -------------------------------------------------
@app.post("/api/items/<int:item_id>/request")
@require_auth
def create_request(user, item_id):
    limited = rate_limited("request", str(user["id"]))
    if limited:
        return limited
    db = get_db()
    try:
        # Escritura serializada: el estado del objeto se relee bajo el bloqueo
        # para que dos peticiones concurrentes no reserven ni dupliquen.
        _acquire_write_lock(db)
        _lock_item_row(db, item_id)
        item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo leer el objeto para solicitarlo")
        return _storage_unavailable()
    if not item or item["hidden_at"]:
        _rollback_quietly()
        return jsonify({"error": "not_found"}), 404
    if item["owner_id"] == user["id"]:
        _rollback_quietly()
        return jsonify({"error": "own_item", "message": "No puedes solicitar tu propio objeto."}), 400
    if item["status"] != "disponible":
        _rollback_quietly()
        return jsonify({"error": "not_available", "message": "Este objeto ya no está disponible."}), 400
    data = request.get_json(silent=True) or {}
    message = clean_text(data.get("message"), multiline=True, max_len=1000)
    if len(message) > 1000:
        _rollback_quietly()
        return jsonify({"error": "message_too_long"}), 400
    # Punto de encuentro propuesto: por defecto, el que indica la publicación.
    handover_point = data.get("handover_point") or item["handover_point"]
    if handover_point not in HANDOVER_POINTS:
        handover_point = "acordado"
    existing = db.execute(
        "SELECT * FROM requests WHERE item_id=? AND requester_id=? AND status='pendiente'",
        (item_id, user["id"])).fetchone()
    if existing:
        _rollback_quietly()
        return jsonify({"error": "already_requested", "message": "Ya tienes una solicitud pendiente para este objeto."}), 409
    try:
        cur = db.execute(
            "INSERT INTO requests (item_id, requester_id, message, handover_point, status, "
            "created_at) VALUES (?, ?, ?, ?, 'pendiente', ?) RETURNING id",
            (item_id, user["id"], message, handover_point, now_iso()))
        request_id = inserted_id(cur)
        db.commit()
    except DB_INTEGRITY_ERRORS:
        # El índice único (objeto, solicitante, pendiente) es la última línea
        # de defensa frente a dos peticiones simultáneas idénticas.
        db.rollback()
        return jsonify({"error": "already_requested", "message": "Ya tienes una solicitud pendiente para este objeto."}), 409
    except DB_ERRORS:
        app.logger.exception("No se pudo crear la solicitud")
        return _storage_unavailable()
    try:
        row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo releer la solicitud creada")
        return _storage_unavailable()
    return jsonify({"request": row_to_request(row)}), 201


def my_ratings_by_request(db, user_id):
    """{request_id: score} de las valoraciones que ha escrito esta cuenta."""
    return {
        r["request_id"]: r["score"]
        for r in db.execute(
            "SELECT request_id, score FROM ratings WHERE rater_id = ?", (user_id,)
        ).fetchall()
    }


@app.get("/api/requests/mine")
@require_auth
def my_requests(user):
    db = get_db()
    rows = db.execute(
        "SELECT r.*, i.title as item_title, i.image_url as item_image, i.status as item_status, "
        "u.name as owner_name "
        "FROM requests r JOIN items i ON i.id = r.item_id JOIN users u ON u.id = i.owner_id "
        "WHERE r.requester_id = ? ORDER BY r.created_at DESC", (user["id"],)).fetchall()
    rated = my_ratings_by_request(db, user["id"])
    out = []
    for r in rows:
        d = row_to_request(r)
        d["item_title"] = r["item_title"]
        d["item_image"] = r["item_image"]
        d["item_status"] = r["item_status"]
        d["counterpart_name"] = r["owner_name"]
        d["my_rating"] = rated.get(r["id"])
        d["can_rate"] = r["status"] == "completada" and r["id"] not in rated
        out.append(d)
    return jsonify({"requests": out})


@app.get("/api/requests/received")
@require_auth
def received_requests(user):
    db = get_db()
    rows = db.execute(
        "SELECT r.*, i.title as item_title, i.image_url as item_image, i.status as item_status, "
        "u.name as requester_name "
        "FROM requests r JOIN items i ON i.id = r.item_id JOIN users u ON u.id = r.requester_id "
        "WHERE i.owner_id = ? ORDER BY r.created_at DESC", (user["id"],)).fetchall()
    rated = my_ratings_by_request(db, user["id"])
    out = []
    for r in rows:
        d = row_to_request(r)
        d["item_title"] = r["item_title"]
        d["item_image"] = r["item_image"]
        d["item_status"] = r["item_status"]
        d["counterpart_name"] = r["requester_name"]
        d["my_rating"] = rated.get(r["id"])
        d["can_rate"] = r["status"] == "completada" and r["id"] not in rated
        out.append(d)
    return jsonify({"requests": out})


@app.patch("/api/requests/<int:request_id>")
@require_auth
def update_request(user, request_id):
    """Transiciones de la máquina de estados de solicitudes.

    Toda la validación se hace dentro de una transacción serializada
    (``BEGIN IMMEDIATE`` en SQLite, ``FOR UPDATE`` en PostgreSQL) y los
    ``UPDATE`` condicionales comprueban el estado observado, de modo que
    dos peticiones concurrentes no pueden reservar el mismo objeto dos
    veces ni cerrar dos veces la misma solicitud.
    """
    db = get_db()
    try:
        _acquire_write_lock(db)
        row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
        if row:
            _lock_item_row(db, row["item_id"])
            # Releer bajo el bloqueo: el estado pudo cambiar entre lecturas.
            row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
        item = db.execute("SELECT * FROM items WHERE id = ?", (row["item_id"],)).fetchone() if row else None
    except DB_ERRORS:
        app.logger.exception("No se pudo leer la solicitud para actualizarla")
        return _storage_unavailable()
    if not row:
        _rollback_quietly()
        return jsonify({"error": "not_found"}), 404
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in REQUEST_STATUSES:
        _rollback_quietly()
        return jsonify({"error": "invalid_status"}), 400
    new_point = data.get("handover_point")
    if new_point and new_point not in HANDOVER_POINTS:
        _rollback_quietly()
        return jsonify({"error": "invalid_handover_point"}), 400

    is_owner = item and item["owner_id"] == user["id"]
    is_requester = row["requester_id"] == user["id"]
    if not (is_owner or is_requester):
        _rollback_quietly()
        return jsonify({"error": "forbidden"}), 403
    if row["status"] in ("completada", "rechazada", "cancelada"):
        _rollback_quietly()
        return jsonify({
            "error": "request_closed",
            "message": "Esta solicitud ya está cerrada.",
        }), 400
    if is_owner and new_status not in ("aceptada", "rechazada", "completada"):
        _rollback_quietly()
        return jsonify({"error": "invalid_transition"}), 400
    if is_requester and not is_owner and new_status != "cancelada":
        _rollback_quietly()
        return jsonify({"error": "invalid_transition"}), 400
    if new_status == "completada" and row["status"] != "aceptada":
        _rollback_quietly()
        return jsonify({
            "error": "invalid_transition",
            "message": "Acepta la solicitud antes de marcarla como entregada.",
        }), 400
    if new_status == "aceptada" and row["status"] == "pendiente" and item:
        # Una sola reserva por objeto: si otra solicitud ya está aceptada,
        # no se puede aceptar otra en paralelo.
        other = db.execute(
            "SELECT 1 FROM requests WHERE item_id = ? AND id <> ? AND status = 'aceptada'",
            (item["id"], request_id)).fetchone()
        if other:
            _rollback_quietly()
            return jsonify({
                "error": "already_reserved",
                "message": "Otra solicitud ya está aceptada para este objeto.",
            }), 409

    try:
        # El UPDATE condicional exige que el estado siga siendo el observado:
        # si otra transacción lo cambió antes, no se pisa (rowcount = 0).
        cur = db.execute(
            "UPDATE requests SET status = ?, handover_point = COALESCE(?, handover_point) "
            "WHERE id = ? AND status = ?",
            (new_status, new_point or None, request_id, row["status"]))
        if cur.rowcount == 0:
            db.rollback()
            return jsonify({
                "error": "request_conflict",
                "message": "La solicitud cambió mientras se procesaba; recarga e inténtalo de nuevo.",
            }), 409
        if item:
            if new_status == "aceptada" and row["status"] == "pendiente":
                # Reserva condicional: solo pasa a reservado si sigue libre.
                cur = db.execute(
                    "UPDATE items SET status = 'reservado', delivered_at = '' "
                    "WHERE id = ? AND status = 'disponible'", (item["id"],))
                if cur.rowcount == 0:
                    db.rollback()
                    return jsonify({
                        "error": "not_available",
                        "message": "Este objeto ya no está disponible.",
                    }), 409
            if new_status == "completada":
                db.execute(
                    "UPDATE items SET status = 'entregado', delivered_at = ? WHERE id = ?",
                    (item["delivered_at"] or now_iso(), item["id"]))
                # El resto de solicitudes pendientes ya no tienen objeto libre.
                db.execute(
                    "UPDATE requests SET status = 'rechazada' "
                    "WHERE item_id = ? AND id <> ? AND status = 'pendiente'",
                    (item["id"], request_id))
            if new_status in ("rechazada", "cancelada") and item["status"] == "reservado":
                other = db.execute(
                    "SELECT 1 FROM requests WHERE item_id = ? AND id <> ? AND status = 'aceptada'",
                    (item["id"], request_id)).fetchone()
                if not other:
                    db.execute("UPDATE items SET status = 'disponible' WHERE id = ?", (item["id"],))
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo actualizar la solicitud")
        return _storage_unavailable()
    invalidate_stats()
    try:
        row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo releer la solicitud actualizada")
        return _storage_unavailable()
    return jsonify({"request": row_to_request(row)})


@app.post("/api/requests/<int:request_id>/rate")
@require_auth
def rate_request(user, request_id):
    """Valoración rápida (1–5) tras cerrar la entrega, en ambos sentidos."""
    db = get_db()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    item = db.execute("SELECT * FROM items WHERE id = ?", (row["item_id"],)).fetchone()
    if not item:
        return jsonify({"error": "not_found"}), 404
    is_owner = item["owner_id"] == user["id"]
    is_requester = row["requester_id"] == user["id"]
    if not (is_owner or is_requester):
        return jsonify({"error": "forbidden"}), 403
    if row["status"] != "completada":
        return jsonify({
            "error": "not_completed",
            "message": "Solo puedes valorar cuando la entrega está completada.",
        }), 400

    data = request.get_json(silent=True) or {}
    score = data.get("score")
    if isinstance(score, bool) or not isinstance(score, int) or not RATING_MIN <= score <= RATING_MAX:
        return jsonify({"error": "invalid_score", "message": "La valoración debe ser de 1 a 5."}), 400
    comment = data.get("comment") or ""
    if not isinstance(comment, str):
        return jsonify({"error": "invalid_comment"}), 400
    comment = clean_text(comment, multiline=True, max_len=RATING_COMMENT_MAX)
    if len(comment) > RATING_COMMENT_MAX:
        return jsonify({
            "error": "comment_too_long",
            "message": f"El comentario no puede superar {RATING_COMMENT_MAX} caracteres.",
        }), 400
    if any(ord(ch) < 32 and ch not in "\n\t" for ch in comment):
        return jsonify({"error": "invalid_comment"}), 400

    rated_id = item["owner_id"] if is_requester else row["requester_id"]
    if rated_id == user["id"]:
        return jsonify({"error": "self_rating"}), 400
    existing = db.execute(
        "SELECT 1 FROM ratings WHERE request_id = ? AND rater_id = ?",
        (request_id, user["id"])).fetchone()
    if existing:
        return jsonify({"error": "already_rated", "message": "Ya has valorado este intercambio."}), 409

    try:
        cur = db.execute(
            "INSERT INTO ratings (request_id, rater_id, rated_id, score, comment, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
            (request_id, user["id"], rated_id, score, comment, now_iso()))
        rating_id = inserted_id(cur)
        db.commit()
    except DB_INTEGRITY_ERRORS:
        db.rollback()
        return jsonify({"error": "already_rated"}), 409
    except DB_ERRORS:
        db.rollback()
        app.logger.exception("No se pudo guardar una valoración")
        return jsonify({"error": "storage_unavailable"}), 503

    created = db.execute("SELECT * FROM ratings WHERE id = ?", (rating_id,)).fetchone()
    return jsonify({
        "rating": {
            "id": created["id"],
            "request_id": created["request_id"],
            "score": created["score"],
            "comment": created["comment"],
            "created_at": created["created_at"],
        },
        "summary": rating_summary(db, rated_id),
    }), 201


# --- Favorites ---------------------------------------------------------------
@app.post("/api/items/<int:item_id>/favorite")
@require_auth
def toggle_favorite(user, item_id):
    """Alternancia atómica del favorito.

    ``INSERT OR IGNORE`` / ``ON CONFLICT DO NOTHING`` decide el resultado
    en una sola sentencia: si la fila no existía se crea (favorito) y si ya
    existía se elimina. Dos clics simultáneos ya no pueden provocar un
    error de clave duplicada ni dejar el favorito a medias.
    """
    db = get_db()
    try:
        item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    except DB_ERRORS:
        app.logger.exception("No se pudo leer el objeto para el favorito")
        return _storage_unavailable()
    if not item or item["hidden_at"]:
        return jsonify({"error": "not_found"}), 404
    try:
        if USE_POSTGRES:
            cur = db.execute(
                "INSERT INTO favorites (user_id, item_id, created_at) VALUES (?, ?, ?) "
                "ON CONFLICT DO NOTHING",
                (user["id"], item_id, now_iso()))
        else:
            cur = db.execute(
                "INSERT OR IGNORE INTO favorites (user_id, item_id, created_at) VALUES (?, ?, ?)",
                (user["id"], item_id, now_iso()))
        if cur.rowcount == 1:
            db.commit()
            return jsonify({"is_favorite": True})
        # Ya existía: el clic lo retira.
        db.execute("DELETE FROM favorites WHERE user_id=? AND item_id=?", (user["id"], item_id))
        db.commit()
    except DB_ERRORS:
        app.logger.exception("No se pudo alternar el favorito")
        return _storage_unavailable()
    return jsonify({"is_favorite": False})


@app.get("/api/favorites")
@require_auth
def favorites(user):
    db = get_db()
    try:
        rows = db.execute(
            "SELECT i.* FROM items i JOIN favorites f ON f.item_id = i.id "
            "WHERE f.user_id = ? AND i.hidden_at = '' ORDER BY f.created_at DESC",
            (user["id"],)).fetchall()
    except DB_ERRORS:
        app.logger.exception("No se pudieron leer los favoritos")
        return _storage_unavailable()
    return jsonify({"items": [row_to_item(r, True) for r in rows]})


@app.get("/api/users/<int:user_id>")
def public_user(user_id):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    u = row_to_public_user(row)
    u["items_count"] = db.execute(
        "SELECT COUNT(*) c FROM items WHERE owner_id=? AND hidden_at = ''",
        (user_id,)).fetchone()["c"]
    trust = user_trust(db, row)
    u["rating"] = trust["rating"]
    u["exchanges"] = trust["exchanges"]
    u["level"] = trust["level"]
    u["impact"] = trust["impact"]
    u["badges"] = badges_for(trust)
    return jsonify({"user": u})


@app.get("/robots.txt")
def robots_txt():
    """La SPA necesita un robots.txt explícito: sin él, el fallback devolvía HTML."""
    root = request.url_root.rstrip("/")
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /mi-area\n"
        f"Sitemap: {root}/sitemap.xml\n"
    )
    resp = Response(body, mimetype="text/plain")
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


@app.get("/sitemap.xml")
def sitemap_xml():
    root = request.url_root.rstrip("/")
    urls = "".join(
        f"<url><loc>{root}{path}</loc><changefreq>weekly</changefreq></url>"
        for path in SPA_VIEWS
        if path != "/mi-area"
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{urls}</urlset>"
    )
    resp = Response(xml, mimetype="application/xml")
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/") or request.path.startswith("/static/"):
        return jsonify({"error": "not_found"}), 404
    resp = make_response(render_template("index.html", boot=boot_config("home")))
    resp.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=300"
    return resp


@app.errorhandler(sqlite3.Error)
@app.errorhandler(psycopg.Error)
def db_error_handler(e):
    """Red de seguridad: ningún error de BD llega al cliente como 500.

    Las rutas críticas ya capturan ``DB_ERRORS`` con ``rollback()``
    explícito; este manejador cubre cualquier ruta que no lo haga y
    garantiza que la conexión no quede con la transacción envenenada
    (en PostgreSQL, una transacción fallida bloquea todo hasta rollback).
    """
    app.logger.exception("Error de base de datos no capturado")
    return _storage_unavailable()


# Sin llamada a `bootstrap()` a nivel de módulo: importar `app` (tests,
# gunicorn) no muta la base ni el disco. El arranque es perezoso en la
# primera conexión (`get_db`) y explícito solo al ejecutar el servidor.
if __name__ == "__main__":
    bootstrap()
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
