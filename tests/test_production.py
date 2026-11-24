"""Producción: almacenamiento persistente, optimización, paginación y caché."""

import io
import os
import tempfile
import unittest
from unittest import mock

from PIL import Image

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


def png_bytes(size=(1600, 1000), mode="RGB"):
    image = Image.new(mode, size, (40, 120, 80))
    for x in range(0, size[1], 6):
        for y in range(0, size[0], 6):
            image.putpixel((y, x), (x % 256, y % 256, (x * y) % 256))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class ProductionTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-prod-")
        self.upload_dir = tempfile.TemporaryDirectory(prefix="cc-uploads-")
        self.original_upload_dir = backend.UPLOAD_DIR
        backend.UPLOAD_DIR = self.upload_dir.name
        backend.DATABASE = os.path.join(self.db_dir.name, "prod.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True)
        self.client = backend.app.test_client()
        self.token = self.register("Marta", "marta@uvigo.gal")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        backend.UPLOAD_DIR = self.original_upload_dir
        backend.app.config["TESTING"] = False
        self.db_dir.cleanup()
        self.upload_dir.cleanup()

    # -- helpers ---------------------------------------------------------
    def register(self, name, email):
        res = self.client.post("/api/auth/register", json={
            "name": name, "email": email, "password": "password1234",
            "campus": "vigo", "consent": True,
        })
        self.assertEqual(res.status_code, 201, res.get_json())
        return res.get_json()["token"]

    def upload(self, data, filename="foto.png", content_type="image/png"):
        return self.client.post(
            "/api/upload",
            data={"file": (io.BytesIO(data), filename)},
            headers=self.headers,
            content_type="multipart/form-data",
        )

    def publish(self, title="Objeto", **extra):
        payload = {
            "title": title, "category": "libros", "exchange_type": "regalar",
            "image_url": "/static/img/items/libros.jpg", "private_seller": True,
        }
        payload.update(extra)
        res = self.client.post("/api/items", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201, res.get_json())
        return res.get_json()["item"]

    # -- catálogo ----------------------------------------------------------
    def test_catalog_shows_real_listings_without_ticket_only_restriction(self):
        expected = {
            self.publish(title="Billete para concierto")["id"],
            self.publish(title="Libro de cálculo")["id"],
            self.publish(title="Mesa auxiliar")["id"],
        }

        catalog = self.client.get("/api/items?limit=60").get_json()

        self.assertEqual(catalog["total"], 3)
        self.assertEqual({item["id"] for item in catalog["items"]}, expected)

    def test_demo_cleanup_removes_only_system_seed_ads(self):
        real_item = self.publish(title="Anuncio de una persona")
        db = backend.connect_db()
        try:
            cur = db.execute(
                "INSERT INTO users (name, email, password_hash, campus, created_at) "
                "VALUES (?, ?, ?, ?, ?) RETURNING id",
                (backend.SEED_OWNER["name"], backend.SEED_OWNER["email"],
                 "unused-test-hash", backend.SEED_OWNER["campus"], backend.now_iso()),
            )
            seed_owner_id = backend.inserted_id(cur)
            for title in ("Anuncio de muestra 1", "Anuncio de muestra 2"):
                db.execute(
                    "INSERT INTO items (owner_id, title, description, category, condition, "
                    "exchange_type, campus, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (seed_owner_id, title, "Prueba", "libros", "bueno", "regalar",
                     "vigo", backend.now_iso()),
                )
            removed = backend.remove_legacy_seed_listings(db)
            items = db.execute("SELECT id, title FROM items").fetchall()
        finally:
            db.close()

        self.assertEqual(removed, 2)
        self.assertEqual([(item["id"], item["title"]) for item in items],
                         [(real_item["id"], "Anuncio de una persona")])

    def test_cleanup_includes_historical_system_accounts_on_bootstrap(self):
        real_item = self.publish(title="Anuncio real")
        db = backend.connect_db()
        try:
            for email in backend.LEGACY_SEED_OWNER_EMAILS:
                cur = db.execute(
                    "INSERT INTO users (name, email, password_hash, campus, created_at) "
                    "VALUES (?, ?, ?, ?, ?) RETURNING id",
                    ("Equipo histórico", email, "hash", "vigo", backend.now_iso()),
                )
                db.execute(
                    "INSERT INTO items (owner_id, title, description, category, condition, "
                    "exchange_type, campus, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (backend.inserted_id(cur), "Muestra", "", "libros", "bueno",
                     "regalar", "vigo", backend.now_iso()),
                )
            db.commit()
        finally:
            db.close()

        backend.bootstrap(force=True)
        backend.bootstrap(force=True)  # idempotente
        db = backend.connect_db()
        try:
            items = db.execute("SELECT id FROM items").fetchall()
        finally:
            db.close()
        self.assertEqual([item["id"] for item in items], [real_item["id"]])

    # -- almacenamiento --------------------------------------------------
    def test_upload_is_optimised_and_survives_a_redeploy(self):
        res = self.upload(png_bytes((2400, 1600)))
        self.assertEqual(res.status_code, 201, res.get_json())
        payload = res.get_json()
        url = payload["url"]
        self.assertTrue(url.endswith(".webp"), url)
        self.assertEqual(payload["content_type"], "image/webp")
        self.assertLessEqual(payload["bytes"], backend.MAX_IMAGE_BYTES)

        # No se escribe nada en disco: el contenedor de Render puede reciclarse.
        self.assertEqual(os.listdir(self.upload_dir.name), [])

        served = self.client.get(url)
        self.assertEqual(served.status_code, 200)
        self.assertEqual(served.content_type, "image/webp")
        self.assertIn("immutable", served.headers["Cache-Control"])
        image = Image.open(io.BytesIO(served.data))
        self.assertEqual(image.format, "WEBP")
        self.assertLessEqual(max(image.size), backend.MAX_IMAGE_DIMENSION)

        etag = served.headers["ETag"]
        self.assertEqual(self.client.get(url, headers={"If-None-Match": etag}).status_code, 304)

        # Simula un despliegue: la fila de la base sigue sirviendo la imagen.
        self.client.get(url)
        self.assertEqual(self.client.get(url).status_code, 200)

    def test_upload_rejects_gif_and_non_images(self):
        gif = self.upload(b"GIF89a" + b"\x00" * 32, "x.gif")
        self.assertEqual(gif.status_code, 400)
        self.assertEqual(gif.get_json()["error"], "invalid_type")

        fake = self.upload(b"esto no es una imagen", "x.png")
        self.assertEqual(fake.status_code, 400)
        self.assertEqual(fake.get_json()["error"], "invalid_type")

    def test_legacy_files_are_imported_and_media_can_be_deleted(self):
        legacy = os.path.join(self.upload_dir.name, "antigua.jpg")
        image = Image.new("RGB", (640, 480), (200, 100, 50))
        image.save(legacy, format="JPEG")
        imported = backend.sync_uploads_to_db()
        self.assertEqual(imported, 1)
        self.assertEqual(backend.sync_uploads_to_db(), 0)  # idempotente

        os.remove(legacy)  # el disco efímero se vació
        self.assertEqual(self.client.get("/static/uploads/antigua.jpg").status_code, 200)
        self.assertTrue(backend.remove_uploaded_file("/static/uploads/antigua.jpg"))
        self.assertEqual(self.client.get("/static/uploads/antigua.jpg").status_code, 404)

    # -- listados --------------------------------------------------------
    def test_catalog_is_paginated(self):
        for i in range(30):
            self.publish(f"Objeto {i:02d}")

        first = self.client.get("/api/items?limit=10").get_json()
        self.assertEqual(len(first["items"]), 10)
        self.assertEqual(first["total"], 30)
        self.assertTrue(first["has_more"])
        self.assertEqual(first["offset"], 0)

        last = self.client.get("/api/items?limit=10&offset=28").get_json()
        self.assertEqual(len(last["items"]), 2)
        self.assertFalse(last["has_more"])

        defaults = self.client.get("/api/items").get_json()
        self.assertEqual(defaults["limit"], backend.DEFAULT_PAGE_SIZE)
        self.assertEqual(self.client.get("/api/items?limit=9999").get_json()["limit"],
                         backend.MAX_PAGE_SIZE)
        clamped = self.client.get("/api/items?limit=abc&offset=-40").get_json()
        self.assertEqual(clamped["offset"], 0)
        self.assertEqual(clamped["limit"], backend.DEFAULT_PAGE_SIZE)

    def test_my_items_returns_only_my_listings(self):
        mine = self.publish("Mi objeto")
        other_token = self.register("Bruno", "bruno@example.com")
        self.client.post("/api/items", json={
            "title": "Su objeto", "category": "ropa", "exchange_type": "regalar",
            "image_url": "/static/img/items/ropa.jpg", "private_seller": True,
        }, headers={"Authorization": f"Bearer {other_token}"})

        data = self.client.get("/api/items/mine", headers=self.headers).get_json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["items"][0]["id"], mine["id"])
        self.assertEqual(self.client.get("/api/items/mine").status_code, 401)

    # -- caché y compresión ---------------------------------------------
    def test_healthz_is_lightweight(self):
        res = self.client.get("/healthz")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["ok"])
        self.assertEqual(res.headers["Cache-Control"], "no-store")

    def test_text_responses_are_compressed(self):
        home = self.client.get("/", headers={"Accept-Encoding": "gzip"})
        self.assertEqual(home.headers.get("Content-Encoding"), "gzip")
        self.assertIn("stale-while-revalidate", home.headers["Cache-Control"])

        for i in range(3):
            self.publish(f"Objeto comprimible {i}")
        payload = self.client.get("/api/items", headers={"Accept-Encoding": "gzip"})
        self.assertEqual(payload.headers.get("Content-Encoding"), "gzip")
        self.assertEqual(payload.headers.get("Vary"), "Accept-Encoding")

        icon = self.client.get("/favicon.ico", headers={"Accept-Encoding": "gzip"})
        self.assertNotIn("Content-Encoding", icon.headers)
        icon.close()

    def test_assets_have_versioned_cache_and_revalidation(self):
        css = self.client.get("/static/css/style.css", headers={"Accept-Encoding": "gzip"})
        self.assertEqual(css.status_code, 200)
        self.assertEqual(css.headers.get("Content-Encoding"), "gzip")
        self.assertIn("immutable", css.headers["Cache-Control"])
        etag = css.headers["ETag"]
        again = self.client.get("/static/css/style.css",
                                headers={"Accept-Encoding": "gzip", "If-None-Match": etag})
        self.assertEqual(again.status_code, 304)

        plain = self.client.get("/static/css/style.css")
        self.assertNotIn("Content-Encoding", plain.headers)
        self.assertNotEqual(plain.headers["ETag"], etag)

    def test_every_client_asset_is_fingerprinted_and_immutable(self):
        """Guarda contra el olvido: `?v=` e inmutabilidad van siempre juntos."""
        self.assertEqual(set(backend.ASSET_TYPES), set(backend.CLIENT_ASSETS))
        html = self.client.get("/").get_data(as_text=True)
        for rel in backend.CLIENT_ASSETS:
            self.assertIn(f"/static/{rel}?v=", html, rel)
            res = self.client.get(f"/static/{rel}", headers={"Accept-Encoding": "gzip"})
            self.assertEqual(res.status_code, 200, rel)
            self.assertIn("immutable", res.headers["Cache-Control"], rel)
            self.assertTrue(res.headers.get("ETag"), rel)
            conditional = self.client.get(
                f"/static/{rel}",
                headers={"Accept-Encoding": "gzip", "If-None-Match": res.headers["ETag"]},
            )
            self.assertEqual(conditional.status_code, 304, rel)
            # Mismo mecanismo de invalidación para todos: si un día se sirve sin
            # `?v=` la caché inmutable quedaría apuntando al fichero viejo.
            self.assertEqual(
                res.headers["Cache-Control"],
                "public, max-age=31536000, immutable",
                rel,
            )

    def test_boot_theme_script_is_versioned_and_immutable(self):
        """El arranque del tema se carga como fichero externo (CSP).

        Un `<script>` inline no se ejecutaría con `script-src 'self'`, así que
        la plantilla debe referenciar `/static/js/theme.js?v=<huella>` y ese
        fichero debe servirse comprimido, con ETag y caché inmutable.
        """
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn("/static/js/theme.js?v=", html)
        self.assertNotIn("<script>(function", html)

        asset = self.client.get("/static/js/theme.js", headers={"Accept-Encoding": "gzip"})
        self.assertEqual(asset.status_code, 200)
        self.assertEqual(asset.headers.get("Content-Encoding"), "gzip")
        self.assertIn("immutable", asset.headers["Cache-Control"])
        again = self.client.get("/static/js/theme.js", headers={
            "Accept-Encoding": "gzip", "If-None-Match": asset.headers["ETag"],
        })
        self.assertEqual(again.status_code, 304)

    def test_unknown_spa_path_is_a_real_404(self):
        """La SPA se pinta, pero el código de estado no miente."""
        ghost = self.client.get("/esta-ruta-no-existe")
        self.assertEqual(ghost.status_code, 404)
        self.assertIn(b"<!doctype html>", ghost.get_data().lower()[:400])

        api_ghost = self.client.get("/api/esta-ruta-no-existe")
        self.assertEqual(api_ghost.status_code, 404)
        self.assertEqual(api_ghost.get_json()["error"], "not_found")

    def test_personalized_api_responses_are_never_shared_or_stale(self):
        """Sin `Cache-Control`, una caché intermedia podría guardar la versión
        de otro: las llamadas autenticadas se revalidan siempre y no son
        cacheables en compartido; las anónimas tampoco caducan solas."""
        anon = self.client.get("/api/items")
        self.assertEqual(anon.headers["Cache-Control"], "public, no-cache")

        token = self.register("Caché", "cache@example.com")
        mine = self.client.get("/api/items", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(mine.headers["Cache-Control"], "private, no-cache")
        self.assertIn("Authorization", ", ".join(mine.headers.getlist("Vary")))

        # Una escritura nunca deja rastro cacheable.
        created = self.client.post("/api/items", json={
            "title": "Objeto transitorio", "category": "ropa",
            "exchange_type": "regalar",
            "image_url": "/static/img/items/ropa.jpg", "private_seller": True,
        }, headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.headers["Cache-Control"], "no-store")

        # `/api/stats` sigue anunciando su propia ventana corta: la política por
        # defecto no debe pisar la que decide la ruta.
        stats = self.client.get("/api/stats")
        self.assertIn("max-age", stats.headers["Cache-Control"])

        # Los errores tampoco quedan cacheables: un 404 de un objeto retirado no
        # puede sobrevivir a su restauración.
        missing = self.client.get("/api/items/424242")
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(missing.headers["Cache-Control"], "no-store")
        private_list = self.client.get("/api/favorites", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(private_list.status_code, 200)
        self.assertEqual(private_list.headers["Cache-Control"], "private, no-cache")

    def test_indexable_files_ignore_a_hostile_host(self):
        """`robots.txt` y `sitemap.xml` no copian un `Host` inventado."""
        honest = self.client.get("/robots.txt", environ_overrides={"HTTP_HOST": "campus-circular.example"})
        self.assertIn("http://campus-circular.example/sitemap.xml", honest.text)

        hostile_host = "evil.example/@injected"
        robots = self.client.get("/robots.txt", environ_overrides={"HTTP_HOST": hostile_host})
        self.assertEqual(robots.status_code, 200)
        self.assertIn(backend.DEFAULT_SITE_ROOT, robots.text)
        self.assertNotIn("evil.example", robots.text)

        xml = self.client.get("/sitemap.xml", environ_overrides={"HTTP_HOST": hostile_host})
        self.assertNotIn("evil.example", xml.text)
        self.assertIn("<urlset", xml.text)

        with mock.patch.dict(os.environ, {"PUBLIC_URL": "https://aviso.example.org/"}):
            pinned = self.client.get("/sitemap.xml", environ_overrides={"HTTP_HOST": hostile_host})
        self.assertIn("<loc>https://aviso.example.org/</loc>", pinned.text)

    def test_stats_cache_can_be_invalidated(self):
        backend.app.config["TESTING"] = False
        before = self.client.get("/api/stats").get_json()["total_items"]
        self.publish("Nuevo objeto")
        after = self.client.get("/api/stats").get_json()["total_items"]
        self.assertEqual(after, before + 1)
        self.assertIn("max-age", self.client.get("/api/stats").headers["Cache-Control"])


if __name__ == "__main__":
    unittest.main()


class ConcurrentBootTests(unittest.TestCase):
    """Gunicorn arranca varios workers: el sembrado no debe chocar."""

    def test_seed_is_serialised_between_workers(self):
        import threading

        with tempfile.TemporaryDirectory(prefix="cc-boot-") as tmp:
            original_database = backend.DATABASE
            original_seed = backend.SEED_DEMO
            backend.DATABASE = os.path.join(tmp, "boot.sqlite")
            backend.SEED_DEMO = True
            try:
                backend.init_db()
                backend.migrate_db()
                errors = []

                def worker():
                    try:
                        backend.seed_if_empty()
                    except Exception as exc:  # noqa: BLE001
                        errors.append(exc)

                threads = [threading.Thread(target=worker) for _ in range(4)]
                for thread in threads:
                    thread.start()
                for thread in threads:
                    thread.join(30)

                self.assertEqual(errors, [])
                db = backend.connect_db()
                try:
                    users = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
                    items = db.execute("SELECT COUNT(*) c FROM items").fetchone()["c"]
                finally:
                    db.close()
                self.assertEqual(users, 1 + len(backend.SEED_PEERS))
                self.assertEqual(items, 0, "el modo demo no debe crear anuncios ficticios")

                # Repetir el sembrado no duplica nada.
                backend.seed_if_empty()
                db = backend.connect_db()
                try:
                    self.assertEqual(
                        db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"], users)
                    self.assertEqual(
                        db.execute("SELECT COUNT(*) c FROM items").fetchone()["c"], items)
                finally:
                    db.close()
            finally:
                backend.DATABASE = original_database
                backend.SEED_DEMO = original_seed
