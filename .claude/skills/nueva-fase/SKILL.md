---
name: nueva-fase
description: Procedimiento fijo para iniciar y cerrar cualquier fase del plan de agent_docs/PLAN-FASES.md. Úsala al empezar una fase, al retomar una fase a medias, o cuando el operador ejecute /nueva-fase N. Cubre leer el plan, declarar el alcance de archivos, escribir tests primero, implementar, verificar y hacer commit.
---

# Skill: nueva-fase

Ninguna fase empieza sin esto. Si una fase ya está a medias, se entra igual y se
declara en qué paso quedó.

**Regla de fases:** los pasos se ejecutan en orden. Si uno no aplica, se escribe
**"N/A — [razón]"** de forma visible. Nunca se omite en silencio. Cada paso tiene
criterio de salida verificable: si no se cumple, no se pasa al siguiente.

---

## Paso 1 — Anclar el estado real

1. Leer `SESSION_NOTES.md` completo.
2. Leer la fase correspondiente en `agent_docs/PLAN-FASES.md`.
3. Leer el spec del módulo que esa fase referencia (`agent_docs/modulos/*.md`).
4. Leer los **pendientes abiertos** al final de `agent_docs/DECISIONS.md`.
5. `git status` y `git log --oneline -5`.

**Salida:** un resumen de 5 líneas al operador — qué fase, qué dice el plan, qué
quedó de la sesión anterior, qué pendientes bloquean esta fase, en qué rama estamos.

**Criterio de salida:** el resumen existe y menciona explícitamente los pendientes
que afectan a esta fase (o dice que no hay ninguno).

## Paso 2 — Resolver bloqueos antes de escribir nada

Si algún pendiente de `DECISIONS.md` afecta a esta fase (p. ej. P-1 en la Fase 3):
**preguntar al operador y esperar la respuesta.** No se avanza asumiendo.

Si se puede avanzar en parte, se dice exactamente qué parte queda bloqueada y se
sigue con el resto.

**Criterio de salida:** cero bloqueos activos sin decisión, o una lista explícita de
lo que queda fuera de esta fase por estar bloqueado.

## Paso 3 — Declarar el alcance de archivos

Listar, **antes de tocar nada**, los archivos que se van a crear o modificar.
Partir de la tabla de la fase en `PLAN-FASES.md`.

Este listado es un contrato: el punto 4 de `/verificar` comprueba si se tocó algo
fuera de él. Tocar un archivo no declarado no está prohibido — está prohibido
**no reportarlo**.

**Criterio de salida:** lista escrita en la conversación, con una línea de propósito
por archivo.

## Paso 4 — Verificar las APIs que se van a usar

Para cada librería que esta fase usa y que no se haya verificado ya en esta sesión:
correr la Skill `verificar-api-libreria`.

**Criterio de salida:** cada API externa que se va a llamar tiene su firma real
leída de `node_modules/` o de la doc oficial de la versión instalada, anotada en la
conversación. Cero firmas "de memoria".

## Paso 5 — Tests primero

Para toda la lógica de negocio de la fase (§4.4 del brief): escribir el test antes
que la implementación, correrlo y **verlo fallar por la razón correcta**.

Obligatorio en `src/domain/fsrs/`, `src/domain/fonetica/`, `src/domain/racha/`,
`src/domain/numeros/`, `src/domain/cadena/`. Para UI pura es **N/A justificado**.

**Criterio de salida:** salida de `npm test` mostrando los tests nuevos en rojo, con
el mensaje de fallo esperado (no un error de importación).

## Paso 6 — Implementar

Ceñirse al alcance del paso 3. Cuando aparezca la tentación de arreglar algo
adyacente: anotarlo y seguir. Se reporta al final; no se cuela en este commit.

Al tocar scheduling → Skill `fsrs-review`. Al tocar el esquema → Skill `db-migracion`.

**Criterio de salida:** los tests del paso 5 pasan y `npx tsc --noEmit` está limpio.

## Paso 7 — Verificación completa

Correr la Skill `verificacion` entera (los 6 puntos de §4.2). No es opcional y no se
resume: se responden los 6 puntos, uno por uno.

**Criterio de salida:** los 6 puntos respondidos con evidencia o con N/A justificado.

## Paso 8 — Verificación manual en el iPhone

§3 del brief: **ninguna fase se marca terminada sin correr la app en Expo Go.**

Reportar: qué pantalla se abrió, qué se hizo, qué se vio, si hubo errores en consola.
Si el operador no ha podido probarlo todavía, la fase queda **"pendiente de
verificación en dispositivo"** — nunca "hecha".

**Criterio de salida:** relato concreto de lo probado en el dispositivo, o el estado
"pendiente de verificación" declarado sin ambigüedad.

## Paso 9 — Contrastar contra el `done when`

Copiar el `done when` literal de la fase desde `PLAN-FASES.md` y responderlo punto
por punto con la evidencia recogida.

**Prohibido:** declarar una fase cerrada porque "todo lo importante funciona". El
criterio es el del brief, no una versión relajada de él.

**Criterio de salida:** el `done when` citado literalmente y contestado, con veredicto
explícito: **cumplido** / **cumplido parcialmente (con qué falta)** / **no cumplido**.

## Paso 10 — Commit

Solo si el paso 9 dio "cumplido" o si el operador autoriza un commit parcial.

```
feat(fase-N): <qué quedó funcionando>

- <cambio relevante>
- Tests: <resumen del resultado>
- Verificado en Expo Go: <qué se probó>
- Fuera de alcance tocado: <lista o "ninguno">
```

**Criterio de salida:** commit hecho en el repo de `memory-trainer/` (ADR-005),
nunca en el repo padre `~/Código`. Nada de `git add -A` desde un directorio superior.

## Paso 11 — Registrar decisiones

Si en la fase se tomó alguna decisión de arquitectura irreversible o cara de
revertir, añadir un ADR **al final** de `agent_docs/DECISIONS.md`. Nunca editar un
ADR existente: se supersede con uno nuevo.

**Criterio de salida:** ADR añadido, o "N/A — no hubo decisiones de arquitectura".

---

## Al terminar

Actualizar la sección "Estado actual" de `CLAUDE.md` (una línea) y, si la sesión
termina aquí, ejecutar la Skill `cierre-sesion`.
