"""Tests for the trust layer: lifecycle, ratings and discovery."""

import os
import tempfile
import unittest

os.environ.setdefault("SEED_DEMO", "0")

import app as backend  # noqa: E402


class FeatureTests(unittest.TestCase):
    def setUp(self):
        self.db_dir = tempfile.TemporaryDirectory(prefix="cc-features-")
        backend.DATABASE = os.path.join(self.db_dir.name, "features.sqlite")
        backend.SEED_DEMO = False
        backend.init_db()
        backend.migrate_db()
        backend.app.config.update(TESTING=True)
        self.client = backend.app.test_client()
        self.owner = self.register("Marta", "marta@uvigo.gal")
        self.other = self.register("Bruno", "bruno@example.com")

    def tearDown(self):
        self.db_dir.cleanup()

    # -- helpers ---------------------------------------------------------
    def register(self, name, email):
        res = self.client.post("/api/auth/register", json={
            "name": name, "email": email, "password": "password1234",
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
        return self.client.post("/api/items", json=payload, headers=self.headers(account))

    def request_item(self, account, item_id, **extra):
        return self.client.post(
            f"/api/items/{item_id}/request", json=extra, headers=self.headers(account))

    # -- identity --------------------------------------------------------
    def test_academic_domain_list_and_subdomains(self):
        self.assertTrue(backend.is_university_email("ana@uvigo.gal"))
        self.assertTrue(backend.is_university_email("ana@alumnos.uvigo.gal"))
        self.assertTrue(backend.is_university_email("ana@mit.edu"))
        self.assertTrue(backend.is_university_email("ana@cs.ox.ac.uk"))
        self.assertFalse(backend.is_university_email("ana@gmail.com"))
        self.assertFalse(backend.is_university_email("ana@uvigo.gal.evil.com"))
        self.assertTrue(self.owner["user"]["university_verified"])
        self.assertFalse(self.other["user"]["university_verified"])

    # -- publicar rápido -------------------------------------------------
    def test_photo_is_required_and_description_is_optional(self):
        missing_photo = self.publish(self.owner, image_url="")
        self.assertEqual(missing_photo.status_code, 400)
        self.assertEqual(missing_photo.get_json()["error"], "image_required")

        res = self.publish(self.owner)
        self.assertEqual(res.status_code, 201, res.get_json())
        item = res.get_json()["item"]
        self.assertEqual(item["description"], "")
        self.assertEqual(item["condition"], "bueno")
        self.assertEqual(item["handover_point"], "acordado")
        self.assertNotIn("faculty", item)
        self.assertNotIn("impact", item)
        self.assertEqual(item["status"], "disponible")

    def test_accent_insensitive_search_and_ignored_faculty(self):
        self.publish(self.owner, title="Lámpara de escritorio", faculty="artes")
        self.publish(self.owner, title="Teclado mecánico", faculty="ingenieria")

        found = self.client.get("/api/items?q=lampara+escritorio").get_json()["items"]
        self.assertEqual([i["title"] for i in found], ["Lámpara de escritorio"])
        self.assertEqual(self.client.get("/api/items?q=inexistente").get_json()["items"], [])
        # El concepto de facultad desapareció del producto: el parámetro se ignora.
        self.assertEqual(len(self.client.get("/api/items?faculty=desconocida").get_json()["items"]), 2)

    # -- ciclo de vida ---------------------------------------------------
    def test_handover_point_is_proposed_with_the_request(self):
        item = self.publish(self.owner, handover_point="biblioteca").get_json()["item"]
        res = self.request_item(self.other, item["id"], handover_point="conserjeria")
        self.assertEqual(res.status_code, 201, res.get_json())
        request = res.get_json()["request"]
        self.assertEqual(request["handover_point"], "conserjeria")

        default_point = self.request_item(self.owner, item["id"], message="hola")
        self.assertEqual(default_point.status_code, 400)  # no puede pedir su propio objeto

        item2 = self.publish(self.owner, title="Silla plegable").get_json()["item"]
        default_point = self.request_item(self.other, item2["id"])
        self.assertEqual(default_point.get_json()["request"]["handover_point"], "acordado")

    def test_request_lifecycle_updates_the_item_and_unlocks_ratings(self):
        item = self.publish(self.owner).get_json()["item"]
        request_id = self.request_item(self.other, item["id"]).get_json()["request"]["id"]

        early = self.client.post(f"/api/requests/{request_id}/rate",
                                 json={"score": 5}, headers=self.headers(self.other))
        self.assertEqual(early.status_code, 400)

        accepted = self.client.patch(f"/api/requests/{request_id}",
                                     json={"status": "aceptada"}, headers=self.headers(self.owner))
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(self.client.get(f"/api/items/{item['id']}").get_json()["item"]["status"],
                         "reservado")

        completed = self.client.patch(f"/api/requests/{request_id}",
                                      json={"status": "completada"}, headers=self.headers(self.owner))
        self.assertEqual(completed.status_code, 200)
        stored = self.client.get(f"/api/items/{item['id']}").get_json()["item"]
        self.assertEqual(stored["status"], "entregado")
        self.assertTrue(stored["delivered_at"])

        mine = self.client.get("/api/requests/mine", headers=self.headers(self.other)).get_json()
        self.assertTrue(mine["requests"][0]["can_rate"])
        self.assertIsNone(mine["requests"][0]["my_rating"])

        rated = self.client.post(f"/api/requests/{request_id}/rate",
                                 json={"score": 4, "comment": "Todo bien"},
                                 headers=self.headers(self.other))
        self.assertEqual(rated.status_code, 201, rated.get_json())
        self.assertEqual(rated.get_json()["summary"]["count"], 1)
        self.assertEqual(rated.get_json()["summary"]["average"], 4.0)

        again = self.client.post(f"/api/requests/{request_id}/rate",
                                 json={"score": 2}, headers=self.headers(self.other))
        self.assertEqual(again.status_code, 409)
        bad = self.client.post(f"/api/requests/{request_id}/rate",
                               json={"score": 7}, headers=self.headers(self.owner))
        self.assertEqual(bad.status_code, 400)

        owner = self.client.get(f"/api/items/{item['id']}").get_json()["item"]["owner"]
        self.assertEqual(owner["rating"]["count"], 1)
        self.assertEqual(owner["exchanges"]["given"], 1)
        self.assertTrue(owner["university_verified"])

    def test_cancelling_a_reservation_frees_the_item_again(self):
        item = self.publish(self.owner).get_json()["item"]
        request_id = self.request_item(self.other, item["id"]).get_json()["request"]["id"]
        self.client.patch(f"/api/requests/{request_id}", json={"status": "aceptada"},
                          headers=self.headers(self.owner))
        self.client.patch(f"/api/requests/{request_id}", json={"status": "cancelada"},
                          headers=self.headers(self.other))
        self.assertEqual(self.client.get(f"/api/items/{item['id']}").get_json()["item"]["status"],
                         "disponible")

    def test_stats_expose_accounts_and_objects_only(self):
        item = self.publish(self.owner).get_json()["item"]
        request_id = self.request_item(self.other, item["id"]).get_json()["request"]["id"]
        self.client.patch(f"/api/requests/{request_id}", json={"status": "aceptada"},
                          headers=self.headers(self.owner))
        self.client.patch(f"/api/requests/{request_id}", json={"status": "completada"},
                          headers=self.headers(self.owner))

        stats = self.client.get("/api/stats").get_json()
        self.assertEqual(stats["total_items"], 1)
        self.assertEqual(stats["users"], 2)
        self.assertNotIn("impact", stats)

        mine = self.client.get("/api/trust/me", headers=self.headers(self.owner)).get_json()
        self.assertEqual(mine["exchanges"]["given"], 1)
        self.assertNotIn("impact", mine)
        self.assertNotIn("ten_kg", [b["key"] for b in mine["badges"]])
        self.assertIn("first_delivery", [b["key"] for b in mine["badges"] if b["earned"]])
        self.assertEqual(self.client.get("/api/trust/me").status_code, 401)


if __name__ == "__main__":
    unittest.main()
