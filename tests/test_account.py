"""Contraseña: cambio desde la cuenta, política mínima y cierre de sesiones."""

import os
import tempfile
import unittest

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


class PasswordTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-pass-")
        backend.DATABASE = os.path.join(self.db_dir.name, "password.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True, RATE_LIMIT_ENABLED=False)
        backend.reset_rate_limits()
        self.client = backend.app.test_client()
        self.email = "clave@uvigo.gal"
        res = self.client.post("/api/auth/register", json={
            "name": "Cuenta Clave", "email": self.email,
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

    def login(self, password):
        res = self.client.post("/api/auth/login", json={"email": self.email, "password": password})
        return res.status_code, (res.get_json() or {}).get("token")

    def change(self, current, new):
        return self.client.post("/api/account/password", headers=self.headers,
                                json={"current_password": current, "new_password": new})

    def test_password_change_and_old_password_stops_working(self):
        res = self.change("password1234", "una-frase-larga-2026")
        self.assertEqual(res.status_code, 200, res.get_json())
        self.assertIn("sessions_closed", res.get_json())

        self.assertEqual(self.login("password1234")[0], 401)
        status, token = self.login("una-frase-larga-2026")
        self.assertEqual(status, 200)
        self.assertTrue(token)

        # La sesión desde la que se cambió sigue viva.
        self.assertEqual(self.client.get("/api/auth/me", headers=self.headers).status_code, 200)

    def test_other_sessions_are_closed_on_change(self):
        _, other = self.login("password1234")
        self.assertTrue(other)
        res = self.change("password1234", "otra-frase-larga-2026")
        self.assertGreaterEqual(res.get_json()["sessions_closed"], 1)
        stale = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {other}"})
        self.assertIsNone(stale.get_json()["user"])
        fresh = self.client.get("/api/auth/me", headers=self.headers)
        self.assertIsNotNone(fresh.get_json()["user"])

    def test_password_change_rejects_bad_input(self):
        self.assertEqual(self.change("incorrecta123", "otra-frase-larga-2026").status_code, 403)
        self.assertEqual(self.change("password1234", "password1234").status_code, 400)
        self.assertEqual(self.change("password1234", "corta").status_code, 400)
        # Contraseña de la lista negra y contraseña igual al correo.
        self.assertEqual(self.change("password1234", "1234567890").status_code, 400)
        self.assertEqual(self.change("password1234", "clave").status_code, 400)
        self.assertEqual(self.client.post("/api/account/password", json={},
                                          headers=self.headers).status_code, 400)
        self.assertEqual(self.client.post("/api/account/password",
                                          json={"current_password": "password1234"}).status_code, 401)

        # Nada de lo rechazado ha cambiado la contraseña.
        self.assertEqual(self.login("password1234")[0], 200)

    def test_registration_rejects_common_passwords(self):
        for weak in ("12345678", "password", "qwerty123"):
            res = self.client.post("/api/auth/register", json={
                "name": "Cuenta Débil", "email": f"{weak}@example.org",
                "password": weak, "campus": "vigo", "consent": True,
            })
            self.assertEqual(res.status_code, 400, weak)
            self.assertEqual(res.get_json()["error"], "weak_password", weak)

    def test_password_change_rate_limited(self):
        backend.app.config["RATE_LIMIT_ENABLED"] = True
        backend.reset_rate_limits()
        codes = [self.change("incorrecta123", "otra-frase-larga-2026").status_code for _ in range(7)]
        self.assertIn(429, codes)


if __name__ == "__main__":
    unittest.main()
