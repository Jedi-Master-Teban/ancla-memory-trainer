---
name: cierre-sesion
description: Ritual de handoff obligatorio al terminar cualquier sesión de trabajo, incluso si la fase quedó a medias. Úsala cuando el operador ejecute /cerrar-sesion, cuando diga que va a parar, cuando el contexto esté cerca del límite, o cuando la sesión vaya a terminar por cualquier motivo. Produce SESSION_NOTES.md.
---

# Skill: cierre de sesión

§12.6 del brief: **ninguna sesión termina sin esto.** Claude Code no tiene memoria
entre sesiones; `SESSION_NOTES.md` **es** la memoria. Lo que no quede escrito aquí,
se pierde — y la próxima sesión lo redescubre gastando contexto, o peor, contradice
una decisión ya tomada.

**Regla de fases:** en orden. Un paso que no aplique se marca **"N/A — [razón]"**.

---

## Paso 1 — Reconstruir lo que pasó de verdad

No de memoria: de la evidencia.

```bash
git status --short
git log --oneline -10
git diff --stat HEAD
```

**Criterio de salida:** lista real de archivos tocados, con su estado (commiteado,
modificado sin commitear, sin trackear).

## Paso 2 — Distinguir lo hecho de lo declarado

Para cada cosa que la sesión afirmó haber hecho, comprobar si hay evidencia
(§4.3 del brief). Si algo se dijo pero no se verificó, va a `SESSION_NOTES.md`
como **"sin verificar"**, no como hecho.

Este paso es el que evita que la próxima sesión construya sobre una base falsa.

**Criterio de salida:** cada afirmación clasificada como **verificada** (con
`archivo:línea` o salida de comando) o **sin verificar**.

## Paso 3 — Escribir `SESSION_NOTES.md`

**Se sobrescribe entero** cada sesión (§5.2): es un relevo, no una bitácora. Lo que
deba sobrevivir a largo plazo va a `agent_docs/DECISIONS.md`, no aquí.

```markdown
# SESSION_NOTES

**Sesión:** AAAA-MM-DD · **Modelo:** [Opus/Sonnet] · **Fase:** N — [nombre]

## Estado de la fase
[No empezada | En curso, paso N de nueva-fase | Cerrada a la espera de X | Cerrada]

## Qué se hizo
- [Acción concreta] → `archivo:línea`

## Qué archivos se tocaron y por qué
| Archivo | Cambio | Por qué |
|---|---|---|

## Verificado vs. sin verificar
**Verificado:** [con la evidencia]
**Sin verificar:** [lo que se afirmó pero no se comprobó]

## Qué sigue (lo primero que debe hacer la próxima sesión)
1. [Acción concreta, no "continuar la fase 3"]

## Bloqueos actuales
| Bloqueo | Dueño | Bloquea a |
|---|---|---|

## Qué debe saber la próxima sesión antes de continuar
- [Decisiones tomadas aquí, callejones sin salida ya explorados, cosas que NO hay
  que volver a intentar y por qué]

## Decisiones que fueron a DECISIONS.md
- [ADR-NNN] o "ninguna"
```

**Criterio de salida:** las 8 secciones presentes. Ninguna vacía sin un "ninguno"
explícito.

## Paso 4 — Trasladar lo permanente a `DECISIONS.md`

Si la sesión tomó alguna decisión de arquitectura irreversible o cara de revertir,
**no puede quedarse solo en `SESSION_NOTES.md`**: ese archivo se sobrescribe la
próxima vez.

ADR nuevo al final de `agent_docs/DECISIONS.md`. Nunca editar uno existente.
Actualizar también la tabla de pendientes si alguno se resolvió o apareció.

**Criterio de salida:** ADRs añadidos, o "N/A — no hubo decisiones de arquitectura".

## Paso 5 — Actualizar `CLAUDE.md` si algo permanente cambió

Solo si cambió una **regla permanente**: stack, convención, estructura de carpetas,
o la línea de "Estado actual".

`CLAUDE.md` **no es una bitácora de progreso**. Si la tentación es añadir un párrafo
contando lo que se hizo hoy, eso va a `SESSION_NOTES.md`.

Comprobar el límite:

```bash
wc -l CLAUDE.md    # debe seguir ≤ 200
```

**Criterio de salida:** `CLAUDE.md` sigue bajo 200 líneas, o "N/A — no cambió nada
permanente".

## Paso 6 — Dejar el árbol en un estado explicable

- Si hay cambios sin commitear: decir **por qué** quedan así en `SESSION_NOTES.md`.
- No hacer commits a medias solo para "dejarlo limpio". Un árbol sucio bien
  explicado es mejor que un commit que no pasa la verificación.
- Nunca `git add -A` desde un directorio superior a `memory-trainer/` (ADR-005).

**Criterio de salida:** estado del árbol explicado en las notas.

## Paso 7 — Resumen final al operador

Cinco líneas, no más:

1. En qué fase y en qué paso quedamos.
2. Qué quedó funcionando **y verificado**.
3. Qué quedó sin verificar.
4. Qué bloquea el avance y quién lo desbloquea.
5. Cuál es la primera acción concreta de la próxima sesión.

**Criterio de salida:** las 5 líneas entregadas.

---

## Prohibido explícitamente

- Terminar una sesión sin escribir `SESSION_NOTES.md`.
- Escribir en las notas que algo funciona sin haberlo verificado.
- Dejar "qué sigue" en vago ("continuar con la fase 3") en vez de una acción concreta.
- Usar `CLAUDE.md` como bitácora de progreso.
- Dejar una decisión de arquitectura solo en `SESSION_NOTES.md`, que se sobrescribe.
