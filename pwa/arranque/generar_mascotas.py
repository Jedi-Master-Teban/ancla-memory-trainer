#!/usr/bin/env python3
"""Genera pwa/arranque/mascotas.json: las tres mascotas pixel art de la
pantalla de arranque (ADR-030).

Uso: python3 pwa/arranque/generar_mascotas.py

Cada mascota se compone con figuras simples (elipses, rectángulos) y un
contorno automático: todo píxel vacío que toca la figura se vuelve tinta. Así
las tres comparten el mismo trazo. Los detalles (ojos, rubor, pico) van a mano,
píxel a píxel.

Paleta: los tonos de Soft UI (src/tema/colores.ts, tema SOFT) más UN color de
los botones de respuesta por mascota — la regla que pidió el operador.
"""
import json
from pathlib import Path

SALIDA = Path(__file__).resolve().parent / "mascotas.json"
# Memo también vive dentro de la app (Inicio y resumen de sesión, ADR-033):
# el mismo dibujo, escrito como módulo TypeScript para no leer JSON de pwa/.
SALIDA_APP = Path(__file__).resolve().parents[2] / "src" / "domain" / "mascota" / "sprites.ts"

# Tonos de Soft UI (tema SOFT de src/tema/colores.ts).
SOFT = {
    "K": "#2D2A26",  # ink — contorno y ojos
    "M": "#7A756C",  # inkMuted — sombra, plumas, piel de elefante
    "C": "#E8E5DF",  # track / borderMuted — gris claro
    "W": "#FAF9F7",  # card — blancos
    "O": "#FF6B35",  # accent1 — el naranja de Ancla
    "o": "#FFB399",  # accent2 — rubor, orejas
}

AN = AL = 24


def lienzo():
    return [["."] * AN for _ in range(AL)]


def elipse(g, cx, cy, rx, ry, c):
    for y in range(AL):
        for x in range(AN):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                g[y][x] = c


def rect(g, x0, y0, x1, y1, c):
    for y in range(max(0, y0), min(AL, y1 + 1)):
        for x in range(max(0, x0), min(AN, x1 + 1)):
            g[y][x] = c


def pix(g, puntos, c):
    for x, y in puntos:
        if 0 <= x < AN and 0 <= y < AL:
            g[y][x] = c


def contorno(g):
    """Todo píxel vacío con un vecino (4 direcciones) relleno pasa a tinta."""
    copia = [fila[:] for fila in g]
    for y in range(AL):
        for x in range(AN):
            if g[y][x] != ".":
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < AN and 0 <= ny < AL and g[ny][nx] not in (".", "K"):
                    copia[y][x] = "K"
                    break
    return copia


def filas(g):
    return ["".join(f) for f in g]


# ── 1. Ancla: el ancla marinera · azul «Fácil» ───────────────────────────────
def ancla(cuadro):
    g = lienzo()
    rect(g, 11, 0, 12, 1, "X")  # cabo del que cuelga
    elipse(g, 12, 5, 3.2, 3.2, "O")  # arganeo
    rect(g, 11, 4, 12, 5, ".")
    elipse(g, 12, 15.6, 4.7, 5.2, "W")  # caña con cara (antes del cepo: el cepo va delante)
    rect(g, 11, 8, 12, 9, "W")  # cuello
    rect(g, 4, 9, 19, 10, "O")  # cepo
    # brazos: media corona elíptica
    for y in range(AL):
        for x in range(AN):
            dentro = ((x + 0.5 - 12) / 9.6) ** 2 + ((y + 0.5 - 15) / 7.4) ** 2 <= 1
            hueco = ((x + 0.5 - 12) / 7.4) ** 2 + ((y + 0.5 - 15) / 5.2) ** 2 <= 1
            if dentro and not hueco and y >= 16:
                g[y][x] = "O"
    pix(g, [(1, 14), (2, 14), (2, 15), (1, 15), (2, 13), (21, 14), (22, 14), (21, 15), (22, 15), (21, 13)], "O")  # uñas
    g = contorno(g)
    if cuadro == "quieto":
        pix(g, [(10, 13), (10, 14), (13, 13), (13, 14)], "K")
    elif cuadro == "parpadeo":
        pix(g, [(10, 14), (13, 14)], "K")
    else:  # error: ojos cerrados de mareo
        pix(g, [(9, 14), (10, 14), (13, 14), (14, 14)], "K")
    pix(g, [(9, 16), (14, 16)], "o")
    if cuadro == "error":
        pix(g, [(11, 17), (12, 17), (11, 18), (12, 18)], "K")  # boca de «¡oh!»
    else:
        pix(g, [(10, 17), (13, 17), (11, 18), (12, 18)], "K")  # sonrisa
    return filas(g)


def con_borde(g, cx, cy, rx, ry, c):
    """Elipse con su propio trazo encima de lo que ya hay (separa figuras del mismo color)."""
    elipse(g, cx, cy, rx + 1, ry + 1, "K")
    elipse(g, cx, cy, rx, ry, c)


# ── 2. Memo: la mascota de Ancla · verde «Bien» ──────────────────────────────
# Elefante —el que nunca olvida— con astas de venado en el naranja de Ancla,
# para que no sea un elefante cualquiera sino una criatura propia de la app.
# Además de los tres cuadros de la pantalla de arranque tiene dos para la app:
# «dormido» (Inicio sin racha, con Zzz) y «feliz» (al cumplir la meta).
ASTA_IZQUIERDA = [(8, 3), (6, 2), (7, 2), (4, 1), (5, 1), (6, 1), (4, 0), (6, 0)]
ASTAS = ASTA_IZQUIERDA + [(23 - x, y) for x, y in ASTA_IZQUIERDA]


def memo(cuadro):
    g = lienzo()
    # cuerpo, patas y astas: todo lo que va detrás de la cabeza
    elipse(g, 12, 18.6, 5.4, 4.2, "M")
    rect(g, 7, 19, 9, 22, "M")
    rect(g, 14, 19, 16, 22, "M")
    pix(g, ASTAS, "O")
    g = contorno(g)
    pix(g, [(7, 22), (8, 22), (9, 22), (14, 22), (15, 22), (16, 22)], "C")  # uñas
    pix(g, [(10, 21), (13, 21)], "K")  # separación de las patas
    # orejas: se abren al parpadear y en la alarma
    abre = 0.7 if cuadro in ("parpadeo", "error") else 0
    for cx in (5.2 - abre, 18.8 + abre):
        con_borde(g, cx, 9.4, 3.6, 4.6, "M")
        elipse(g, cx + (0.6 if cx < 12 else -0.6), 9.6, 2.2, 3.2, "o")
    # cabeza, con trazo propio para separarla de las orejas
    con_borde(g, 12, 9.4, 6.0, 5.4, "M")
    if cuadro == "error":
        # alarma: la trompa en alto, sobre la cabeza y entre las astas, con la
        # punta abierta; debajo asoma la boca abierta
        rect(g, 10, 1, 13, 11, "K")
        rect(g, 11, 2, 12, 11, "M")
        pix(g, [(9, 0), (10, 0), (11, 0), (12, 0), (13, 0), (14, 0), (9, 1), (14, 1)], "K")
        pix(g, [(10, 1), (13, 1)], "M")
        pix(g, [(11, 12), (12, 12), (11, 13), (12, 13)], "K")
    else:
        # trompa delante del cuerpo, con trazo propio y la punta en gancho
        rect(g, 10, 13, 13, 19, "K")
        rect(g, 11, 12, 12, 18, "M")
        pix(g, [(14, 16), (14, 17), (14, 18)], "K")
        pix(g, [(13, 17), (13, 18)], "M")
    # ojos
    if cuadro == "quieto":
        pix(g, [(8, 9), (9, 9), (8, 10), (9, 10), (14, 9), (15, 9), (14, 10), (15, 10)], "K")
        pix(g, [(9, 9), (15, 9)], "W")
    elif cuadro in ("parpadeo", "dormido"):
        pix(g, [(8, 10), (9, 10), (14, 10), (15, 10)], "K")
    elif cuadro == "feliz":
        pix(g, [(7, 10), (8, 9), (9, 10), (14, 10), (15, 9), (16, 10)], "K")  # ojos en arco: ^ ^
    else:  # error: ojos muy abiertos
        rect(g, 7, 8, 9, 10, "W")
        rect(g, 14, 8, 16, 10, "W")
        pix(g, [(8, 9), (15, 9)], "K")
    if cuadro != "error":
        pix(g, [(7, 12), (16, 12)], "o")  # rubor
    return filas(g)


# ── 3. Lumi: el búho de estudio · ámbar «Difícil» ────────────────────────────
def lumi_base():
    """El libro: capa fija bajo la búho, que salta sin moverlo."""
    g = lienzo()
    rect(g, 3, 21, 20, 22, "O")  # tapa
    rect(g, 4, 21, 19, 21, "W")  # canto de las páginas
    return filas(contorno(g))


def lumi(cuadro):
    g = lienzo()
    elipse(g, 12, 12.6, 8, 8.4, "M")  # cuerpo
    pix(g, [(5, 3), (5, 4), (6, 4), (5, 5), (6, 5), (7, 5), (18, 3), (18, 4), (17, 4), (18, 5), (17, 5), (16, 5)], "M")  # penachos
    elipse(g, 12, 17.4, 5, 4, "C")  # pecho
    for cx in (9.0, 15.0):  # disco facial
        elipse(g, cx, 10.0, 3.6, 3.6, "W")
    g = contorno(g)
    pix(g, [(10, 16), (11, 17), (12, 17), (13, 16), (10, 19), (11, 20), (12, 20), (13, 19)], "M")  # plumas del pecho
    for x0 in (7, 13):  # ojos de 4×4
        if cuadro == "quieto":
            pix(g, [(x0 + 1, 8), (x0 + 2, 8), (x0, 9), (x0 + 3, 9), (x0, 10), (x0 + 3, 10), (x0 + 1, 11), (x0 + 2, 11)], "X")
            pix(g, [(x0 + 1, 9), (x0 + 1, 10), (x0 + 2, 10)], "K")
            pix(g, [(x0 + 2, 9)], "W")
        elif cuadro == "parpadeo":
            pix(g, [(x0, 10), (x0 + 1, 10), (x0 + 2, 10), (x0 + 3, 10)], "K")
            pix(g, [(x0, 9), (x0 + 3, 9)], "X")
        else:  # error: ojos de susto
            pix(g, [(x0, 8), (x0 + 1, 8), (x0 + 2, 8), (x0 + 3, 8), (x0, 9), (x0 + 3, 9), (x0, 10), (x0 + 3, 10), (x0, 11), (x0 + 1, 11), (x0 + 2, 11), (x0 + 3, 11)], "X")
            pix(g, [(x0 + 1, 10)], "K")
    pix(g, [(11, 12), (12, 12), (11, 13), (12, 13)], "O")  # pico
    pix(g, [(9, 20), (10, 20), (13, 20), (14, 20)], "O")  # patas
    return filas(g)


MASCOTAS = {
    "ancla": {
        "nombre": "Ancla",
        "descripcion": "El ancla de la marca, con cara. Cuelga de su cabo y se mece como un péndulo mientras suben burbujas.",
        "extra": {"clave": "facil", "nombre": "Fácil", "color": "#3B82F6"},
        "movimiento": "péndulo",
        "barra": "cadena",
        "fn": ancla,
    },
    "memo": {
        "nombre": "Memo",
        "descripcion": "Un elefante —el que nunca olvida— con astas de venado en el naranja de Ancla: una mascota solo de esta app. Camina en su sitio y agita las orejas; en un error, levanta la trompa, alarmado.",
        "extra": {"clave": "bien", "nombre": "Bien", "color": "#10B981"},
        "movimiento": "paso",
        "barra": "tarjetas",
        "fn": memo,
        "cuadros": ("quieto", "parpadeo", "error", "dormido", "feliz"),
        "senal_error": "exclamacion",
    },
    "lumi": {
        "nombre": "Lumi",
        "descripcion": "Una búho de estudio sobre un libro. Parpadea, ladea la cabeza y da saltitos; sus ojos son del ámbar de «Difícil».",
        "extra": {"clave": "dificil", "nombre": "Difícil", "color": "#F59E0B"},
        "movimiento": "salto",
        "barra": "marcapáginas",
        "fn": lumi,
        "base": lumi_base,
    },
}


# Sprites pequeños compartidos: se pintan con el color extra de la mascota.
EXTRAS = {
    "pregunta": [".XXX.", "X...X", "....X", "...X.", "..X..", ".....", "..X.."],
    "exclamacion": ["XX", "XX", "XX", "XX", "..", "XX"],
    "burbuja": [".XX.", "X..X", "X..X", ".XX."],
    # Para la app: la z del sueño (gris cálido) y el destello de celebración.
    "z": ["MMMM", "..M.", ".M..", "MMMM"],
    "destello": [".X.", "XXX", ".X."],
}


def main():
    salida = {"ancho": AN, "alto": AL, "paleta": SOFT, "extras": EXTRAS, "mascotas": {}}
    for clave, m in MASCOTAS.items():
        cuadros = {c: m["fn"](c) for c in m.get("cuadros", ("quieto", "parpadeo", "error"))}
        for nombre, filas_ in cuadros.items():
            assert len(filas_) == AL and all(len(f) == AN for f in filas_), (clave, nombre)
            usados = set("".join(filas_)) - {"."}
            assert usados <= set(SOFT) | {"X"}, (clave, nombre, usados)
        datos = {k: v for k, v in m.items() if k not in ("fn", "base", "cuadros")} | {"cuadros": cuadros}
        if "base" in m:
            datos["base"] = m["base"]()
        salida["mascotas"][clave] = datos
    SALIDA.write_text(json.dumps(salida, ensure_ascii=False, indent=1) + "\n")
    print(f"mascotas.json: {', '.join(salida['mascotas'])}")
    SALIDA_APP.write_text(modulo_app(salida))
    print(f"{SALIDA_APP.relative_to(SALIDA_APP.parents[3])}: memo")


def _lista_ts(filas, sangria):
    dentro = "".join(f"{sangria}  '{f}',\n" for f in filas)
    return f"[\n{dentro}{sangria}]"


def modulo_app(salida):
    """src/domain/mascota/sprites.ts: Memo para la app, con los mismos datos que mascotas.json."""
    memo = salida["mascotas"]["memo"]
    paleta = salida["paleta"] | {"X": memo["extra"]["color"]}
    lineas_paleta = "".join(f"  {k}: '{v}',\n" for k, v in paleta.items())
    cuadros = "".join(f"  {nombre}: {_lista_ts(filas, '  ')},\n" for nombre, filas in memo["cuadros"].items())
    extras = "".join(
        f"  {nombre}: [{', '.join(repr(f) for f in salida['extras'][nombre])}],\n" for nombre in ("z", "destello")
    )
    return f"""// Generado por pwa/arranque/generar_mascotas.py con los mismos datos de
// pwa/arranque/mascotas.json. No se edita a mano: se cambia el generador y se
// vuelve a correr (memo.test.ts comprueba que ambos coinciden).

/** Lado de cada cuadro, en píxeles del dibujo. */
export const LADO_SPRITE = {salida["ancho"]};

/**
 * Cada carácter de un cuadro es un píxel: la clave de su color aquí, o '.'
 * si es transparente. Tonos de Soft UI más X, el verde de «Bien».
 */
export const PALETA_MEMO = {{
{lineas_paleta}}} as const;

/**
 * Los cuadros de Memo (ADR-033). quieto, parpadeo y error son los de la
 * pantalla de arranque; dormido (ojos cerrados, orejas en reposo) y feliz
 * (ojos en arco) son para la app.
 */
export const CUADROS_MEMO = {{
{cuadros}}} as const;

/** La z del sueño y el destello de la celebración, del mismo pixel art. */
export const EXTRAS_MEMO = {{
{extras}}} as const;

export type CuadroMemo = keyof typeof CUADROS_MEMO;
export type ColorSprite = keyof typeof PALETA_MEMO;
"""


if __name__ == "__main__":
    main()
