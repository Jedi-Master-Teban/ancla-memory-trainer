#!/usr/bin/env python3
"""Post-build PWA: inyecta manifest, service worker y pantalla de arranque en
dist/ y copia íconos.

Uso: python3 pwa/patch_dist.py   (correr después de `npx expo export --platform web`)
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PWA = ROOT / "pwa"

sys.path.insert(0, str(PWA / "arranque"))
import construir  # noqa: E402  (pwa/arranque/construir.py)


def fondo_del_tema(nombre: str) -> str:
    """Valor de `bg` del tema `nombre` en src/tema/colores.ts (única fuente)."""
    fuente = (ROOT / "src/tema/colores.ts").read_text()
    m = re.search(r"const " + nombre + r": TokensColor = \{.*?\n\s*bg: '(#[0-9A-Fa-f]{6})'", fuente, re.S)
    if not m:
        sys.exit(f"patch_dist: no encontré `bg` del tema {nombre} en src/tema/colores.ts")
    return m.group(1)


def base_url() -> str:
    """'/ancla-memory-trainer/', leída de app.json (experiments.baseUrl)."""
    app = json.loads((ROOT / "app.json").read_text())
    base = app["expo"].get("experiments", {}).get("baseUrl", "")
    return base.rstrip("/") + "/"


assert (DIST / "index.html").exists(), "dist/index.html no existe; corre `npx expo export --platform web` primero"
BASE = base_url()
FONDO = fondo_del_tema("SOFT")

# 1. Copiar manifest, sw.js, íconos y .nojekyll (evita que Jekyll ignore _expo/)
#
#    Los colores del manifest (pantalla de arranque del sistema y tinte) salen
#    del mismo token que el fondo del documento — ver 2a.
manifest = json.loads((PWA / "manifest.json").read_text())
manifest["background_color"] = manifest["theme_color"] = FONDO
(DIST / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
shutil.copy(PWA / "sw.js", DIST / "sw.js")
(DIST / ".nojekyll").touch()
icons = DIST / "icons"
icons.mkdir(exist_ok=True)
for size in (192, 512):
    shutil.copy(PWA / "icons" / f"icon-{size}.png", icons / f"icon-{size}.png")

html = (DIST / "index.html").read_text()

# 2a. Fondo del documento = fondo del tema por defecto.
#
#     iOS pinta con el fondo de html/body todo lo que queda FUERA del área
#     segura: la franja bajo el reloj y la del indicador de inicio. También se
#     ve durante el ~1 s que tarda la app en montar.
#
#     Se LEE de src/tema/colores.ts en vez de escribirse aquí. Antes era un
#     `#101029` copiado a mano del fondo de Arcade Neón; cuando Soft UI pasó a
#     ser el tema por defecto nadie lo actualizó, y la app quedó con una franja
#     azul casi negra encima de un fondo crema. Una copia de un token siempre
#     termina desincronizándose — por eso no hay copia.
if "ancla-body-bg" not in html:
    html = html.replace("</style>", f'</style>\n<style id="ancla-body-bg">html,body{{background:{FONDO}}}</style>\n', 1)

# 2b. La interfaz está en español: lo que leen VoiceOver y el traductor de Safari.
html = html.replace('<html lang="en">', '<html lang="es-CO">', 1)

# 2c. Manifest, íconos y service worker con dirección ABSOLUTA. Con relativas,
#     una ruta interna (/ancla-memory-trainer/hojear/colgadero) buscaba
#     /…/hojear/manifest.json y el registro del service worker fallaba.
if "manifest.json" not in html:
    inject = (
        f'<link rel="manifest" href="{BASE}manifest.json"/>\n'
        f'  <meta name="theme-color" content="{FONDO}"/>\n'
        f'  <link rel="apple-touch-icon" href="{BASE}icons/icon-192.png"/>\n'
        # Pestaña y marcadores de Safari: el mismo ícono que la pantalla de
        # inicio. Sin esto el build no llevaba favicon y salía uno genérico.
        f'  <link rel="icon" type="image/png" href="{BASE}icons/icon-192.png"/>\n'
        '  <meta name="apple-mobile-web-app-capable" content="yes"/>\n'
        # `default` = reloj y batería en OSCURO. `black-translucent` los pinta
        # siempre en blanco, que sobre el crema de Soft UI no se ve. iOS lee
        # este valor solo al abrir la app: no puede seguir al tema en vivo.
        '  <meta name="apple-mobile-web-app-status-bar-style" content="default"/>\n'
        '  <meta name="apple-mobile-web-app-title" content="Ancla"/>\n'
        '  <script>if("serviceWorker" in navigator)window.addEventListener("load",function(){'
        f'navigator.serviceWorker.register("{BASE}sw.js",{{scope:"{BASE}"}})}});</script>\n'
    )
    html = html.replace("</head>", inject + "</head>")

# 3. Pantalla de arranque (ADR-030): HTML, CSS y SVG en línea, visibles desde el
#    primer instante. Si el JavaScript de la app no llega o no arranca, ella
#    muestra el error con «Reintentar» en vez de una pantalla en blanco. Sustituye
#    al antiguo banner amarillo de diagnóstico, cuyo texto técnico queda en
#    «Ver detalles».
if 'id="ancla-arranque"' not in html:
    datos = construir.datos()
    mascota = construir.mascota_elegida()
    html = html.replace("</head>", f'<style id="ancla-arranque-css">{construir.css()}</style>\n</head>', 1)
    pantalla = (
        construir.html_pantalla(datos, mascota)
        + f'\n<script>window.__ANCLA_BASE__="{BASE}";</script>'
        + f"\n<script>{construir.js()}</script>\n"
    )
    html = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + "\n" + pantalla, html, count=1)
    print(f"pantalla de arranque con la mascota «{datos['mascotas'][mascota]['nombre']}»")

(DIST / "index.html").write_text(html)

# 4. 404.html = la propia app. GitHub Pages responde a cualquier ruta que no
#    existe con 404.html (y estado 404): así una ruta interna abierta sin
#    service worker —primera visita, o caché borrada— carga la app en vez de la
#    página de error de GitHub. El enrutador de la app lee la ruta de la URL.
shutil.copy(DIST / "index.html", DIST / "404.html")
print(f"PWA lista en dist/ (base {BASE})")
