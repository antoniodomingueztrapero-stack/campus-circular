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

    def test_demo_rate_limited(self):
        backend.app.config["RATE_LIMIT_ENABLED"] = True
        backend.reset_rate_limits()
        codes = [self.client.post("/api/auth/demo").status_code
                 for _ in range(backend.RATE_LIMITS["demo"][0] + 2)]
        self.assertIn(429, codes)


if __name__ == "__main__":
    unittest.main()
