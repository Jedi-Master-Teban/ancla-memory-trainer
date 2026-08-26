# Módulo 01 — Motor de Repetición Espaciada (§8.1)

Núcleo transversal. Todo lo demás depende de esto. **Punto de mayor riesgo de
alucinación numérica del proyecto** (§8.1 lo dice explícitamente).

- **Fase:** 1
- **Archivos:** `src/domain/fsrs/scheduler.ts`, `src/domain/fsrs/estado.ts`,
  `src/domain/fsrs/tipos.ts`, `src/db/repository.ts`
- **Skill obligatoria al tocar cualquiera de esos archivos:** `fsrs-review`

## 1. Regla número uno

**El algoritmo FSRS no se reimplementa a mano. Nunca.** Se usa `ts-fsrs`. No se
"ajusta" una fórmula, no se "simplifica" un cálculo de estabilidad, no se escribe
un intervalo a ojo. Si un número parece raro, se lee la librería instalada, no se
corrige el número.

`scheduler.ts` es un **envoltorio delgado**: traduce entre el vocabulario del
proyecto y el de `ts-fsrs`. No contiene aritmética de scheduling propia.

## 2. Invariantes que nunca deben romperse

| # | Invariante |
|---|---|
| I-1 | Toda transición de estado de una tarjeta pasa por `scheduler.ts`. Ningún componente calcula fechas de repaso. |
| I-2 | `fecha_proxima_revision` solo la escribe `ts-fsrs`. Jamás se fija a mano ni se "empuja un día". |
| I-3 | Para un mismo estado: `intervalo(Otra vez) ≤ intervalo(Difícil) ≤ intervalo(Bien) ≤ intervalo(Fácil)`. |
| I-4 | Calificar una tarjeta **siempre** escribe una fila en `revision`. Sin excepción: es el histórico crudo del Panel de Retención. |
| I-5 | Las fechas se persisten en ISO-8601 UTC. Nada de timestamps locales ni de `Date` serializado por defecto. |
| I-6 | El "ahora" es un **parámetro inyectable**, no `new Date()` dentro de la función. Sin esto no hay tests deterministas. |
| I-7 | La retrievability y el estado visual se **derivan**, nunca se leen de columna (ver `MODELO-DATOS.md` §1). |

## 3. Calificación

4 niveles, mapeados al `Rating` de `ts-fsrs` (verificar los valores reales contra el
paquete instalado antes de codificarlos):

| UI (español) | Rating |
|---|---|
| Otra vez | Again |
| Difícil | Hard |
| Bien | Good |
| Fácil | Easy |

## 4. Los 5 escenarios de test — criterio de cierre de la Fase 1

§11 exige: *"Tests de Jest pasan sobre 5 escenarios de cálculo FSRS documentados en
`agent_docs/`"*. Estos son. Deben existir como `describe`/`it` reconocibles en
`src/domain/fsrs/scheduler.test.ts`.

### E-1 · Tarjeta nueva calificada "Bien"
Parte de `State.New`. Tras calificar: el estado deja de ser `New`,
`fecha_proxima_revision > ahora`, y estabilidad y dificultad quedan inicializadas
**por la librería** (el test asserta que son finitas y positivas, no valores
literales copiados a mano).

### E-2 · Tarjeta nueva calificada "Otra vez"
Sigue en aprendizaje, el intervalo es el mínimo de los cuatro grados, y la próxima
revisión es del mismo día.

### E-3 · Monotonía de los cuatro grados (invariante I-3)
Sobre **un mismo estado de partida**, programar los 4 grados por separado produce
intervalos no decrecientes: Again ≤ Hard ≤ Good ≤ Easy. Se prueba sobre una tarjeta
nueva y sobre una tarjeta en repaso.

### E-4 · Lapso de una tarjeta madura
Tarjeta en `State.Review` con estabilidad alta, calificada "Otra vez": la
estabilidad **decrece**, `lapses` aumenta en 1, y el estado pasa a relearning.
`estadoVisual` la reporta como `en_riesgo` o `aprendiendo`, nunca como `madura`.

### E-5 · Ida y vuelta por SQLite
Programar → persistir → releer → programar otra vez produce **exactamente** el mismo
resultado que programar dos veces en memoria. Cubre el bug más caro y más silencioso
del proyecto: perder precisión o zona horaria al serializar el estado FSRS.

## 5. Configuración

Parámetros y retención objetivo se fijan **una sola vez** en `src/domain/fsrs/config.ts`,
usando los valores por defecto de `ts-fsrs`. Cualquier desviación se registra como ADR.
Sin panel de ajustes de FSRS en la UI: no está en el brief.

## 6. Antes de escribir la primera línea

Correr la Skill `verificar-api-libreria` sobre `ts-fsrs` y anotar en `DECISIONS.md`:
versión instalada, nombre real de la fábrica del scheduler, forma exacta del objeto
`Card`, y si la API es de instancia o de función suelta. **No dar por buena ninguna
firma recordada de memoria.**
