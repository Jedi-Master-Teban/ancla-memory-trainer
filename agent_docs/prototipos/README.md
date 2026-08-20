# Prototipos visuales — Fase 8 (Pulido)

Mockups estáticos, HTML autocontenido (sin dependencias del proyecto, sin
`npm install` — se abren directo en cualquier navegador). Son referencia de
diseño para cuando arranque la Fase 8; **no son código de la app real** y no
se importan desde `app/` ni `src/`.

## `direcciones/` — exploración inicial (histórico)

Tres direcciones estéticas distintas para decidir un rumbo, sobre la misma
pantalla (Dashboard). Cada una es de un solo tema fijo, sin selector.

| Archivo | Dirección | Elegida |
|---|---|---|
| `grimorio-nocturno.html` | Artes mnemónicas antiguas: tarot, tinta y oro sobre negro violeta. Cinzel + EB Garamond. | No |
| `arcade-neon.html` | Gamificación directa, estilo Duolingo: color saturado, rebote. Fredoka + Nunito. | **Sí** |
| `papel-y-tinta.html` | Cuaderno de apuntes cálido, editorial. Lora + Karla, tonos tierra. | **Sí** |

Se conservan como registro de por qué se descartó Grimorio Nocturno, no
porque vayan a construirse.

## `pantallas/` — pantallas clave en las dos direcciones elegidas

Cada archivo tiene **las dos paletas adentro** (Arcade Neón y Papel y
Tinta) con un botón para alternar entre ellas en vivo — mismos datos,
mismo layout, todos los tokens de color/tipografía/radio cambian juntos.
`ajustes.html` es además el propio selector: tocar una de las dos opciones
ahí cambia el tema, en vez de un botón aparte.

| Archivo | Qué muestra |
|---|---|
| `dashboard.html` | Racha, meta diaria, pendientes por categoría, CTA de practicar |
| `racha.html` | Racha en grande, heatmap de 90 días **con tooltip al tocar una celda** (fecha + tarjetas), configuración |
| `practicar.html` | Tarjeta de colgadero revelada + los 4 botones de calificación |
| `naipes.html` | **Diseño de carta real** (esquinas rango+palo, pip dibujado a mano, nunca emoji) + volteo mostrado como dos estados |
| `ajustes.html` | El selector de estilo real — tocar una opción cambia el tema de esta misma pantalla |

## Qué NO cubren todavía (ideas de `PLAN-FASES.md` §Fase 8 sin mockear)

- **Notificaciones** (`expo-notifications`, recordatorio nocturno o aviso
  in-app de racha en riesgo) — no es un elemento visual, no hay mockup posible
  más allá de un banner in-app, que tampoco se construyó todavía.
- **Animación real** — todo aquí es estático. El volteo de `naipes.html` se
  muestra como dos estados fijos, no como el `Animated`/`rotateY` real que
  pide el plan (ADR-022 ya decidió esa implementación, sin Three.js).

## Origen

Construidos con la skill de diseño de Claude, publicados primero como
canvas editable en un Artifact de claude.ai, y guardados aquí como HTML
plano — sin la maquinaria de esa skill (sin `support.js`, sin holes
`{{}}`) — para que queden legibles y abribles sin ninguna herramienta
especial, ordenados junto con el resto de la documentación del proyecto.
