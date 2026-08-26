#!/usr/bin/env python3
"""Post-build PWA: inyecta manifest + SW en dist/ y copia íconos.

Uso: python3 pwa/patch_dist.py   (correr después de `npx expo export --platform web`)
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PWA = ROOT / "pwa"

assert (DIST / "index.html").exists(), "dist/index.html no existe; corre `npx expo export --platform web` primero"

# 2. Copiar manifest, sw.js, íconos y .nojekyll (evita que Jekyll ignore _expo/)
shutil.copy(PWA / "manifest.json", DIST / "manifest.json")
shutil.copy(PWA / "sw.js", DIST / "sw.js")
(DIST / ".nojekyll").touch()
icons = DIST / "icons"
icons.mkdir(exist_ok=True)
for size in (192, 512):
    shutil.copy(PWA / "icons" / f"icon-{size}.png", icons / f"icon-{size}.png")

# 2. Inyectar en index.html (idempotente)
html = (DIST / "index.html").read_text()
if "manifest.json" not in html:
    inject = (
        '<link rel="manifest" href="manifest.json"/>\n'
        '  <meta name="theme-color" content="#101029"/>\n'
        '  <link rel="apple-touch-icon" href="icons/icon-192.png"/>\n'
        '  <meta name="apple-mobile-web-app-capable" content="yes"/>\n'
        '  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>\n'
        '  <meta name="apple-mobile-web-app-title" content="Ancla"/>\n'
        '  <script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));</script>\n'
    )
    html = html.replace("</head>", inject + "</head>")
    (DIST / "index.html").write_text(html)
    print("index.html: manifest + SW inyectados")
else:
    print("index.html: ya estaba parcheado")

print("PWA lista en dist/")
