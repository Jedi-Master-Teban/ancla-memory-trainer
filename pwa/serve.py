"""Servidor estático con fallback SPA para probar dist/ localmente.

Uso: python3 pwa/serve.py [puerto]
"""
import functools
import http.server
import os
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
DIST = Path(__file__).resolve().parent.parent / "dist"


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        target = self.translate_path(self.path)
        if not os.path.exists(target):
            self.path = "/index.html"  # fallback SPA
        return super().send_head()


if __name__ == "__main__":
    handler = functools.partial(SPAHandler, directory=str(DIST))
    print(f"Serving {DIST} at http://localhost:{PORT}")
    http.server.HTTPServer(("127.0.0.1", PORT), handler).serve_forever()
