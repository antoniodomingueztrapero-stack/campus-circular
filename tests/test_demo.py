"""Modo demo para la exposición: cuenta temporal, sin registro ni coste."""

import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


class DemoModeTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-demo-")
        backend.DATABASE = os.path.join(self.db_dir.name, "demo.sqlite")
        backend.SEED_DEMO = True
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True, RATE_LIMIT_ENABLED=False)
        backend.reset_rate_limits()
        self.client = backend.app.test_client()

    def tearDown(self):
        backend.SEED_DEMO = os.environ.get("SEED_DEMO", "1") != "0"
        backend.app.config["TESTING"] = False
        backend.app.config.pop("RATE_LIMIT_ENABLED", None)
        backend.reset_rate_limits()
        self.db_dir.cleanup()

    def test_demo_opens_a_working_session(self):
        res = self.client.post("/api/auth/demo")
        self.assertEqual(res.status_code, 201, res.get_json())
        data = res.get_json()
        self.assertTrue(data["demo"])
        self.assertTrue(data["token"])
        self.assertTrue(data["user"]["email"].endswith("@" + backend.DEMO_EMAIL_DOMAIN))
        self.assertEqual(data["user"]["campus"], "vigo")

        headers = {"Authorization": f"Bearer {data['token']}"}
        me = self.client.get("/api/auth/me", headers=headers).get_json()["user"]
        self.assertEqual(me["id"], data["user"]["id"])
        self.assertTrue(me["consent_ok"])

    def test_demo_account_can_publish_and_edit_out_of_the_box(self):
        headers = {"Authorization": f"Bearer {self.client.post('/api/auth/demo').get_json()['token']}"}
        created = self.client.post("/api/items", json={
            "title": "Prueba en el congreso", "category": "libros",
            "exchange_type": "regalar", "private_seller": True,
            "image_url": "/static/img/items/libros-480.webp",
        }, headers=headers)
        self.assertEqual(created.status_code, 201, created.get_json())
        item_id = created.get_json()["item"]["id"]

        edited = self.client.patch(f"/api/items/{item_id}", headers=headers,
                                   json={"title": "Probado y editado", "status": "reservado"})
        self.assertEqual(edited.status_code, 200, edited.get_json())
        item = edited.get_json()["item"]
        self.assertEqual((item["title"], item["status"]), ("Probado y editado", "reservado"))

    def test_each_visitor_gets_a_different_account(self):
        first = self.client.post("/api/auth/demo").get_json()
        second = self.client.post("/api/auth/demo").get_json()
        self.assertNotEqual(first["user"]["id"], second["user"]["id"])
        self.assertNotEqual(first["user"]["email"], second["user"]["email"])

        # El objeto de una persona no aparece en el área de la otra.
        self.client.post("/api/items", json={
            "title": "Objeto privado de la demo", "category": "libros",
            "exchange_type": "regalar", "private_seller": True,
            "image_url": "/static/img/items/libros-480.webp",
        }, headers={"Authorization": f"Bearer {first['token']}"})
        mine = self.client.get("/api/items/mine",
                               headers={"Authorization": f"Bearer {second['token']}"})
        self.assertEqual(mine.get_json()["items"], [])

    def test_demo_is_disabled_without_seed_demo(self):
        backend.SEED_DEMO = False
        self.assertEqual(self.client.post("/api/auth/demo").status_code, 404)
        self.assertFalse(backend.boot_config()["demoMode"])
        backend.SEED_DEMO = True
        self.assertTrue(backend.boot_config()["demoMode"])

    def test_old_demo_accounts_are_cleaned_up(self):
        old = self.client.post("/api/auth/demo").get_json()
        stale = (datetime.now(timezone.utc) - timedelta(hours=backend.DEMO_TTL_HOURS + 1)).isoformat()
        db = backend.connect_db()
        try:
            db.execute("UPDATE users SET created_at = ? WHERE id = ?", (stale, old["user"]["id"]))
            db.commit()
        finally:
            db.close()

        self.client.post("/api/auth/demo")
        db = backend.connect_db()
        try:
            row = db.execute("SELECT 1 FROM users WHERE id = ?", (old["user"]["id"],)).fetchone()
        finally:
            db.close()
        self.assertIsNone(row, "la cuenta demo caducada debería haberse borrado")

    def test_published_items_survive_when_the_demo_account_expires(self):
        """El catálogo es compartido: lo que sube un visitante no desaparece."""
        visitor = self.client.post("/api/auth/demo").get_json()
        headers = {"Authorization": f"Bearer {visitor['token']}"}
        created = self.client.post("/api/items", json={
            "title": "Estantería del congreso", "category": "muebles",
            "exchange_type": "regalar", "private_seller": True,
            "image_url": "/static/img/items/muebles-480.webp",
        }, headers=headers).get_json()["item"]

        stale = (datetime.now(timezone.utc) - timedelta(hours=backend.DEMO_TTL_HOURS + 2)).isoformat()
        db = backend.connect_db()
        try:
            db.execute("UPDATE users SET created_at = ? WHERE id = ?", (stale, visitor["user"]["id"]))
            db.commit()
        finally:
            db.close()

        self.client.post("/api/auth/demo")  # dispara la limpieza

        public = self.client.get("/api/items?limit=60").get_json()["items"]
        self.assertIn(created["id"], [i["id"] for i in public],
                      "el objeto debe seguir en el catálogo después de caducar la cuenta")

        db = backend.connect_db()
        try:
            row = db.execute("SELECT u.email FROM items i JOIN users u ON u.id = i.owner_id "
                             "WHERE i.id = ?", (created["id"],)).fetchone()
        finally:
            db.close()
        self.assertEqual(row["email"], backend.SEED_OWNER["email"],
                         "el objeto pasa a la cuenta de muestra, no se borra")

    def test_everyone_sees_what_others_publish(self):
        first = self.client.post("/api/auth/demo").get_json()
        second = self.client.post("/api/auth/demo").get_json()
        created = self.client.post("/api/items", json={
            "title": "Apuntes compartidos en la demo", "category": "libros",
            "exchange_type": "regalar", "private_seller": True,
            "image_url": "/static/img/items/libros-480.webp",
        }, headers={"Authorization": f"Bearer {first['token']}"}).get_json()["item"]

        # Sin sesión y con la sesión de otra persona: el catálogo es el mismo.
        for headers in ({}, {"Authorization": f"Bearer {second['token']}"}):
            page = self.client.get("/api/items?limit=60", headers=headers).get_json()
            self.assertIn(created["id"], [i["id"] for i in page["items"]])

        detail = self.client.get(f"/api/items/{created['id']}").get_json()["item"]
        self.assertEqual(detail["title"], "Apuntes compartidos en la demo")

        # Pero solo el dueño lo puede editar.
        res = self.client.patch(f"/api/items/{created['id']}",
                                json={"title": "Secuestrado"},
                                headers={"Authorization": f"Bearer {second['token']}"})
        self.assertEqual(res.status_code, 403)

    def test_demo_rate_limited(self):
        backend.app.config["RATE_LIMIT_ENABLED"] = True
        backend.reset_rate_limits()
        codes = [self.client.post("/api/auth/demo").status_code
                 for _ in range(backend.RATE_LIMITS["demo"][0] + 2)]
        self.assertIn(429, codes)


if __name__ == "__main__":
    unittest.main()
