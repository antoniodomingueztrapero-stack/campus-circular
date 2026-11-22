"""P0: arranque sin efectos al importar, errores de BD, concurrencia de la
máquina de estados, búsqueda con comodines, moderación reversible y borrado
de cuenta sin destruir historial ajeno."""

import os
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


class P0TestBase(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-p0-")
        self.upload_dir = tempfile.TemporaryDirectory(prefix="cc-p0-up-")
        self.original_upload_dir = backend.UPLOAD_DIR
        backend.UPLOAD_DIR = self.upload_dir.name
        backend.DATABASE = os.path.join(self.db_dir.name, "p0.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True, RATE_LIMIT_ENABLED=False)
        backend.reset_rate_limits()
        self.client = backend.app.test_client()

    def tearDown(self):
        backend.UPLOAD_DIR = self.original_upload_dir
        backend.ADMIN_EMAILS = frozenset()
        backend.app.config["TESTING"] = False
        backend.app.config.pop("RATE_LIMIT_ENABLED", None)
        backend.reset_rate_limits()
        self.db_dir.cleanup()
        self.upload_dir.cleanup()

    def register(self, name, email):
        res = self.client.post("/api/auth/register", json={
            "name": name, "email": email, "password": "password1234",
            "campus": "vigo", "consent": True,
        })
        self.assertEqual(res.status_code, 201, res.get_json())
        data = res.get_json()
        return data["token"], data["user"]["id"]

    def auth(self, token):
        return {"Authorization": f"Bearer {token}"}

    def publish(self, token, title="Objeto de prueba", **extra):
        payload = {
            "title": title, "category": "libros", "exchange_type": "regalar",
            "image_url": "/static/img/items/libros.jpg", "private_seller": True,
        }
        payload.update(extra)
        res = self.client.post("/api/items", json=payload, headers=self.auth(token))
        self.assertEqual(res.status_code, 201, res.get_json())
        return res.get_json()["item"]


class BootstrapTests(unittest.TestCase):
    """Importar `app` no debe crear ni tocar la base de datos ni el disco."""

    def test_import_has_no_database_side_effects(self):
        with tempfile.TemporaryDirectory(prefix="cc-p0-import-") as tmp:
            db_path = os.path.join(tmp, "nueva.sqlite")
            env = dict(os.environ, DATABASE=db_path, SEED_DEMO="0")
            root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            proc = subprocess.run(
                [sys.executable, "-c", "import app"],
                cwd=root, env=env, capture_output=True, text=True, timeout=120,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertFalse(os.path.exists(db_path),
                             "importar app no debe crear la base de datos")

    def test_first_request_bootstraps_lazily(self):
        with tempfile.TemporaryDirectory(prefix="cc-p0-lazy-") as tmp:
            original_db = backend.DATABASE
            original_seed = backend.SEED_DEMO
            try:
                backend.DATABASE = os.path.join(tmp, "lazy.sqlite")
                backend.SEED_DEMO = False
                backend.app.config.update(TESTING=True, RATE_LIMIT_ENABLED=False)
                client = backend.app.test_client()
                res = client.get("/api/items")
                self.assertEqual(res.status_code, 200, res.get_json())
                self.assertTrue(os.path.exists(backend.DATABASE),
                                "la primera petición debe inicializar el esquema")
            finally:
                backend.DATABASE = original_db
                backend.SEED_DEMO = original_seed
                backend.reset_rate_limits()


class SearchEscapeTests(P0TestBase):
    def test_escape_like_escapes_wildcards(self):
        self.assertEqual(backend.escape_like("100%_a\\b"), "100\\%\\_a\\\\b")

    def test_wildcard_characters_are_literal(self):
        token, _ = self.register("Ana", "ana@uvigo.gal")
        self.publish(token, title="Lámpara de estudio")
        # `%` y `_` no son comodines: no deben coincidir con el catálogo entero.
        for q in ("%", "_", "100%", "a_b"):
            res = self.client.get("/api/items", query_string={"q": q})
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.get_json()["total"], 0, q)
        # La búsqueda normal sigue funcionando (sin distinguir acentos).
        res = self.client.get("/api/items", query_string={"q": "lampara"})
        self.assertEqual(res.get_json()["total"], 1)


class RequestStateMachineTests(P0TestBase):
    def test_duplicate_pending_request_rejected(self):
        owner_token, _ = self.register("Ana", "ana@uvigo.gal")
        other_token, _ = self.register("Bruno", "bruno@example.org")
        item = self.publish(owner_token)
        first = self.client.post(f"/api/items/{item['id']}/request", json={},
                                 headers=self.auth(other_token))
        self.assertEqual(first.status_code, 201, first.get_json())
        second = self.client.post(f"/api/items/{item['id']}/request", json={},
                                  headers=self.auth(other_token))
        self.assertEqual(second.status_code, 409)
        self.assertEqual(second.get_json()["error"], "already_requested")

    def test_pending_unique_index_enforced_by_database(self):
        owner_token, _ = self.register("Ana", "ana@uvigo.gal")
        other_token, other_id = self.register("Bruno", "bruno@example.org")
        item = self.publish(owner_token)
        self.client.post(f"/api/items/{item['id']}/request", json={},
                         headers=self.auth(other_token))
        db = backend.connect_db()
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute(
                "INSERT INTO requests (item_id, requester_id, message, handover_point, "
                "status, created_at) VALUES (?, ?, '', '', 'pendiente', ?)",
                (item["id"], other_id, backend.now_iso()),
            )
        db.close()

    def test_second_concurrent_acceptance_conflicts(self):
        owner_token, _ = self.register("Ana", "ana@uvigo.gal")
        b_token, _ = self.register("Bruno", "bruno@example.org")
        c_token, _ = self.register("Carla", "carla@example.org")
        item = self.publish(owner_token)
        r1 = self.client.post(f"/api/items/{item['id']}/request", json={},
                              headers=self.auth(b_token)).get_json()["request"]
        r2 = self.client.post(f"/api/items/{item['id']}/request", json={},
                              headers=self.auth(c_token)).get_json()["request"]
        ok = self.client.patch(f"/api/requests/{r1['id']}", json={"status": "aceptada"},
                               headers=self.auth(owner_token))
        self.assertEqual(ok.status_code, 200, ok.get_json())
        conflict = self.client.patch(f"/api/requests/{r2['id']}", json={"status": "aceptada"},
                                     headers=self.auth(owner_token))
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(conflict.get_json()["error"], "already_reserved")

    def test_toggle_favorite_is_atomic(self):
        owner_token, _ = self.register("Ana", "ana@uvigo.gal")
        other_token, _ = self.register("Bruno", "bruno@example.org")
        item = self.publish(owner_token)
        first = self.client.post(f"/api/items/{item['id']}/favorite",
                                 headers=self.auth(other_token))
        second = self.client.post(f"/api/items/{item['id']}/favorite",
                                  headers=self.auth(other_token))
        self.assertEqual(first.get_json()["is_favorite"], True)
        self.assertEqual(second.get_json()["is_favorite"], False)


class ModerationRestoreTests(P0TestBase):
    def hide_item(self, item_id):
        for i, email in enumerate(("r1@ej.es", "r2@ej.es", "r3@ej.es")):
            token, _ = self.register(f"Reportero {i}", email)
            res = self.client.post(f"/api/items/{item_id}/report",
                                   json={"reason": "spam"}, headers=self.auth(token))
            self.assertEqual(res.status_code, 201, res.get_json())
        return res

    def test_restore_requires_admin_account(self):
        owner_token, _ = self.register("Ana", "ana@uvigo.gal")
        other_token, _ = self.register("Bruno", "bruno@example.org")
        item = self.publish(owner_token)
        self.hide_item(item["id"])
        res = self.client.post(f"/api/items/{item['id']}/restore",
                               headers=self.auth(other_token))
        self.assertEqual(res.status_code, 403)

    def test_admin_restores_hidden_item_and_closes_reports(self):
        owner_token, _ = self.register("Ana", "ana@uvigo.gal")
        admin_token, admin_id = self.register("Mod", "moderacion@ej.es")
        backend.ADMIN_EMAILS = frozenset({"moderacion@ej.es"})
        item = self.publish(owner_token)
        last = self.hide_item(item["id"])
        self.assertTrue(last.get_json()["hidden"])

        res = self.client.post(f"/api/items/{item['id']}/restore",
                               headers=self.auth(admin_token))
        self.assertEqual(res.status_code, 200, res.get_json())
        self.assertFalse(res.get_json()["item"]["hidden"])

        # Vuelve a estar visible en el catálogo.
        catalog = self.client.get("/api/items").get_json()
        self.assertIn(item["id"], [i["id"] for i in catalog["items"]])

        # Estado de moderación registrado: reportes marcados como resueltos.
        db = backend.connect_db()
        statuses = [r["status"] for r in db.execute(
            "SELECT status FROM reports WHERE item_id = ?", (item["id"],)).fetchall()]
        db.close()
        self.assertEqual(statuses, ["resuelto"] * 3)

        # Restaurar dos veces no tiene sentido.
        again = self.client.post(f"/api/items/{item['id']}/restore",
                                 headers=self.auth(admin_token))
        self.assertEqual(again.status_code, 400)
        self.assertEqual(again.get_json()["error"], "not_hidden")

    def test_hidden_item_is_not_reachable_before_restore(self):
        owner_token, _ = self.register("Ana", "ana@uvigo.gal")
        item = self.publish(owner_token)
        self.hide_item(item["id"])
        detail = self.client.get(f"/api/items/{item['id']}")
        self.assertEqual(detail.status_code, 404)


class DeleteAccountHistoryTests(P0TestBase):
    def test_delete_preserves_other_peoples_history(self):
        a_token, a_id = self.register("Ana", "ana@uvigo.gal")
        b_token, b_id = self.register("Bruno", "bruno@example.org")

        # B solicita el objeto de A y la interacción se completa y valora.
        a_item = self.publish(a_token, title="Mesa de Ana")
        req = self.client.post(f"/api/items/{a_item['id']}/request",
                               json={"message": "Hola, me interesa"},
                               headers=self.auth(b_token)).get_json()["request"]
        self.client.patch(f"/api/requests/{req['id']}", json={"status": "aceptada"},
                          headers=self.auth(a_token))
        self.client.patch(f"/api/requests/{req['id']}", json={"status": "completada"},
                          headers=self.auth(a_token))
        self.client.post(f"/api/requests/{req['id']}/rate",
                         json={"score": 5, "comment": "Todo bien"},
                         headers=self.auth(b_token))

        # A solicita el objeto de B (con mensaje propio) y lo reporta.
        b_item = self.publish(b_token, title="Silla de Bruno")
        a_req = self.client.post(f"/api/items/{b_item['id']}/request",
                                 json={"message": "Mi mensaje privado"},
                                 headers=self.auth(a_token)).get_json()["request"]
        self.client.post(f"/api/items/{b_item['id']}/report",
                         json={"reason": "spam"}, headers=self.auth(a_token))

        res = self.client.delete("/api/account/delete",
                                 json={"password": "password1234"},
                                 headers=self.auth(a_token))
        self.assertEqual(res.status_code, 200, res.get_json())

        db = backend.connect_db()
        ghost = db.execute("SELECT id FROM users WHERE email = ?",
                           (backend.DELETED_USER_EMAIL,)).fetchone()
        self.assertIsNotNone(ghost, "debe existir la cuenta fantasma")
        ghost_id = ghost["id"]

        # La cuenta propia desaparece.
        self.assertIsNone(db.execute("SELECT 1 FROM users WHERE id = ?", (a_id,)).fetchone())

        # La solicitud de B se conserva con su mensaje y su identidad.
        kept = db.execute("SELECT * FROM requests WHERE id = ?", (req["id"],)).fetchone()
        self.assertIsNotNone(kept)
        self.assertEqual(kept["requester_id"], b_id)
        self.assertEqual(kept["message"], "Hola, me interesa")

        # La solicitud de A se anonimiza: sin mensaje, sin rastro de A.
        anonymized = db.execute("SELECT * FROM requests WHERE id = ?", (a_req["id"],)).fetchone()
        self.assertIsNotNone(anonymized)
        self.assertEqual(anonymized["requester_id"], ghost_id)
        self.assertEqual(anonymized["message"], "")

        # La valoración escrita por B se conserva.
        rating = db.execute("SELECT * FROM ratings WHERE request_id = ?", (req["id"],)).fetchone()
        self.assertIsNotNone(rating)
        self.assertEqual(rating["rater_id"], b_id)
        self.assertEqual(rating["rated_id"], ghost_id)

        # El reporte de A es evidencia de moderación: se conserva anonimizado.
        report = db.execute("SELECT * FROM reports WHERE item_id = ?", (b_item["id"],)).fetchone()
        self.assertIsNotNone(report)
        self.assertEqual(report["reporter_id"], ghost_id)

        # La publicación de A queda vacía y oculta como referencia.
        shell = db.execute("SELECT * FROM items WHERE id = ?", (a_item["id"],)).fetchone()
        self.assertIsNotNone(shell)
        self.assertEqual(shell["owner_id"], ghost_id)
        self.assertTrue(shell["hidden_at"])
        self.assertEqual(shell["image_url"], "")
        db.close()

        # El historial sigue visible para B desde su cuenta.
        mine = self.client.get("/api/requests/mine", headers=self.auth(b_token)).get_json()
        self.assertIn(req["id"], [r["id"] for r in mine["requests"]])
        received = self.client.get("/api/requests/received", headers=self.auth(b_token)).get_json()
        counterparts = {r["id"]: r["counterpart_name"] for r in received["requests"]}
        self.assertEqual(counterparts.get(a_req["id"]), backend.DELETED_USER_NAME)

    def test_export_includes_received_data(self):
        a_token, _ = self.register("Ana", "ana@uvigo.gal")
        b_token, _ = self.register("Bruno", "bruno@example.org")
        a_item = self.publish(a_token)
        req = self.client.post(f"/api/items/{a_item['id']}/request",
                               json={"message": "Hola"}, headers=self.auth(b_token))
        self.assertEqual(req.status_code, 201)
        self.client.patch(f"/api/requests/{req.get_json()['request']['id']}",
                          json={"status": "aceptada"}, headers=self.auth(a_token))
        self.client.patch(f"/api/requests/{req.get_json()['request']['id']}",
                          json={"status": "completada"}, headers=self.auth(a_token))
        self.client.post(f"/api/requests/{req.get_json()['request']['id']}/rate",
                         json={"score": 4}, headers=self.auth(b_token))

        export = self.client.get("/api/account/export", headers=self.auth(a_token)).get_json()
        self.assertEqual(len(export["received_requests"]), 1)
        self.assertEqual(export["received_requests"][0]["message"], "Hola")
        self.assertEqual(len(export["ratings_received"]), 1)
        self.assertEqual(export["ratings_received"][0]["score"], 4)
        self.assertIn("reports_filed", export)


class DbErrorHandlingTests(P0TestBase):
    def test_db_error_returns_503_not_500(self):
        token, _ = self.register("Ana", "ana@uvigo.gal")

        class BrokenDB:
            def execute(self, *args, **kwargs):
                raise sqlite3.OperationalError("disk I/O error")

            def rollback(self):
                pass

        with mock.patch.object(backend, "get_db", return_value=BrokenDB()):
            res = self.client.get("/api/favorites", headers=self.auth(token))
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.get_json()["error"], "storage_unavailable")

    def test_login_db_error_returns_503(self):
        self.register("Ana", "ana@uvigo.gal")

        class BrokenDB:
            def execute(self, *args, **kwargs):
                raise sqlite3.OperationalError("disk I/O error")

            def rollback(self):
                pass

        backend.app.config["RATE_LIMIT_ENABLED"] = False
        with mock.patch.object(backend, "get_db", return_value=BrokenDB()):
            res = self.client.post("/api/auth/login",
                                   json={"email": "ana@uvigo.gal", "password": "password1234"})
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.get_json()["error"], "storage_unavailable")


if __name__ == "__main__":
    unittest.main()
