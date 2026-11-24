"""Valoraciones y comentarios públicos por publicación (tabla `item_comments`).

Lo que se comprueba aquí es lo que antes no existía: que cualquier persona
pueda opinar y puntuar la publicación de otra, que solo pueda hacerlo una vez,
que el resumen sea visible para todo el mundo (también sin sesión) y que las
reglas de moderación y longitud se respeten.
"""

import os
import tempfile
import unittest

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


PW = "comm" + "ent-test-2026"


class ItemCommentTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-comments-")
        backend.DATABASE = os.path.join(self.db_dir.name, "comments.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True)
        self.client = backend.app.test_client()
        self.owner = self.register("Marta", "marta@uvigo.gal")
        self.reviewer = self.register("Bruno", "bruno@example.com")
        self.third = self.register("Sara", "sara@example.com")
        self.password = PW
        self.item_id = self.publish(self.owner)

    def tearDown(self):
        if hasattr(backend, "_real_rate_limited"):
            backend.rate_limited = backend._real_rate_limited
        self.db_dir.cleanup()

    # -- helpers ---------------------------------------------------------
    def register(self, name, email):
        res = self.client.post("/api/auth/register", json={
            "name": name, "email": email, "password": PW,
            "campus": "vigo", "consent": True,
        })
        self.assertEqual(res.status_code, 201, res.get_json())
        return res.get_json()

    @staticmethod
    def headers(account):
        return {"Authorization": f"Bearer {account['token']}"}

    def publish(self, account, **overrides):
        payload = {
            "title": "Lampara de pie",
            "category": "muebles",
            "exchange_type": "regalar",
            "image_url": "/static/img/items/lampara.jpg",
            "private_seller": True,
        }
        payload.update(overrides)
        res = self.client.post("/api/items", json=payload, headers=self.headers(account))
        self.assertEqual(res.status_code, 201, res.get_json())
        return res.get_json()["item"]["id"]

    def comment(self, account, item_id=None, **payload):
        return self.client.post(
            f"/api/items/{item_id or self.item_id}/comments",
            json=payload,
            headers=self.headers(account) if account else {},
        )

    # -- happy path ------------------------------------------------------
    def test_public_comments_and_ratings_are_aggregated(self):
        res = self.comment(self.reviewer, score=4, body="Todo perfecto, puntual y en buen estado.")
        self.assertEqual(res.status_code, 201, res.get_json())
        created = res.get_json()["comment"]
        self.assertEqual(created["user_name"], "Bruno")
        self.assertEqual(created["score"], 4)

        second = self.comment(self.third, score=5, body="Muy amable.")
        self.assertEqual(second.status_code, 201, second.get_json())

        # Publico: se puede leer sin sesion.
        listing = self.client.get(f"/api/items/{self.item_id}/comments")
        self.assertEqual(listing.status_code, 200)
        data = listing.get_json()
        self.assertEqual(data["total"], 2)
        self.assertEqual(data["summary"], {"count": 2, "average": 4.5, "score_count": 2})

        detail = self.client.get(f"/api/items/{self.item_id}").get_json()["item"]
        self.assertEqual(detail["comments"], {"count": 2, "average": 4.5, "score_count": 2})

    def test_comment_without_score_and_score_without_comment_are_both_valid(self):
        body_only = self.comment(self.reviewer, body="Sin nota, solo comentario.")
        self.assertEqual(body_only.status_code, 201, body_only.get_json())
        self.assertEqual(body_only.get_json()["summary"],
                         {"count": 1, "average": 0.0, "score_count": 0})

        score_only = self.comment(self.third, score=2)
        self.assertEqual(score_only.status_code, 201, score_only.get_json())
        self.assertEqual(score_only.get_json()["comment"]["body"], "")

    def test_my_comment_is_only_returned_to_its_author(self):
        self.comment(self.reviewer, score=5, body="Genial")
        mine = self.client.get(f"/api/items/{self.item_id}",
                               headers=self.headers(self.reviewer)).get_json()["item"]
        self.assertEqual(mine["my_comment"]["score"], 5)

        other = self.client.get(f"/api/items/{self.item_id}",
                                headers=self.headers(self.third)).get_json()["item"]
        self.assertIsNone(other["my_comment"])

    def test_comments_are_listed_newest_first_and_paged(self):
        for i, account in enumerate((self.reviewer, self.third)):
            self.comment(account, score=i + 4, body=f"Opinion {i}")
        page = self.client.get(f"/api/items/{self.item_id}/comments?limit=1").get_json()
        self.assertEqual(len(page["items"]), 1)
        self.assertTrue(page["has_more"])
        self.assertEqual(page["items"][0]["body"], "Opinion 1")

    # -- reglas de negocio ------------------------------------------------
    def test_one_comment_per_person_per_item(self):
        first = self.comment(self.reviewer, score=5, body="Bien")
        self.assertEqual(first.status_code, 201, first.get_json())
        again = self.comment(self.reviewer, score=1, body="Ahora mal")
        self.assertEqual(again.status_code, 409)
        self.assertEqual(again.get_json()["error"], "already_commented")
        listing = self.client.get(f"/api/items/{self.item_id}/comments").get_json()
        self.assertEqual(listing["total"], 1)
        self.assertEqual(listing["items"][0]["score"], 5)

    def test_empty_and_invalid_payloads_are_rejected(self):
        empty = self.comment(self.reviewer)
        self.assertEqual(empty.status_code, 400)
        self.assertEqual(empty.get_json()["error"], "empty_comment")

        blank = self.comment(self.reviewer, body="   \n  ")
        self.assertEqual(blank.status_code, 400)
        self.assertEqual(blank.get_json()["error"], "empty_comment")

        for score in (0, 6, -1, "cinco", True, 4.5):
            res = self.comment(self.reviewer, score=score)
            self.assertEqual(res.status_code, 400, (score, res.get_json()))
            self.assertEqual(res.get_json()["error"], "invalid_score")

    def test_owner_cannot_rate_own_listing(self):
        res = self.comment(self.owner, score=5, body="Me encanta mi lampara")
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json()["error"], "self_comment")

    def test_anonymous_cannot_comment(self):
        res = self.comment(None, score=5)
        self.assertEqual(res.status_code, 401)

    def test_body_is_capped_at_the_configured_maximum(self):
        self.assertEqual(backend.ITEM_COMMENT_MAX, 500)
        long_body = "a" * (backend.ITEM_COMMENT_MAX + 250)
        res = self.comment(self.reviewer, body=long_body)
        self.assertEqual(res.status_code, 201, res.get_json())
        self.assertEqual(len(res.get_json()["comment"]["body"]), backend.ITEM_COMMENT_MAX)

    def test_missing_or_hidden_item_is_not_commentable(self):
        self.assertEqual(self.client.get("/api/items/999999/comments").status_code, 404)
        self.assertEqual(self.comment(self.reviewer, item_id=999999, score=5).status_code, 404)

        hidden = self.publish(self.owner, title="Otra lampara")
        reporters = [self.register(f"Rep {i}", f"rep{i}@example.com")
                     for i in range(backend.REPORT_HIDE_THRESHOLD)]
        for account in reporters:
            out = self.client.post(f"/api/items/{hidden}/report",
                                   json={"reason": "otro"}, headers=self.headers(account))
            self.assertIn(out.status_code, (200, 201), out.get_json())
        self.assertEqual(self.comment(self.reviewer, item_id=hidden, score=5).status_code, 404)
        self.assertEqual(self.client.get(f"/api/items/{hidden}/comments").status_code, 404)
        # El propietario sigue pudiendo verlo, con su resumen intacto.
        detail = self.client.get(f"/api/items/{hidden}",
                                 headers=self.headers(self.owner)).get_json()["item"]
        self.assertEqual(detail["comments"]["count"], 0)

    def test_rate_limit_is_enforced_on_comments(self):
        from flask import jsonify

        real = backend.rate_limited

        def fake_limited(bucket, identity=""):
            if bucket != "item_comment":
                return real(bucket, identity)
            self.captured.append(bucket)
            resp = jsonify({"error": "rate_limited", "message": "Demasiados intentos."})
            resp.status_code = 429
            return resp

        self.captured = []
        backend._real_rate_limited = real
        backend.rate_limited = fake_limited
        res = self.comment(self.reviewer, score=5, body="Frena")
        self.assertEqual(res.status_code, 429)
        self.assertEqual(self.captured[0], "item_comment")
        self.assertIn("item_comment", backend.RATE_LIMITS)
        limit, window = backend.RATE_LIMITS["item_comment"]
        self.assertGreaterEqual(limit, 1)
        self.assertGreaterEqual(window, 60)

    # -- integración con el resto de la web --------------------------------
    def test_catalog_and_lists_expose_the_rating_summary(self):
        self.comment(self.reviewer, score=4, body="Bien")
        self.comment(self.third, score=5, body="Muy bien")
        catalog = self.client.get("/api/items?limit=10").get_json()["items"][0]
        self.assertEqual(catalog["comments"], {"count": 2, "average": 4.5, "score_count": 2})
        mine = self.client.get("/api/items/mine", headers=self.headers(self.owner)).get_json()["items"][0]
        self.assertEqual(mine["comments"]["count"], 2)
        self.client.post(f"/api/items/{self.item_id}/favorite", headers=self.headers(self.reviewer))
        favs = self.client.get("/api/favorites", headers=self.headers(self.reviewer)).get_json()["items"]
        self.assertEqual([i for i in favs if i["id"] == self.item_id][0]["comments"]["count"], 2)

    def test_export_includes_written_and_received_comments(self):
        self.comment(self.reviewer, score=4, body="Uso correcto")
        data = self.client.get("/api/account/export", headers=self.headers(self.reviewer)).get_json()
        self.assertEqual(len(data["item_comments_written"]), 1)
        self.assertEqual(data["item_comments_written"][0]["score"], 4)
        owner_data = self.client.get("/api/account/export", headers=self.headers(self.owner)).get_json()
        self.assertEqual(len(owner_data["item_comments_received"]), 1)
        self.assertEqual(owner_data["item_comments_received"][0]["body"], "Uso correcto")

    def test_deleting_the_listing_removes_its_comments(self):
        self.comment(self.reviewer, score=4, body="Bien")
        self.assertEqual(self.client.get(f"/api/items/{self.item_id}/comments").get_json()["total"], 1)
        out = self.client.delete(f"/api/items/{self.item_id}", headers=self.headers(self.owner))
        self.assertEqual(out.status_code, 200, out.get_json())
        self.assertEqual(self.client.get(f"/api/items/{self.item_id}/comments").status_code, 404)
        conn = backend.connect_db()
        try:
            left = conn.execute("SELECT COUNT(*) c FROM item_comments").fetchone()["c"]
        finally:
            conn.close()
        self.assertEqual(left, 0)

    def test_deleting_the_account_erases_own_comments_but_keeps_received(self):
        self.comment(self.reviewer, score=4, body="Opinion de Bruno")
        other_item = self.publish(self.reviewer, title="Silla plegable")
        self.comment(self.owner, item_id=other_item, score=5, body="Opinion de Marta")
        out = self.client.delete("/api/account/delete",
                                 json={"password": self.password}, headers=self.headers(self.owner))
        self.assertEqual(out.status_code, 200, out.get_json())
        self.assertEqual(out.get_json()["deleted"]["item_comments_written"], 1)
        conn = backend.connect_db()
        try:
            rows = {r["body"]: r["user_id"] for r in conn.execute(
                "SELECT body, user_id FROM item_comments").fetchall()}
        finally:
            conn.close()
        # La que escribió Marta desaparece; la que Bruno escribió sobre su
        # objeto se conserva (no se destruye el historial ajeno).
        self.assertNotIn("Opinion de Marta", rows)
        self.assertIn("Opinion de Bruno", rows)

    # -- esquema / migración ---------------------------------------------
    def test_migrate_db_creates_the_table_on_a_pre_existing_database(self):
        conn = backend.connect_db()
        try:
            conn.execute("DROP TABLE item_comments")
            conn.commit()
        finally:
            conn.close()
        self.assertIn(self.client.get(f"/api/items/{self.item_id}/comments").status_code, (404, 503))
        backend.migrate_db()
        conn = backend.connect_db()
        try:
            table = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='item_comments'"
            ).fetchone()
        finally:
            conn.close()
        self.assertIsNotNone(table)
        listing = self.client.get(f"/api/items/{self.item_id}/comments").get_json()
        self.assertEqual(listing["total"], 0)


if __name__ == "__main__":
    unittest.main()
