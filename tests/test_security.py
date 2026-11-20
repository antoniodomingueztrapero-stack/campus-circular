"""Seguridad: permisos, límites, CORS, saneado de texto y moderación."""

import io
import os
import tempfile
import unittest

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


def png_bytes(size=(320, 240)):
    from PIL import Image

    image = Image.new("RGB", size, (12, 90, 60))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class SecurityTestBase(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-sec-")
        self.upload_dir = tempfile.TemporaryDirectory(prefix="cc-sec-up-")
        self.original_upload_dir = backend.UPLOAD_DIR
        backend.UPLOAD_DIR = self.upload_dir.name
        backend.DATABASE = os.path.join(self.db_dir.name, "seguridad.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True, RATE_LIMIT_ENABLED=False)
        backend.reset_rate_limits()
        self.client = backend.app.test_client()
        self.owner_token, self.owner_id = self.register("Ana", "ana@uvigo.gal")
        self.other_token, self.other_id = self.register("Bruno", "bruno@example.org")

    def tearDown(self):
        backend.UPLOAD_DIR = self.original_upload_dir
        backend.app.config["TESTING"] = False
        backend.app.config.pop("RATE_LIMIT_ENABLED", None)
        backend.reset_rate_limits()
        self.db_dir.cleanup()
        self.upload_dir.cleanup()

    # -- helpers ---------------------------------------------------------
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

    def report(self, token, item_id, reason="spam"):
        return self.client.post(
            f"/api/items/{item_id}/report", json={"reason": reason},
            headers=self.auth(token),
        )


class AuthorizationTests(SecurityTestBase):
    def test_other_users_cannot_edit_or_delete(self):
        item = self.publish(self.owner_token)

        patch = self.client.patch(f"/api/items/{item['id']}", json={"status": "entregado"},
                                  headers=self.auth(self.other_token))
        self.assertEqual(patch.status_code, 403)
        delete = self.client.delete(f"/api/items/{item['id']}", headers=self.auth(self.other_token))
        self.assertEqual(delete.status_code, 403)
        self.assertEqual(self.client.delete(f"/api/items/{item['id']}").status_code, 401)

        # El objeto sigue disponible para su dueño.
        still = self.client.get(f"/api/items/{item['id']}").get_json()["item"]
        self.assertEqual(still["status"], "disponible")

    def test_requests_and_ratings_belong_to_participants(self):
        item = self.publish(self.owner_token)
        created = self.client.post(f"/api/items/{item['id']}/request", json={},
                                   headers=self.auth(self.other_token))
        self.assertEqual(created.status_code, 201)
        request_id = created.get_json()["request"]["id"]

        third_token, _ = self.register("Carla", "carla@example.org")
        patch = self.client.patch(f"/api/requests/{request_id}", json={"status": "aceptada"},
                                  headers=self.auth(third_token))
        self.assertEqual(patch.status_code, 403)
        rate = self.client.post(f"/api/requests/{request_id}/rate", json={"score": 1},
                                headers=self.auth(third_token))
        self.assertEqual(rate.status_code, 403)

        # Solo el dueño acepta y solo participantes valoran.
        accepted = self.client.patch(f"/api/requests/{request_id}", json={"status": "aceptada"},
                                     headers=self.auth(self.owner_token))
        self.assertEqual(accepted.status_code, 200)
        completed = self.client.patch(f"/api/requests/{request_id}", json={"status": "completada"},
                                      headers=self.auth(self.owner_token))
        self.assertEqual(completed.status_code, 200)
        self.assertEqual(self.client.post(
            f"/api/requests/{request_id}/rate", json={"score": 5},
            headers=self.auth(third_token)).status_code, 403)

    def test_account_endpoints_are_scoped_to_the_token(self):
        self.assertEqual(self.client.get("/api/account/export").status_code, 401)
        self.assertEqual(self.client.delete("/api/account/delete", json={"password": "password1234"}).status_code, 401)
        export = self.client.get("/api/account/export", headers=self.auth(self.other_token))
        self.assertEqual(export.status_code, 200)
        self.assertEqual(export.get_json()["profile"]["email"], "bruno@example.org")


class RateLimitTests(SecurityTestBase):
    def test_login_is_rate_limited_per_account(self):
        backend.app.config["RATE_LIMIT_ENABLED"] = True
        backend.reset_rate_limits()
        last = None
        for _ in range(10):
            last = self.client.post("/api/auth/login", json={
                "email": "ana@uvigo.gal", "password": "incorrecta123"})
            if last.status_code == 429:
                break
        self.assertEqual(last.status_code, 429)
        self.assertTrue(int(last.headers["Retry-After"]) >= 1)
        self.assertEqual(last.get_json()["error"], "rate_limited")

        # Con otra cuenta la ventana es independiente.
        fresh = self.client.post("/api/auth/login", json={
            "email": "bruno@example.org", "password": "incorrecta123"})
        self.assertNotEqual(fresh.status_code, 429)

    def test_register_is_rate_limited(self):
        backend.app.config["RATE_LIMIT_ENABLED"] = True
        backend.reset_rate_limits()
        statuses = []
        for i in range(7):
            res = self.client.post("/api/auth/register", json={
                "name": f"Cuenta {i}", "email": f"cuenta{i}@example.org",
                "password": "password1234", "campus": "vigo", "consent": True,
            })
            statuses.append(res.status_code)
        self.assertIn(429, statuses)
        self.assertEqual(statuses[-1], 429)

    def test_publication_is_rate_limited(self):
        backend.app.config["RATE_LIMIT_ENABLED"] = True
        backend.reset_rate_limits()
        statuses = []
        for i in range(14):
            res = self.client.post("/api/items", json={
                "title": f"Objeto {i}", "category": "libros", "exchange_type": "regalar",
                "image_url": "/static/img/items/libros.jpg", "private_seller": True,
            }, headers=self.auth(self.owner_token))
            statuses.append(res.status_code)
        self.assertEqual(statuses[-1], 429)


class CorsAndHeaderTests(SecurityTestBase):
    def test_allowed_origin_gets_cors_headers(self):
        origin = sorted(backend.CORS_ORIGINS)[0]
        res = self.client.get("/api/stats", headers={"Origin": origin})
        self.assertEqual(res.headers.get("Access-Control-Allow-Origin"), origin)
        self.assertIn("Origin", res.headers.get("Vary", ""))
        self.assertNotIn("Access-Control-Allow-Credentials", res.headers)

        preflight = self.client.options("/api/items", headers={
            "Origin": origin, "Access-Control-Request-Method": "POST"})
        self.assertIn(preflight.status_code, (200, 204))
        self.assertEqual(preflight.headers.get("Access-Control-Allow-Origin"), origin)
        self.assertIn("Authorization", preflight.headers.get("Access-Control-Allow-Headers", ""))

    def test_unknown_origin_is_not_allowed(self):
        res = self.client.get("/api/stats", headers={"Origin": "https://evil.example"})
        self.assertIsNone(res.headers.get("Access-Control-Allow-Origin"))

    def test_security_headers_are_present(self):
        res = self.client.get("/")
        self.assertIn("default-src 'self'", res.headers["Content-Security-Policy"])
        self.assertEqual(res.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(res.headers["Referrer-Policy"], "strict-origin-when-cross-origin")
        self.assertEqual(res.headers["Cross-Origin-Opener-Policy"], "same-origin")
        self.assertNotIn("Access-Control-Allow-Origin", res.headers)

        secure = self.client.get("/api/health", headers={"X-Forwarded-Proto": "https"})
        self.assertIn("max-age", secure.headers.get("Strict-Transport-Security", ""))

    def test_auth_responses_are_not_cached(self):
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.headers.get("Cache-Control"), "no-store")

    def test_oversized_json_body_is_rejected(self):
        big = {"message": "x" * (backend.MAX_JSON_BYTES + 100)}
        res = self.client.post("/api/items", json=big, headers=self.auth(self.owner_token))
        self.assertEqual(res.status_code, 413)


class InputValidationTests(SecurityTestBase):
    def test_text_is_normalised_and_stripped(self):
        item = self.publish(
            self.owner_token,
            title="Li\u200bbro\u0000 de   Derecho\uff21",
            description="Descripción   con\t\tcontrol\u0007 y  espacios  ",
        )
        self.assertEqual(item["title"], "Libro de DerechoA")
        self.assertNotIn("\u200b", item["title"])
        self.assertNotIn("\x00", item["title"])
        self.assertNotIn("\x07", item["description"])
        self.assertIn("control y espacios", item["description"])

    def test_invalid_types_and_prices_are_rejected(self):
        res = self.client.post("/api/items", json={"title": ["no", "es", "texto"]},
                               headers=self.auth(self.owner_token))
        self.assertEqual(res.status_code, 400)
        for price in ("nan", "inf", -1, 10001):
            res = self.client.post("/api/items", json={
                "title": "Objeto con precio", "category": "libros", "exchange_type": "vender",
                "price": price, "image_url": "/static/img/items/libros.jpg",
                "private_seller": True}, headers=self.auth(self.owner_token))
            self.assertEqual(res.status_code, 400, price)

    def test_gif_renamed_as_png_is_rejected(self):
        gif = b"GIF89a" + b"\x00" * 64
        res = self.client.post("/api/upload", data={"file": (io.BytesIO(gif), "foto.png")},
                               headers=self.auth(self.owner_token),
                               content_type="multipart/form-data")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()["error"], "invalid_type")

        ok = self.client.post("/api/upload", data={"file": (io.BytesIO(png_bytes()), "foto.png")},
                              headers=self.auth(self.owner_token),
                              content_type="multipart/form-data")
        self.assertEqual(ok.status_code, 201)

    def test_report_requires_valid_reason_and_comment_limit(self):
        item = self.publish(self.owner_token)
        self.assertEqual(self.client.post(f"/api/items/{item['id']}/report",
                                          json={"reason": "spam"}).status_code, 401)
        self.assertEqual(self.report(self.owner_token, item["id"]).status_code, 400)
        self.assertEqual(self.report(self.other_token, item["id"], "porque sí").status_code, 400)
        too_long = self.client.post(
            f"/api/items/{item['id']}/report",
            json={"reason": "otro", "comment": "x" * (backend.REPORT_COMMENT_MAX + 50)},
            headers=self.auth(self.other_token))
        self.assertEqual(too_long.status_code, 201)
        self.assertEqual(len(too_long.get_json()), 3)


class ModerationTests(SecurityTestBase):
    def test_community_reports_hide_the_item(self):
        item = self.publish(self.owner_token, title="Curso de dudosa calidad")
        reporters = [self.other_token]
        for i in range(backend.REPORT_HIDE_THRESHOLD - 1):
            token, _ = self.register(f"Persona {i}", f"persona{i}@example.org")
            reporters.append(token)

        first = self.report(reporters[0], item["id"])
        self.assertEqual(first.status_code, 201)
        self.assertFalse(first.get_json()["hidden"])

        # Un mismo usuario no puede inflar el contador.
        self.assertEqual(self.report(reporters[0], item["id"]).status_code, 409)

        last = None
        for token in reporters[1:]:
            last = self.report(token, item["id"])
        self.assertEqual(last.status_code, 201)
        self.assertTrue(last.get_json()["hidden"])

        # Ya no aparece en el catálogo ni puede solicitarse.
        catalog = self.client.get("/api/items").get_json()["items"]
        self.assertNotIn(item["id"], [row["id"] for row in catalog])
        self.assertEqual(self.client.get(f"/api/items/{item['id']}").status_code, 404)
        self.assertEqual(self.client.post(f"/api/items/{item['id']}/request", json={},
                                          headers=self.auth(self.other_token)).status_code, 404)
        self.assertEqual(self.report(self.other_token, item["id"]).status_code, 404)

        # El dueño lo sigue viendo, marcado para revisión.
        own = self.client.get(f"/api/items/{item['id']}", headers=self.auth(self.owner_token))
        self.assertEqual(own.status_code, 200)
        self.assertTrue(own.get_json()["item"]["hidden"])
        self.assertEqual(own.get_json()["item"]["reports"], backend.REPORT_HIDE_THRESHOLD)

        mine = self.client.get("/api/items/mine", headers=self.auth(self.owner_token)).get_json()
        self.assertEqual(mine["items"][0]["reports"], backend.REPORT_HIDE_THRESHOLD)
        self.assertTrue(mine["items"][0]["hidden"])

    def test_hidden_items_leave_the_public_stats(self):
        backend.app.config["TESTING"] = False  # evita la caché de /api/stats
        item = self.publish(self.owner_token)
        before = self.client.get("/api/stats").get_json()
        self.assertEqual(before["total_items"], 1)
        tokens = []
        for i in range(backend.REPORT_HIDE_THRESHOLD):
            token, _ = self.register(f"Vecina {i}", f"vecina{i}@example.org")
            tokens.append(token)
        for token in tokens:
            self.report(token, item["id"])
        after = self.client.get("/api/stats").get_json()
        self.assertEqual(after["total_items"], 0)
        self.assertEqual(after["by_category"], [])

    def test_sessions_per_account_are_capped(self):
        for _ in range(backend.SESSIONS_PER_USER + 3):
            res = self.client.post("/api/auth/login", json={
                "email": "ana@uvigo.gal", "password": "password1234"})
            self.assertEqual(res.status_code, 200)
        db = backend.connect_db()
        try:
            count = db.execute(
                "SELECT COUNT(*) c FROM sessions WHERE user_id = ?", (self.owner_id,)
            ).fetchone()["c"]
        finally:
            db.close()
        self.assertLessEqual(count, backend.SESSIONS_PER_USER)


if __name__ == "__main__":
    unittest.main()
