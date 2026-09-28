"""Construye la pantalla de arranque de la PWA (ADR-030) a partir de
mascotas.json, arranque.css y arranque.js.

Lo usan dos sitios, para que lo que se enseña sea lo que se instala:
- pwa/patch_dist.py, que la mete en dist/index.html con la mascota elegida
  en config.json;
- el generador de la página de propuestas, que pinta las tres.

Todo es HTML, CSS y SVG en línea: la pantalla tiene que verse en el primer
instante, antes de que llegue ningún archivo más.
"""
import html
import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent


def datos():
    return json.loads((AQUI / "mascotas.json").read_text())


def mascota_elegida():
    return json.loads((AQUI / "config.json").read_text())["mascota"]


def _rects(filas, paleta):
    """Una fila de píxeles del mismo color = un solo <rect> (menos nodos que dibujar)."""
    partes = []
    for y, fila in enumerate(filas):
        x = 0
        while x < len(fila):
            c = fila[x]
            if c == ".":
                x += 1
                continue
            fin = x
            while fin + 1 < len(fila) and fila[fin + 1] == c:
                fin += 1
            partes.append(f'<rect x="{x}" y="{y}" width="{fin - x + 1}" height="1" fill="{paleta[c]}"/>')
            x = fin + 1
    return "".join(partes)


def _paleta(d, m):
    return {**d["paleta"], "X": m["extra"]["color"]}


def svg_sprite(filas, paleta, clase, ancho, alto):
    return (
        f'<svg class="{clase}" viewBox="0 0 {ancho} {alto}" shape-rendering="crispEdges" '
        f'aria-hidden="true" focusable="false">{_rects(filas, paleta)}</svg>'
    )


def svg_mascota(d, clave):
    m = d["mascotas"][clave]
    paleta = _paleta(d, m)
    grupos = "".join(
        f'<g class="aa-cuadro aa-c-{nombre}">{_rects(filas, paleta)}</g>' for nombre, filas in m["cuadros"].items()
    )
    return (
        f'<svg class="aa-sprite" viewBox="0 0 {d["ancho"]} {d["alto"]}" shape-rendering="crispEdges" '
        f'aria-hidden="true" focusable="false">{grupos}</svg>'
    )


def _barra(tipo):
    if tipo == "cadena":
        return '<div class="aa-barra aa-cadena" aria-hidden="true">' + "<i></i>" * 10 + "</div>"
    if tipo == "tarjetas":
        return '<div class="aa-barra aa-tarjetas" aria-hidden="true">' + "<i></i>" * 8 + "</div>"
    return '<div class="aa-barra aa-cinta" aria-hidden="true"><i></i></div>'


def html_pantalla(d, clave, id_raiz="ancla-arranque"):
    """El marcado de la pantalla para una mascota. `id_raiz` cambia en la página de propuestas (hay tres)."""
    m = d["mascotas"][clave]
    paleta = _paleta(d, m)
    extras = d["extras"]
    base = svg_sprite(m["base"], paleta, "aa-base", d["ancho"], d["alto"]) if "base" in m else ""
    pregunta = svg_sprite(extras["pregunta"], paleta, "aa-pregunta", 5, 7)
    burbujas = ""
    if clave == "ancla":
        burbuja = svg_sprite(extras["burbuja"], paleta, "", 4, 4)
        burbujas = '<div class="aa-burbujas">' + "".join(f"<span>{burbuja}</span>" for _ in range(3)) + "</div>"
    cabo = '<div class="aa-cabo"></div>' if clave == "ancla" else ""
    sombra = '<div class="aa-sombra"></div>' if clave == "memo" else ""
    return f"""<div id="{id_raiz}" class="aa-raiz" data-mascota="{clave}" data-estado="cargando" style="--aa-extra:{m['extra']['color']}">
  <div class="aa-escena">
    <div class="aa-mascota">
      {sombra}{base}
      <div class="aa-colgante">{cabo}{svg_mascota(d, clave)}</div>
      {burbujas}{pregunta}
    </div>
    <p class="aa-titulo">Ancla</p>
    <p class="aa-estado" role="status" aria-live="polite">Preparando tu memoria…</p>
    {_barra(m["barra"])}
    <div class="aa-error">
      <p class="aa-error-titulo">Algo no cargó bien</p>
      <p class="aa-error-texto">Tus datos siguen guardados en este teléfono. Vuelve a intentarlo.</p>
      <button type="button" class="aa-boton" data-accion="reintentar">Reintentar</button>
      <button type="button" class="aa-enlace" data-accion="detalles" aria-expanded="false">Ver detalles</button>
      <div class="aa-detalle">
        <pre class="aa-detalle-texto"></pre>
        <button type="button" class="aa-enlace" data-accion="forzar">Forzar actualización</button>
        <p class="aa-nota">Vuelve a descargar la app. Tus datos no se tocan.</p>
      </div>
    </div>
  </div>
</div>"""


def css():
    return (AQUI / "arranque.css").read_text()


def js():
    return (AQUI / "arranque.js").read_text()


def escapar(texto):
    return html.escape(texto, quote=True)
