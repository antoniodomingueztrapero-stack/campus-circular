"""Regression tests for registration persistence and authentication safety."""

import os
import sqlite3
import tempfile
import unittest

_TEST_HOME = tempfile.TemporaryDirectory(prefix="campus-circular-tests-")
os.environ["DATABASE"] = os.path.join(_TEST_HOME.name, "bootstrap.db")
os.environ["SEED_DEMO"] = "0"

import app as backend  # noqa: E402


class AuthPersistenceTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-auth-")
        backend.DATABASE = os.path.join(self.db_dir.name, "accounts.sqlite")
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True)
        self.client = backend.app.test_client()

    def tearDown(self):
        self.db_dir.cleanup()

    @staticmethod
    def registration_payload(**overrides):
        payload = {
            "name": "Ada Lovelace",
            "email": "ada@example.org",
            "password": "a-correct-horse-battery",
            "campus": "vigo",
            "consent": True,
        }
        payload.update(overrides)
        return payload

    def test_registration_persists_user_and_hashed_session(self):
        response = self.client.post("/api/auth/register", json=self.registration_payload())
        self.assertEqual(response.status_code, 201, response.get_json())
        result = response.get_json()

        # Reopen the database independently, as a separate request/process would.
        with sqlite3.connect(backend.DATABASE) as db:
            user = db.execute(
                "SELECT email, password_hash FROM users WHERE email = ?",
                ("ada@example.org",),
            ).fetchone()
            stored_token = db.execute("SELECT token FROM sessions").fetchone()[0]
        self.assertIsNotNone(user)
        self.assertNotEqual(user[1], self.registration_payload()["password"])
        self.assertNotEqual(stored_token, result["token"])

        me = self.client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {result['token']}"}
        )
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()["user"]["email"], "ada@example.org")

    def test_registered_user_can_log_in_again(self):
        self.client.post("/api/auth/register", json=self.registration_payload())
        response = self.client.post(
            "/api/auth/login",
            json={"email": "ADA@example.org", "password": "a-correct-horse-battery"},
        )
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(response.get_json()["user"]["email"], "ada@example.org")

    def test_duplicate_registration_does_not_create_another_account(self):
        self.client.post("/api/auth/register", json=self.registration_payload())
        response = self.client.post("/api/auth/register", json=self.registration_payload())
        self.assertEqual(response.status_code, 409)
        with sqlite3.connect(backend.DATABASE) as db:
            count = db.execute("SELECT COUNT(*) FROM users WHERE email = ?", ("ada@example.org",)).fetchone()[0]
            sessions = db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        self.assertEqual(count, 1)
        self.assertEqual(sessions, 1)

    def test_failed_session_write_rolls_back_account_creation(self):
        with sqlite3.connect(backend.DATABASE) as db:
            db.execute(
                "CREATE TRIGGER reject_session BEFORE INSERT ON sessions "
                "BEGIN SELECT RAISE(ABORT, 'simulated storage failure'); END"
            )
        response = self.client.post("/api/auth/register", json=self.registration_payload())
        self.assertEqual(response.status_code, 500)
        with sqlite3.connect(backend.DATABASE) as db:
            count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        self.assertEqual(count, 0)

    def test_invalid_types_are_rejected_without_server_error(self):
        for body in ([], {"name": ["not", "a", "string"]}, {"email": "x", "password": {}}):
            with self.subTest(body=body):
                response = self.client.post("/api/auth/register", json=body)
                self.assertEqual(response.status_code, 400)

    def test_legacy_plaintext_session_is_migrated_without_logging_user_out(self):
        created = self.client.post("/api/auth/register", json=self.registration_payload()).get_json()
        with sqlite3.connect(backend.DATABASE) as db:
            db.execute("UPDATE sessions SET token = ?", (created["token"],))
            db.commit()
        backend.migrate_db()

        response = self.client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {created['token']}"}
        )
        self.assertEqual(response.status_code, 200)
        with sqlite3.connect(backend.DATABASE) as db:
            stored = db.execute("SELECT token FROM sessions").fetchone()[0]
        self.assertNotEqual(stored, created["token"])


if __name__ == "__main__":
    unittest.main()
