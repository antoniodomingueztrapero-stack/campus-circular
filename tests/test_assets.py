"""Guardas de peso y coherencia de las imágenes optimizadas.

Evitan la regresión clásica: alguien añade una foto de 2 MB al catálogo y el
frontend deja de tener variantes porque nadie ejecutó
`tools/optimize_images.py`.
"""

import json
import os
import re
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(BASE_DIR, "static", "img")
MANIFEST_PATH = os.path.join(IMG_DIR, "manifest.json")

# Iconos que no necesitan variantes (ya están en su tamaño final).
ICON_RE = re.compile(r"/(?:favicon|apple-touch-icon|circular-campus-(?:mark-\d+|og)|ctc-congress|circular-campus-mark-white)")
IMG_RE = re.compile(r"/static/img/[A-Za-z0-9_\-./]+\.(?:jpg|jpeg|png)")

WEBP_MAX_BYTES = 90 * 1024
FALLBACK_MAX_BYTES = 130 * 1024
TOTAL_MAX_BYTES = 9 * 1024 * 1024


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


class AssetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.load(open(MANIFEST_PATH, encoding="utf-8"))

    def path_for(self, url):
        return os.path.join(BASE_DIR, url.lstrip("/"))

    def test_manifest_points_to_existing_files(self):
        self.assertGreater(len(self.manifest), 10)
        for source, entry in self.manifest.items():
            self.assertTrue(os.path.exists(self.path_for(source)), source)
            for part in entry["webp"].split(","):
                url = part.strip().split(" ")[0]
                self.assertTrue(os.path.exists(self.path_for(url)), url)
                self.assertLessEqual(os.path.getsize(self.path_for(url)), WEBP_MAX_BYTES, url)
            self.assertTrue(os.path.exists(self.path_for(entry["src"])), entry["src"])
            self.assertLessEqual(os.path.getsize(self.path_for(entry["src"])), FALLBACK_MAX_BYTES)
            self.assertGreater(entry["width"], 0)
            self.assertGreater(entry["height"], 0)

    def test_every_referenced_photo_has_variants(self):
        sources = [os.path.join(BASE_DIR, "templates", "index.html"),
                   os.path.join(BASE_DIR, "static", "js", "app.js")]
        referenced = set()
        for path in sources:
            referenced.update(IMG_RE.findall(read(path)))
        # Las categorías se construyen en tiempo de ejecución: se comprueban
        # todas las fotos del catálogo, no solo las escritas a mano.
        referenced.update(
            f"/static/img/items/{name}"
            for name in os.listdir(os.path.join(IMG_DIR, "items"))
            if not re.search(r"-\d{3,4}\.", name) and name.endswith((".jpg", ".jpeg", ".png"))
        )
        missing = sorted(
            url for url in referenced
            if not ICON_RE.search(url) and url not in self.manifest
        )
        self.assertEqual(missing, [], f"sin variantes (ejecuta tools/optimize_images.py): {missing}")

    def test_inline_icons_stay_small(self):
        logo = os.path.join(IMG_DIR, "circular-campus-mark-white.png")
        self.assertLessEqual(os.path.getsize(logo), 40 * 1024, "el logo del header debe ir reducido")

    def test_static_images_total_size(self):
        total = sum(
            os.path.getsize(os.path.join(base, name))
            for base, _dirs, files in os.walk(IMG_DIR)
            for name in files
        )
        self.assertLessEqual(total, TOTAL_MAX_BYTES, f"static/img = {total / 1024:.0f} KB")


if __name__ == "__main__":
    unittest.main()
