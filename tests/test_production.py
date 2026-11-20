"""Producción: almacenamiento persistente, optimización, paginación y caché."""

import io
import os
import tempfile
import unittest

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
                self.assertGreaterEqual(items, len(backend.SEED_ITEMS))

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
