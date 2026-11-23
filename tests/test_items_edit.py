"""Editor de publicaciones: la API acepta los mismos campos que el formulario."""

import os
import tempfile
import unittest

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


class ItemEditTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-edit-")
        backend.DATABASE = os.path.join(self.db_dir.name, "editar.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True, RATE_LIMIT_ENABLED=False)
        backend.reset_rate_limits()
        self.client = backend.app.test_client()
        reg = self.client.post("/api/auth/register", json={
            "name": "Dueña", "email": "duena@uvigo.gal",
            "password": "password1234", "campus": "vigo", "consent": True,
        })
        self.token = reg.get_json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        item = self.client.post("/api/items", json={
            "title": "Mesa de estudio", "description": "Mesa de madera con dos cajones.",
            "category": "muebles", "condition": "bueno", "exchange_type": "regalar",
            "campus": "vigo", "handover_point": "biblioteca", "private_seller": True,
            "image_url": "/static/img/items/muebles-480.webp",
        }, headers=self.headers)
        self.assertEqual(item.status_code, 201, item.get_json())
        self.item_id = item.get_json()["item"]["id"]

        other = self.client.post("/api/auth/register", json={
            "name": "Otra", "email": "otra@uvigo.gal",
            "password": "password1234", "campus": "ourense", "consent": True,
        })
        self.other_headers = {"Authorization": f"Bearer {other.get_json()['token']}"}

    def tearDown(self):
        backend.app.config["TESTING"] = False
        backend.app.config.pop("RATE_LIMIT_ENABLED", None)
        backend.reset_rate_limits()
        self.db_dir.cleanup()

    def patch(self, payload, headers=None):
        return self.client.patch(f"/api/items/{self.item_id}", json=payload,
                                 headers=headers or self.headers)

    def test_edit_all_fields_persists(self):
        res = self.patch({
            "title": "  Mesa   de estudio grande ",
            "description": "Mesa de madera maciza con dos cajones y estante.",
            "category": "muebles", "condition": "como_nuevo",
            "exchange_type": "vender", "price": 25, "campus": "pontevedra",
            "faculty": "ingenieria", "handover_point": "conserjeria",
        })
        self.assertEqual(res.status_code, 200, res.get_json())
        item = res.get_json()["item"]
        self.assertEqual(item["title"], "Mesa de estudio grande")
        self.assertEqual(item["condition"], "como_nuevo")
        self.assertEqual(item["exchange_type"], "vender")
        self.assertEqual(item["price"], 25.0)
        self.assertEqual(item["campus"], "pontevedra")
        # El campo facultad ya no forma parte del producto: se ignora.
        self.assertNotIn("faculty", item)
        self.assertEqual(item["handover_point"], "conserjeria")

        detail = self.client.get(f"/api/items/{self.item_id}").get_json()["item"]
        self.assertEqual(detail["title"], "Mesa de estudio grande")
        self.assertEqual(detail["price"], 25.0)

    def test_price_disappears_when_not_selling(self):
        self.patch({"exchange_type": "vender", "price": 30})
        res = self.patch({"exchange_type": "regalar"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["item"]["price"], 0.0)

    def test_status_change_still_works(self):
        res = self.patch({"status": "reservado"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["item"]["status"], "reservado")
        res = self.patch({"status": "entregado"})
        self.assertEqual(res.get_json()["item"]["status"], "entregado")
        self.assertTrue(res.get_json()["item"]["delivered_at"])
        res = self.patch({"status": "disponible"})
        self.assertEqual(res.get_json()["item"]["status"], "disponible")
        self.assertEqual(res.get_json()["item"]["delivered_at"], "")

    def test_edit_and_status_in_the_same_request(self):
        res = self.patch({"title": "Mesa reservada", "status": "reservado"})
        self.assertEqual(res.status_code, 200, res.get_json())
        item = res.get_json()["item"]
        self.assertEqual((item["title"], item["status"]), ("Mesa reservada", "reservado"))

    def test_validation_matches_publishing_rules(self):
        cases = [
            ({"title": "ab"}, "invalid_title"),
            ({"description": "corta"}, "invalid_description"),
            ({"category": "naves"}, "invalid_category"),
            ({"condition": "roto"}, "invalid_condition"),
            ({"exchange_type": "alquilar"}, "invalid_exchange_type"),
            ({"campus": "madrid"}, "invalid_campus"),
            ({"handover_point": "parking"}, "invalid_handover_point"),
            ({"price": -5}, "invalid_price"),
            ({"price": 99999}, "invalid_price"),
            ({"price": "mucho"}, "invalid_price"),
            ({"status": "perdido"}, "invalid_status"),
        ]
        for payload, code in cases:
            res = self.patch(payload)
            self.assertEqual(res.status_code, 400, payload)
            self.assertEqual(res.get_json()["error"], code, payload)

    def test_empty_body_and_bad_json(self):
        res = self.patch({})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()["error"], "nothing_to_update")
        res = self.client.patch(f"/api/items/{self.item_id}", data="no json",
                                content_type="text/plain", headers=self.headers)
        self.assertEqual(res.status_code, 400)

    def test_only_the_owner_can_edit(self):
        res = self.patch({"title": "Secuestrada"}, headers=self.other_headers)
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.client.get(f"/api/items/{self.item_id}").get_json()["item"]["title"],
                         "Mesa de estudio")

    def test_edit_requires_session_and_existing_item(self):
        self.assertEqual(self.client.patch(f"/api/items/{self.item_id}",
                                          json={"title": "Sin sesión"}).status_code, 401)
        res = self.client.patch("/api/items/99999", json={"title": "Fantasma"},
                                headers=self.headers)
        self.assertEqual(res.status_code, 404)

    def test_edit_rate_limited(self):
        backend.app.config["RATE_LIMIT_ENABLED"] = True
        backend.reset_rate_limits()
        codes = [self.patch({"title": f"Mesa {n}"}).status_code for n in range(62)]
        self.assertIn(429, codes)


if __name__ == "__main__":
    unittest.main()
