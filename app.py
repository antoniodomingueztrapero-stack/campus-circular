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
    PORT, SEED_DEMO, CONTACT_EMAIL, CONTROLLER_NAME, LEGAL_VERSION, LEGAL_UPDATED,
    UNIVERSITY_DOMAINS (dominios de correo institucional aceptados).
"""

import gzip
import hashlib
import io
import mimetypes
import os
import re
import secrets
import sqlite3
import time
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
LEGAL_VERSION = os.environ.get("LEGAL_VERSION", "2026-11-20")
LEGAL_UPDATED = os.environ.get("LEGAL_UPDATED", "2026-11-20")
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
HANDOVER_POINTS = ["biblioteca", "conserjeria", "cafeteria", "entrada", "punto", "acordado"]
FACULTIES = ["ingenieria", "ciencias", "salud", "sociales", "humanidades", "artes"]
ITEM_STATUSES = ["disponible", "reservado", "entregado"]
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

app = Flask(__name__)
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
            faculty TEXT NOT NULL DEFAULT '',
            image_url TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'disponible',
            delivered_at TEXT NOT NULL DEFAULT '',
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
        -- El índice suelto de \`status\` queda cubierto por (status, created_at).
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
    sql = "SELECT category, exchange_type, price FROM items WHERE status = 'entregado'"
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
    expr = f"LOWER({column})"
    for src, dst in ACCENT_MAP.items():
        expr = f"REPLACE({expr}, '{src}', '{dst}')"
    return expr


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
     "description": "Teclado perfecto para biblioteca y aulas, funciona con pilas AA. Precio simbólico orientativo; Circular Campus no gestiona el cobro.",
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


def bootstrap():
    """Funciona tanto con `python3 app.py` como con un servidor WSGI."""
    global _BOOTSTRAPPED
    if _BOOTSTRAPPED:
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
    resp = jsonify({"ok": True, "service": "circular-campus"})
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.get("/api/health")
def health():
    resp = jsonify({
        "ok": True,
        "service": "circular-campus",
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
            "FROM items"
        ).fetchone()
        users = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
        by_category = db.execute(
            "SELECT category, COUNT(*) c FROM items GROUP BY category ORDER BY c DESC"
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
    q = (request.args.get("q") or "").strip().lower()
    category = request.args.get("category")
    campus = request.args.get("campus")
    condition = request.args.get("condition")
    exchange_type = request.args.get("type")
    faculty = request.args.get("faculty")
    status = request.args.get("status", "disponible")
    sort = request.args.get("sort", "recent")
    limit, offset = pagination_args()

    where = ["1=1"]
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
            where.append(f"({title_folded} LIKE ? OR {desc_folded} LIKE ?)")
            params.extend([f"%{term}%", f"%{term}%"])

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
        "SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (user["id"], limit, offset),
    ).fetchall()
    return jsonify(page_payload(rows, total, limit, offset, row_to_item))


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
    public_owner = row_to_public_user(owner)
    if public_owner:
        trust = user_trust(db, owner)
        public_owner["rating"] = trust["rating"]
        public_owner["exchanges"] = trust["exchanges"]
        public_owner["level"] = trust["level"]
        public_owner["impact"] = trust["impact"]
    item["owner"] = public_owner
    return jsonify({"item": item})


@app.post("/api/items")
@require_auth
def create_item(user):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    category = data.get("category")
    # El formulario rápido solo exige foto, título, categoría y tipo. El resto
    # de campos toma un valor razonable para publicar en menos de un minuto.
    condition = data.get("condition") or "bueno"
    exchange_type = data.get("exchange_type")
    campus = data.get("campus") or user["campus"]
    handover_point = data.get("handover_point") or "acordado"
    faculty = (data.get("faculty") or "").strip()
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
            "message": "Usa una imagen subida a Circular Campus; no se permiten URL externas.",
        }), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO items (owner_id, title, description, category, condition, exchange_type, "
        "price, campus, handover_point, faculty, image_url, status, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?) RETURNING id",
        (user["id"], title, description, category, condition, exchange_type,
         price, campus, handover_point, faculty, image_url, now_iso()),
    )
    item_id = inserted_id(cur)
    db.commit()
    invalidate_stats()
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
    if new_status == "entregado":
        delivered_at = row["delivered_at"] or now_iso()
        db.execute("UPDATE items SET status = ?, delivered_at = ? WHERE id = ?",
                   (new_status, delivered_at, item_id))
        # Cerrar también la solicitud aceptada evita intercambios a medias.
        db.execute(
            "UPDATE requests SET status = 'completada' "
            "WHERE item_id = ? AND status = 'aceptada'", (item_id,))
    else:
        db.execute("UPDATE items SET status = ?, delivered_at = '' WHERE id = ?",
                   (new_status, item_id))
    db.commit()
    invalidate_stats()
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
    invalidate_stats()
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
    my_ratings = [dict(r) for r in db.execute(
        "SELECT request_id, rated_id, score, comment, created_at FROM ratings "
        "WHERE rater_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()]

    payload = {
        "service": SERVICE_NAME,
        "exported_at": now_iso(),
        "legal_version": LEGAL_VERSION,
        "profile": row_to_user(row),
        "items": items,
        "sent_requests": sent_requests,
        "favorites": favorites,
        "ratings_written": my_ratings,
        "session_count": sessions,
        "notes": [
            "Exportación de los datos propios de la cuenta.",
            "No se incluyen contraseñas, tokens de sesión, mensajes ni valoraciones escritas por otras personas.",
            "La eliminación de cuenta borra perfil, sesiones, publicaciones, favoritos, solicitudes y valoraciones propias.",
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
    # Punto de encuentro propuesto: por defecto, el que indica la publicación.
    handover_point = data.get("handover_point") or item["handover_point"]
    if handover_point not in HANDOVER_POINTS:
        handover_point = "acordado"
    existing = db.execute(
        "SELECT * FROM requests WHERE item_id=? AND requester_id=? AND status='pendiente'",
        (item_id, user["id"])).fetchone()
    if existing:
        return jsonify({"error": "already_requested", "message": "Ya tienes una solicitud pendiente para este objeto."}), 409
    cur = db.execute(
        "INSERT INTO requests (item_id, requester_id, message, handover_point, status, "
        "created_at) VALUES (?, ?, ?, ?, 'pendiente', ?) RETURNING id",
        (item_id, user["id"], message, handover_point, now_iso()))
    request_id = inserted_id(cur)
    db.commit()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
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
    db = get_db()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
    if not row:
        return jsonify({"error": "not_found"}), 404
    item = db.execute("SELECT * FROM items WHERE id = ?", (row["item_id"],)).fetchone()
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in REQUEST_STATUSES:
        return jsonify({"error": "invalid_status"}), 400
    new_point = data.get("handover_point")
    if new_point and new_point not in HANDOVER_POINTS:
        return jsonify({"error": "invalid_handover_point"}), 400

    is_owner = item and item["owner_id"] == user["id"]
    is_requester = row["requester_id"] == user["id"]
    if not (is_owner or is_requester):
        return jsonify({"error": "forbidden"}), 403
    if row["status"] in ("completada", "rechazada", "cancelada"):
        return jsonify({
            "error": "request_closed",
            "message": "Esta solicitud ya está cerrada.",
        }), 400
    if is_owner and new_status not in ("aceptada", "rechazada", "completada"):
        return jsonify({"error": "invalid_transition"}), 400
    if is_requester and not is_owner and new_status != "cancelada":
        return jsonify({"error": "invalid_transition"}), 400
    if new_status == "completada" and row["status"] != "aceptada":
        return jsonify({
            "error": "invalid_transition",
            "message": "Acepta la solicitud antes de marcarla como entregada.",
        }), 400

    db.execute("UPDATE requests SET status = ? WHERE id = ?", (new_status, request_id))
    if new_point:
        db.execute("UPDATE requests SET handover_point = ? WHERE id = ?", (new_point, request_id))
    if item:
        if new_status == "aceptada" and item["status"] == "disponible":
            db.execute(
                "UPDATE items SET status = 'reservado', delivered_at = '' WHERE id = ?",
                (item["id"],))
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
    invalidate_stats()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
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
    comment = comment.strip()
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
    u["items_count"] = db.execute(
        "SELECT COUNT(*) c FROM items WHERE owner_id=?", (user_id,)).fetchone()["c"]
    trust = user_trust(db, row)
    u["rating"] = trust["rating"]
    u["exchanges"] = trust["exchanges"]
    u["level"] = trust["level"]
    u["impact"] = trust["impact"]
    u["badges"] = badges_for(trust)
    return jsonify({"user": u})


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/") or request.path.startswith("/static/"):
        return jsonify({"error": "not_found"}), 404
    resp = make_response(render_template("index.html", boot=boot_config("home")))
    resp.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=300"
    return resp


bootstrap()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
