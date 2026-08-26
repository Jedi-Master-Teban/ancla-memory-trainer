---
name: fsrs-review
description: Procedimiento obligatorio antes de tocar cualquier lógica de repetición espaciada. Úsala al modificar src/domain/fsrs/, al cambiar cómo se califican tarjetas, al tocar fechas de repaso, estabilidad, dificultad, retrievability o estados de tarjeta, y siempre que un intervalo calculado parezca raro. Incluye los invariantes de FSRS que nunca deben romperse.
---

# Skill: fsrs-review

§8.1 del brief lo dice sin rodeos: este es **el punto de mayor riesgo de alucinación
numérica del proyecto**. Un intervalo mal calculado no revienta: produce números
plausibles y destruye la retención en silencio durante semanas.

**Regla de fases:** los pasos van en orden. Un paso que no aplique se marca
**"N/A — [razón]"**. Nunca se omite en silencio.

---

## Paso 0 — La regla que no se negocia

**El algoritmo FSRS no se reimplementa a mano. Nunca.**

No se "ajusta" una fórmula de estabilidad. No se "simplifica" un cálculo. No se
escribe un intervalo a ojo. No se corrige un número que parece raro cambiando el
número: se lee la librería.

`src/domain/fsrs/scheduler.ts` es un **envoltorio delgado**: traduce vocabulario,
no calcula scheduling.

**Criterio de salida:** confirmar por escrito que el cambio no introduce aritmética
de scheduling propia. Si la introduce, parar y consultar al operador.

## Paso 1 — Leer la librería instalada, no la memoria

Correr la Skill `verificar-api-libreria` sobre `ts-fsrs` y anotar:

- versión exacta en `package.json` y en `node_modules/ts-fsrs/package.json`
- la forma real del objeto `Card` y sus campos
- cómo se crea el scheduler y cómo se llama para programar
- los valores reales del enum `Rating` y del enum `State`

**Criterio de salida:** las cuatro cosas anotadas en la conversación, citando el
archivo `.d.ts` del que salieron. Cero firmas recordadas.

## Paso 2 — Repasar los invariantes

De `agent_docs/modulos/01-motor-fsrs.md` §2. Para cada uno, decir si el cambio lo
respeta:

| # | Invariante |
|---|---|
| I-1 | Toda transición de estado pasa por `scheduler.ts`. Ningún componente calcula fechas. |
| I-2 | `fecha_proxima_revision` solo la escribe `ts-fsrs`. Jamás a mano, jamás "empujar un día". |
| I-3 | `intervalo(Otra vez) ≤ intervalo(Difícil) ≤ intervalo(Bien) ≤ intervalo(Fácil)`. |
| I-4 | Calificar **siempre** escribe una fila en `revision`. Sin excepción. |
| I-5 | Fechas persistidas en ISO-8601 UTC. |
| I-6 | El "ahora" es un parámetro inyectable, nunca `new Date()` dentro de la función. |
| I-7 | Retrievability y estado visual se **derivan**, nunca se almacenan (ADR-006). |

**Criterio de salida:** los 7 revisados uno por uno. Si el cambio rompe alguno,
parar y consultar. Un invariante roto no se "compensa después".

## Paso 3 — Test primero, siempre

Ninguna modificación de FSRS entra sin un test que describa el comportamiento
esperado **antes** de escribirla (§4.4 del brief).

Los 5 escenarios base (E-1…E-5 de `modulos/01-motor-fsrs.md` §4) deben seguir
pasando **sin modificarlos**. Si un cambio obliga a reescribir E-1…E-5, no es un
ajuste: es un cambio de comportamiento que necesita ADR y visto bueno del operador.

**Criterio de salida:** test nuevo en rojo por la razón correcta, y E-1…E-5 intactos.

## Paso 4 — Cuidado con los tests que se autoengañan

Un test de FSRS que compara contra un número literal copiado de una ejecución previa
no prueba nada: solo congela lo que salió esa vez, correcto o no.

Preferir aserciones sobre **propiedades**:

- monotonía entre grados (I-3)
- signo del cambio: acertar sube la estabilidad, fallar la baja
- el estado transiciona al que corresponde
- ida y vuelta por SQLite conserva el valor exacto

Solo se fija un número literal cuando el valor sale **de la librería** en el propio
test, no de la memoria del agente.

**Criterio de salida:** ningún literal numérico de scheduling escrito a mano en las
aserciones. Si hay uno, se justifica de dónde salió.

## Paso 5 — Comprobar el efecto sobre datos existentes

FSRS no vive en el vacío: hay tarjetas reales en el iPhone del operador con
historial acumulado.

- ¿El cambio altera el estado de tarjetas ya existentes?
- ¿Hay migración? ¿Es aditiva? → Skill `db-migracion`.
- ¿Puede el cambio reiniciar el progreso de alguna tarjeta? Si sí: **avisar antes
  de aplicarlo**, no después.

**Criterio de salida:** respuesta explícita sobre el impacto en datos existentes.

## Paso 6 — Verificar y registrar

1. `npm test` — pegar la salida completa, no un resumen.
2. `npx tsc --noEmit`.
3. Correr la Skill `verificacion` entera.
4. Si hubo decisión de arquitectura, ADR al final de `agent_docs/DECISIONS.md`.

**Criterio de salida:** veredicto de la Skill `verificacion` y, si aplica, ADR añadido.

---

## Señales de alarma (parar y consultar al operador)

- Un intervalo que "parece raro" y la tentación de corregirlo a mano.
- Un test de FSRS que hay que ajustar para que pase.
- Aparece aritmética de fechas fuera de `src/domain/fsrs/`.
- Alguien (incluido tú) propone "una versión simplificada de FSRS".
- Se necesita un campo nuevo en `tarjeta` para que un cálculo cuadre.

Ninguna de estas se resuelve sola. Todas se consultan.
