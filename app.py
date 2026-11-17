"""
Campus Circular — CTC-07 · Universidade de Vigo
Reuse and exchange of university materials.

Backend: Flask + SQLite (stdlib only, no extra DB driver needed).
Frontend: static SPA served from templates/ + static/.

Run:
    python3 app.py
Then open http://127.0.0.1:5000  (or the preview URL)

Design notes (from CTC-07 research):
- Trust first: verified UVigo membership, mandatory condition photos/descriptions,
  clear loan rules, safe campus handover points.
- Categories mirror the survey taxonomy (Q6/Q10) + sport/leisure + other.
- Bilingual/trilingual UI is handled on the frontend; the API is language-neutral
  (stores user content as written).
"""

import os
import re
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Flask, g, jsonify, render_template, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DATABASE can be overridden for deployments (e.g. Render) where the
# project directory may be ephemeral; default is a local SQLite file.
DATABASE = os.environ.get("DATABASE", os.path.join(BASE_DIR, "campus_circular.db"))
os.makedirs(os.path.dirname(DATABASE) or ".", exist_ok=True)
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

UVIGO_DOMAINS = {"alumnos.uvigo.es", "uvigo.gal", "uvigo.es", "alumnado.uvigo.gal"}

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

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
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


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def row_to_user(r):
    if r is None:
        return None
    return {
        "id": r["id"],
        "name": r["name"],
        "email": r["email"],
        "campus": r["campus"],
        "degree": r["degree"],
        "verified": bool(r["verified"]),
        "created_at": r["created_at"],
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
        (token, now_iso()),
    ).fetchone()
    return row_to_user(row) if row else None


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify({"error": "unauthorized", "message": "Inicia sesión para continuar."}), 401
        return fn(user, *args, **kwargs)

    return wrapper


def is_uvigo_email(email: str) -> bool:
    try:
        domain = email.rsplit("@", 1)[1].lower().strip()
    except Exception:
        return False
    return domain in UVIGO_DOMAINS


def valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ""))


# ---------------------------------------------------------------------------
# Seed data — example items only, NO demo logins.
# There is intentionally NO shared/demo account: every student registers
# with their own email. Example items are owned by a system account
# ("Equipo CTC-07") whose password is random and unusable for login,
# so nobody can sign in as a demo user. Friends register themselves
# and publish their real items.
# ---------------------------------------------------------------------------
SEED_OWNER = {
    "name": "Equipo CTC-07",
    "email": "equipo-ctc07@campus-circular.local",
    "campus": "vigo",
    "degree": "Ejemplo — regístrate con tu cuenta para publicar",
}

SEED_ITEMS = [
    {"owner": 0, "title": "Libro de Derecho Civil — edición 2023",
     "description": "Libro de texto de Derecho Civil usado un curso. Subrayados leves en los primeros capítulos, resto limpio. Incluyo apuntes de clase en PDF. Ideal para 1º de Derecho.",
     "category": "libros", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "biblioteca",
     "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Calculadora Casio fx-991ES Plus",
     "description": "Calculadora científica en perfecto estado, con funda y tapa. La usé para exámenes de finanzas. Puedo prestarla por un cuatrimestre con normas claras de devolución.",
     "category": "estudio", "condition": "como_nuevo", "exchange_type": "prestar", "price": 0,
     "campus": "vigo", "handover_point": "punto",
     "image_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Chaqueta de invierno talla M",
     "description": "Chaqueta de invierno en buen estado, sin manchas ni roturas. Me queda pequeña ahora. Busco intercambiar por otra talla o regalarla a quien la necesite.",
     "category": "ropa", "condition": "bueno", "exchange_type": "intercambiar", "price": 0,
     "campus": "vigo", "handover_point": "entrada",
     "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Escritorio pequeño para piso de estudiantes",
     "description": "Escritorio de 110x55 cm, estable y sin daños. Lo compré de segunda mano el año pasado y ahora me mudo. Hay que desmontarlo, puedo ayudar con el desmontaje.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "acordado",
     "image_url": "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Estantería pequeña de 3 baldas",
     "description": "Estantería de madera clara, perfecta para libros y apuntes. En buen estado, sin arañazos visibles. Entrego desmontada en el campus.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "pontevedra", "handover_point": "biblioteca",
     "image_url": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Auriculares inalámbricos",
     "description": "Auriculares Bluetooth con estuche de carga. Funcionan perfectamente, batería dura todo el día. Los vendo porque me regalaron otros.",
     "category": "electronica", "condition": "como_nuevo", "exchange_type": "vender", "price": 15,
     "campus": "vigo", "handover_point": "punto",
     "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Juego de ollas y sartenes",
     "description": "Set de cocina para piso compartido: 2 ollas, 2 sartenes y tapas. Usados pero en buen estado. Puedo prestarlos a compañeros que acaban de mudarse.",
     "category": "cocina", "condition": "bueno", "exchange_type": "prestar", "price": 0,
     "campus": "ourense", "handover_point": "cafeteria",
     "image_url": "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Freidora de aire 4L",
     "description": "Freidora de aire en buen estado, funciona sin problemas. La regalo porque en mi piso nuevo ya tengo una. Incluyo manual.",
     "category": "electrodomesticos", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "punto",
     "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Apuntes completos de Ingeniería Industrial",
     "description": "Carpeta con apuntes, exámenes resueltos y prácticas de 1º y 2º de Ingeniería Industrial. Muy útiles para quien empieza. En papel, puedo pasar fotos si hace falta.",
     "category": "libros", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "biblioteca",
     "image_url": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Mochila universitaria 25L",
     "description": "Mochila resistente con compartimento para portátil. Como nueva, sin roturas. La intercambio por una más pequeña o la regalo.",
     "category": "ropa", "condition": "como_nuevo", "exchange_type": "intercambiar", "price": 0,
     "campus": "vigo", "handover_point": "entrada",
     "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Lámpara de escritorio LED",
     "description": "Lámpara de escritorio con luz regulable. En buen estado, ideal para estudiar. La regalo porque me mudo a una residencia con lámpara incluida.",
     "category": "muebles", "condition": "bueno", "exchange_type": "regalar", "price": 0,
     "campus": "vigo", "handover_point": "acordado",
     "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80&auto=format&fit=crop"},
    {"owner": 0, "title": "Teclado inalámbrico",
     "description": "Teclado inalámbrico silencioso, perfecto para biblioteca y aulas. Funciona con pilas AA. Lo vendo a precio simbólico para estudiantes.",
     "category": "electronica", "condition": "bueno", "exchange_type": "vender", "price": 10,
     "campus": "pontevedra", "handover_point": "punto",
     "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80&auto=format&fit=crop"},
]


def seed_if_empty():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    count = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
    if count > 0:
        db.close()
        return
    # Single system owner for example items. Password is random and
    # never shown, so this account can never be used to log in.
    cur = db.execute(
        "INSERT INTO users (name, email, password_hash, campus, degree, verified, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (SEED_OWNER["name"], SEED_OWNER["email"],
         generate_password_hash(uuid.uuid4().hex),
         SEED_OWNER["campus"], SEED_OWNER["degree"], 0, now_iso()),
    )
    user_ids = [cur.lastrowid]
    for it in SEED_ITEMS:
        db.execute(
            "INSERT INTO items (owner_id, title, description, category, condition, exchange_type, "
            "price, campus, handover_point, image_url, status, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?)",
            (user_ids[it["owner"]], it["title"], it["description"], it["category"],
             it["condition"], it["exchange_type"], it["price"], it["campus"],
             it["handover_point"], it["image_url"], now_iso()),
        )
    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Routes — frontend
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/static/uploads/<path:filename>")
def uploads(filename):
    return send_from_directory(UPLOAD_DIR, filename)


# ---------------------------------------------------------------------------
# Routes — API
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "campus-circular", "time": now_iso()})


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
    item["owner"] = row_to_user(owner)
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
    try:
        price = float(data.get("price") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_price"}), 400

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
    if image_url and not image_url.startswith(("http://", "https://", "/static/")):
        return jsonify({"error": "invalid_image_url"}), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO items (owner_id, title, description, category, condition, exchange_type, "
        "price, campus, handover_point, image_url, status, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?)",
        (user["id"], title, description, category, condition, exchange_type,
         price, campus, handover_point, image_url, now_iso()),
    )
    db.commit()
    row = db.execute("SELECT * FROM items WHERE id = ?", (cur.lastrowid,)).fetchone()
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
    db.execute("DELETE FROM items WHERE id = ?", (item_id,))
    db.commit()
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
    filename = f"{uuid.uuid4().hex}{ext}"
    f.save(os.path.join(UPLOAD_DIR, secure_filename(filename)))
    return jsonify({"url": f"/static/uploads/{filename}"}), 201


# --- Auth -------------------------------------------------------------------
@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    campus = data.get("campus", "vigo")
    degree = (data.get("degree") or "").strip()

    if len(name) < 2 or len(name) > 60:
        return jsonify({"error": "invalid_name"}), 400
    if not valid_email(email):
        return jsonify({"error": "invalid_email"}), 400
    if len(password) < 6:
        return jsonify({"error": "invalid_password", "message": "La contraseña debe tener al menos 6 caracteres."}), 400
    if campus not in CAMPUSES:
        return jsonify({"error": "invalid_campus"}), 400

    db = get_db()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        return jsonify({"error": "email_taken", "message": "Ya existe una cuenta con ese email."}), 409
    cur = db.execute(
        "INSERT INTO users (name, email, password_hash, campus, degree, verified, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (name, email, generate_password_hash(password), campus, degree,
         1 if is_uvigo_email(email) else 0, now_iso()),
    )
    db.commit()
    token = uuid.uuid4().hex
    db.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
               (token, cur.lastrowid, (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()))
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify({"token": token, "user": row_to_user(row)}), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "invalid_credentials", "message": "Email o contraseña incorrectos."}), 401
    token = uuid.uuid4().hex
    db.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
               (token, row["id"], (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()))
    db.commit()
    return jsonify({"token": token, "user": row_to_user(row)})


@app.post("/api/auth/logout")
@require_auth
def logout(user):
    auth = request.headers.get("Authorization", "")
    token = auth[7:].strip() if auth.startswith("Bearer ") else None
    db = get_db()
    if token:
        db.execute("DELETE FROM sessions WHERE token = ?", (token,))
        db.commit()
    return jsonify({"ok": True})


@app.get("/api/auth/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"user": None})
    return jsonify({"user": user})


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
        "VALUES (?, ?, ?, 'pendiente', ?)",
        (item_id, user["id"], message, now_iso()))
    db.commit()
    row = db.execute("SELECT * FROM requests WHERE id = ?", (cur.lastrowid,)).fetchone()
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
    # Owner accepts/rejects/completes; requester cancels.
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
    u = row_to_user(row)
    u.pop("email", None)
    count = db.execute("SELECT COUNT(*) c FROM items WHERE owner_id=?", (user_id,)).fetchone()["c"]
    u["items_count"] = count
    return jsonify({"user": u})


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "not_found"}), 404
    return render_template("index.html")


if __name__ == "__main__":
    init_db()
    seed_if_empty()
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
