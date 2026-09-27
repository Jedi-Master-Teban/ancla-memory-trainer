#!/usr/bin/env python3
"""Post-build PWA: inyecta manifest + SW en dist/ y copia íconos.

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


def fondo_del_tema(nombre: str) -> str:
    """Valor de `bg` del tema `nombre` en src/tema/colores.ts (única fuente)."""
    fuente = (ROOT / "src/tema/colores.ts").read_text()
    m = re.search(r"const " + nombre + r": TokensColor = \{.*?\n\s*bg: '(#[0-9A-Fa-f]{6})'", fuente, re.S)
    if not m:
        sys.exit(f"patch_dist: no encontré `bg` del tema {nombre} en src/tema/colores.ts")
    return m.group(1)


assert (DIST / "index.html").exists(), "dist/index.html no existe; corre `npx expo export --platform web` primero"

# 1. Copiar manifest, sw.js, íconos y .nojekyll (evita que Jekyll ignore _expo/)
#
#    Los colores del manifest (pantalla de arranque y tinte del sistema) salen
#    del mismo token que el fondo del documento — ver 2a.
manifest = json.loads((PWA / "manifest.json").read_text())
manifest["background_color"] = manifest["theme_color"] = fondo_del_tema("SOFT")
(DIST / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
shutil.copy(PWA / "sw.js", DIST / "sw.js")
(DIST / ".nojekyll").touch()
icons = DIST / "icons"
icons.mkdir(exist_ok=True)
for size in (192, 512):
    shutil.copy(PWA / "icons" / f"icon-{size}.png", icons / f"icon-{size}.png")

# 2. Inyectar en index.html (idempotente)
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
FONDO = fondo_del_tema("SOFT")
BODY_BG = f'<style id="ancla-body-bg">html,body{{background:{FONDO}}}</style>\n'
if "ancla-body-bg" not in html:
    html = html.replace("</style>", "</style>\n" + BODY_BG, 1)
    print(f"body bg {FONDO} aplicado (leído de src/tema/colores.ts)")

if "manifest.json" not in html:
    inject = (
        '<link rel="manifest" href="manifest.json"/>\n'
        f'  <meta name="theme-color" content="{FONDO}"/>\n'
        '  <link rel="apple-touch-icon" href="icons/icon-192.png"/>\n'
        # Pestaña y marcadores de Safari: el mismo ícono que la pantalla de
        # inicio. Sin esto el build no llevaba favicon y salía uno genérico.
        '  <link rel="icon" type="image/png" href="icons/icon-192.png"/>\n'
        '  <meta name="apple-mobile-web-app-capable" content="yes"/>\n'
        # `default` = reloj y batería en OSCURO. `black-translucent` los pinta
        # siempre en blanco, que sobre el crema de Soft UI no se ve. iOS lee
        # este valor solo al abrir la app: no puede seguir al tema en vivo.
        '  <meta name="apple-mobile-web-app-status-bar-style" content="default"/>\n'
        '  <meta name="apple-mobile-web-app-title" content="Ancla"/>\n'
        '  <script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));</script>\n'
    )
    html = html.replace("</head>", inject + "</head>")
    print("index.html: manifest + SW inyectados")
else:
    print("index.html: ya estaba parcheado")

# 3. Banner de diagnóstico en pantalla: si el JS principal falla, se ve el error
#    en vez de una pantalla blanca silenciosa (útil para depurar en el iPhone).
DIAG_ID = "ancla-diag"
BANNER_JS = """  <script>
  (function() {
    var d = document.getElementById("__DIAG_ID__");
    var set = function(t) { if (d) d.textContent = "Ancla: " + t; };
    window.addEventListener("error", function(e) {
      if (e.target && e.target !== window) {
        set("fallo al cargar " + String(e.target.src || e.target.href || "recurso").split("/").pop());
      } else {
        set("error JS: " + String(e.message).slice(0, 140));
      }
    }, true);
    window.addEventListener("unhandledrejection", function(e) {
      set("promesa rechazada: " + String((e.reason && e.reason.message) || e.reason).slice(0, 140));
    });
    setTimeout(function() {
      var root = document.getElementById("root");
      var vacio = !root || root.children.length === 0 || !root.innerText.trim();
      if (vacio) set("la app no monto contenido. Toca este mensaje para ocultarlo.");
    }, 15000);
    var obs = new MutationObserver(function() {
      var root = document.getElementById("root");
      if (root && root.innerText.trim().length > 10) {
        if (d) d.remove();
        obs.disconnect();
      }
    });
    var rootEl = document.getElementById("root");
    if (rootEl) obs.observe(rootEl, { childList: true, subtree: true });
  })();
  </script>
"""
if DIAG_ID not in html:
    banner = (
        '<div id="' + DIAG_ID + '" onclick="this.remove()" '
        'style="position:fixed;bottom:0;left:0;right:0;z-index:99999;'
        'background:#fff3cd;color:#664d03;font:12px monospace;padding:6px 10px;">'
        'Ancla: iniciando…</div>\n'
        + BANNER_JS.replace("__DIAG_ID__", DIAG_ID)
    )
    html = html.replace("</body>", banner + "</body>")
    print("banner de diagnóstico inyectado")
else:
    print("ya tenía banner")

(DIST / "index.html").write_text(html)
print("PWA lista en dist/")
