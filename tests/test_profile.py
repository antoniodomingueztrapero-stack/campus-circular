"""Perfil: edición de nombre y campus desde la propia cuenta."""

import os
import tempfile
import unittest

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-profile-")
        backend.DATABASE = os.path.join(self.db_dir.name, "perfil.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True, RATE_LIMIT_ENABLED=False)
        self.client = backend.app.test_client()
        res = self.client.post("/api/auth/register", json={
            "name": "Nombre Antiguo", "email": "perfil@uvigo.gal",
            "password": "password1234", "campus": "vigo", "consent": True,
        })
        self.assertEqual(res.status_code, 201, res.get_json())
        self.token = res.get_json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        backend.app.config["TESTING"] = False
        backend.app.config.pop("RATE_LIMIT_ENABLED", None)
        backend.reset_rate_limits()
        self.db_dir.cleanup()

    def test_profile_updates_name_and_campus(self):
        res = self.client.patch("/api/account/profile",
                                json={"name": "  Nombre   Nuevo ", "campus": "ourense"},
                                headers=self.headers)
        self.assertEqual(res.status_code, 200, res.get_json())
        user = res.get_json()["user"]
        self.assertEqual(user["name"], "Nombre Nuevo")
        self.assertEqual(user["campus"], "ourense")

        # Persistido: se ve en la sesión y al volver a entrar.
        me = self.client.get("/api/auth/me", headers=self.headers).get_json()["user"]
        self.assertEqual((me["name"], me["campus"]), ("Nombre Nuevo", "ourense"))
        login = self.client.post("/api/auth/login", json={
            "email": "perfil@uvigo.gal", "password": "password1234"})
        self.assertEqual(login.get_json()["user"]["name"], "Nombre Nuevo")

    def test_profile_validates_input(self):
        for payload in ({"name": "A"}, {"campus": "madrid"}, {}):
            res = self.client.patch("/api/account/profile", json=payload, headers=self.headers)
            self.assertEqual(res.status_code, 400, payload)
        self.assertEqual(self.client.patch("/api/account/profile", data="no json",
                                           headers=self.headers).status_code, 400)
        self.assertEqual(self.client.patch("/api/account/profile",
                                           json={"name": "Otro"},
                                           content_type="text/plain",
                                           headers=self.headers).status_code, 400)

        # El texto se recorta en lugar de fallar: nunca supera el máximo.
        long_name = self.client.patch("/api/account/profile", json={"name": "x" * 90},
                                      headers=self.headers)
        self.assertEqual(long_name.status_code, 200)
        self.assertEqual(len(long_name.get_json()["user"]["name"]), 60)

    def test_profile_requires_session(self):
        self.assertEqual(self.client.patch("/api/account/profile",
                                           json={"name": "Intruso"}).status_code, 401)

    def test_profile_ignores_privileged_fields(self):
        res = self.client.patch("/api/account/profile", json={
            "name": "Nombre Válido", "email": "otro@example.org",
            "verified": True, "id": 999, "consent_at": "2020-01-01T00:00:00+00:00",
        }, headers=self.headers)
        self.assertEqual(res.status_code, 200, res.get_json())
        user = res.get_json()["user"]
        self.assertEqual(user["email"], "perfil@uvigo.gal")
        self.assertEqual(user["id"], 1)
        db = backend.connect_db()
        try:
            row = db.execute("SELECT verified FROM users WHERE id = 1").fetchone()
        finally:
            db.close()
        self.assertEqual(row["verified"], 1 if backend.is_university_email("perfil@uvigo.gal") else 0)


if __name__ == "__main__":
    unittest.main()
