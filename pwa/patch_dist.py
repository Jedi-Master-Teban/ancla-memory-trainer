#!/usr/bin/env python3
"""Post-build PWA: inyecta manifest + SW en dist/ y copia íconos.

Uso: python3 pwa/patch_dist.py   (correr después de `npx expo export --platform web`)
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PWA = ROOT / "pwa"

assert (DIST / "index.html").exists(), "dist/index.html no existe; corre `npx expo export --platform web` primero"

# 1. Copiar manifest, sw.js, íconos y .nojekyll (evita que Jekyll ignore _expo/)
shutil.copy(PWA / "manifest.json", DIST / "manifest.json")
shutil.copy(PWA / "sw.js", DIST / "sw.js")
(DIST / ".nojekyll").touch()
icons = DIST / "icons"
icons.mkdir(exist_ok=True)
for size in (192, 512):
    shutil.copy(PWA / "icons" / f"icon-{size}.png", icons / f"icon-{size}.png")

# 2. Inyectar en index.html (idempotente)
html = (DIST / "index.html").read_text()

# 2a. Fondo del body con el azul de la app: elimina la franja blanca de la
#     zona del status bar en iOS standalone (la app tarda ~1s en montar y
#     el body sin fondo deja ver el blanco del sistema).
BODY_BG = '<style id="ancla-body-bg">html,body{background:#101029}</style>\n'
if "ancla-body-bg" not in html:
    html = html.replace("</style>", "</style>\n" + BODY_BG, 1)
    print("body bg #101029 aplicado (fix franja blanca iOS)")

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
