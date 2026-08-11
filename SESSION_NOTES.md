# SESSION_NOTES

**Sesión:** 2026-08-10 → 2026-08-11 · **Modelo:** Opus (Plan Mode) · **Fase:** ninguna — sesión de planeación (§12.1–12.2)

## Estado de la fase

**Fase 0 no empezada.** Esta sesión no escribió código de app: produjo la
gobernanza de tres capas del brief (§2) y el plan de fases. Salida exclusivamente
`.md`, según §3.

## Qué se hizo

- Lectura completa de `PROJECT_BRIEF.md` (281 líneas).
- Cuatro ambigüedades consultadas con el operador y resueltas → ADR-001, 003, 004, 005.
- Capa 1: `CLAUDE.md` — 134 líneas (límite 200).
- Capa 2: 6 Skills en `.claude/skills/` — máx. 141 líneas cada una (límite 500).
- Capa 3: 4 comandos en `.claude/commands/`.
- `agent_docs/` con 7 documentos base + 9 specs de módulo + 2 semillas.
- Plan de 9 fases con archivos concretos y `done when` literales → `agent_docs/PLAN-FASES.md`.
- Validación manual de las 100 palabras colgadero contra la tabla fonética de §7.2:
  **las 100 decodifican correctamente**.

## Qué archivos se tocaron y por qué

| Archivo | Cambio | Por qué |
|---|---|---|
| `CLAUDE.md` | Creado (134 líneas) | Capa 1 de §2.1 |
| `.claude/skills/{nueva-fase,verificacion,fsrs-review,verificar-api-libreria,db-migracion,cierre-sesion}/SKILL.md` | Creados | Capa 2 de §2.2 — las 3 primeras las exige el brief; las 3 últimas cubren procedimientos igual de recurrentes |
| `.claude/commands/{nueva-fase,verificar,cerrar-sesion,estado}.md` | Creados | Capa 3 de §2.3 + ritual de recuperación de §5.3 |
| `agent_docs/PLAN-FASES.md` | Creado | Plan de §11 con archivos concretos por fase |
| `agent_docs/DECISIONS.md` | Creado | 10 ADRs + 4 pendientes abiertos (§5.2) |
| `agent_docs/ANTI-ALUCINACION.md` | Creado | §4 completo |
| `agent_docs/MODELO-DATOS.md` | Creado | §9 refinado con 3 divergencias justificadas |
| `agent_docs/decodificacion-fonetica.md` | Creado | Ruta exigida literalmente por §7.2 |
| `agent_docs/{README,GLOSARIO}.md` | Creados | Índice y vocabulario ES ↔ código |
| `agent_docs/modulos/01..09-*.md` | Creados | Un spec por módulo de §8 |
| `agent_docs/seeds/{colgadero-100,naipes-52}.md` | Creados | Datos semilla y sus reglas |

**Fuera del alcance declarado:** ninguno. No se creó `.gitignore` ni se corrió
`git init` a propósito: no son `.md` y pertenecen a la Fase 0.

## Verificado vs. sin verificar

**Verificado:**
- Solo se escribieron `.md`: `find . -type f -not -name "*.md"` → únicamente
  `./.DS_Store`, preexistente de Finder.
- `wc -l CLAUDE.md` → **134** (≤ 200 ✓).
- Ninguna Skill supera 141 líneas (≤ 500 ✓).
- Los 9 módulos de §8 tienen spec y fase → matriz en `PLAN-FASES.md`.
- Las 100 palabras colgadero decodifican a su número (revisión manual, una por una).
- Entorno: node v22.22.3, npm 11.17.0. `expo` y `watchman` no instalados globalmente
  (no hace falta: se usa `npx`).
- Raíz git actual = `~/Código`; `memory-trainer/` está sin trackear ahí.

**Sin verificar (nadie ha ejecutado nada todavía):**
- Que el SDK de Expo más reciente estable soporte todo lo del stack de §6.
- Las firmas reales de `ts-fsrs`, `expo-sqlite`, `expo-notifications`, `expo-router`.
  **Ninguna firma concreta se escribió en estos documentos** — a propósito: se
  verifican en la Fase 0 con la Skill `verificar-api-libreria`.
- Que `expo-notifications` dispare notificaciones locales dentro de Expo Go (P-4).

## Qué sigue (lo primero que debe hacer la próxima sesión)

1. **El operador aprueba o corrige este PR de planeación.**
2. **El operador cambia el modelo a Sonnet** (§12.3). El agente no puede cambiarlo solo.
3. Ejecutar `/nueva-fase 0`.
4. Dentro de la Fase 0, antes de scaffolding: `git init` en `memory-trainer/` (ADR-005)
   y `.gitignore`.
5. Correr `verificar-api-libreria` sobre Expo SDK, `expo-router`, `expo-sqlite` y
   `ts-fsrs`, y anotar las versiones reales en `DECISIONS.md`.

## Bloqueos actuales

| Bloqueo | Dueño | Bloquea a |
|---|---|---|
| P-1 · Consonantes reservadas de Sota / Reina / Rey | Operador | Fase 3 (12 de 52 cartas) |
| P-2 · Visto bueno a ADR-002 (dirección inversa = misma tarjeta) | Operador | Fase 4 |
| P-3 · ¿Palabra colgadero para el `0` suelto y el trozo `00`? | Operador | Fase 4 |
| P-4 · ¿`expo-notifications` funciona en Expo Go? | Agente (spike) | Fase 8 |

Ninguno bloquea las Fases 0, 1 y 2.

## Qué debe saber la próxima sesión antes de continuar

- **La numeración del brief tiene deriva interna.** §2.2 cita "Sección 9" para las
  fases (son §11) y "5.1" para FSRS (es §8.1). Guiarse por el **contenido**, no por
  el número. Mapeo usado: §3 restricciones · §4 anti-alucinación · §8 módulos ·
  §9 modelo de datos · §11 fases · §12 protocolo de sesión.
- **Tres cosas del §9 se refinaron a propósito** (el brief lo autoriza: "borrador
  orientativo, no copiar literalmente"): `retrievability` y el `estado` de 4 valores
  se **derivan** en vez de almacenarse, y `categoria` va **sin `CHECK`** en SQL.
  Razones en ADR-006 y ADR-009. **No "restaurarlas" al leer §9 literalmente.**
- **`palabra_clave` ya no está en el enum activo** (ADR-003, decisión del operador).
  Enum activo: `colgadero | naipe | lista_item | numero`.
- **Las 52 palabras de naipes no las inventa el agente.** El operador dictó las
  *reglas*; el agente implementa el validador y **propone** candidatas marcadas como
  tales. Solo se persiste lo que el operador aprueba (ADR-004).
- **La trampa de la Fase 3:** la letra inicial de palo es un marcador, no un fonema.
  D vale 1, P vale 9 y C vale 4/6 — si no se saltan, todas las cartas de esos tres
  palos decodifican mal de forma plausible. Detalle en `seeds/naipes-52.md` §3.
- **El `done when` de la Fase 5 tarda dos días de calendario.** Se cierra en dos
  tiempos; hasta la confirmación del día +1 se marca "cerrada a la espera de
  confirmación", nunca "hecha".
- **Callejón ya explorado:** poner un `CHECK (categoria IN ...)` en SQLite parece la
  opción segura y es una trampa — no se puede alterar sin reconstruir la tabla, que
  es justo la migración destructiva que §3 prohíbe.

## Decisiones que fueron a DECISIONS.md

ADR-001 a ADR-010, más los pendientes P-1 a P-4.
