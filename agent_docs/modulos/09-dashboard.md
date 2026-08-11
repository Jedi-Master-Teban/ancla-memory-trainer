# Módulo 09 — Dashboard principal (§8.9)

- **Fase:** 5
- **Depende de:** módulos 01–05 y 07
- **Archivos:** `app/(tabs)/index.tsx`, `src/domain/sesion/mezcla.ts`, `src/stores/racha.ts`

## 1. Contenido de la pantalla

1. **Racha actual** — indicador de llama, días consecutivos, estado.
2. **Meta diaria** — progreso de hoy (`12 / 20 tarjetas`).
3. **Pendientes por categoría** — colgadero, naipes, listas, números.
4. **Botón único "Practicar ahora"** — arma una sesión mixta priorizada por FSRS.

Es la pantalla de arranque de la app. Debe responder a una sola pregunta en menos de
dos segundos: *¿qué hago hoy?* Nada más entra aquí.

## 2. Sesión mixta priorizada (`src/domain/sesion/mezcla.ts`)

Lógica pura y probada. Algoritmo:

1. Reunir todas las tarjetas vencidas de todas las categorías activas.
2. Ordenar por urgencia: mayor retraso primero; a igual retraso, menor
   retrievability primero.
3. Rellenar hasta la meta diaria con tarjetas nuevas, **repartidas entre categorías**
   para que una categoría con muchas tarjetas nuevas no monopolice la sesión.
4. Intercalar categorías en el orden final: dos tarjetas seguidas del mismo mazo
   sí; veinte seguidas del mismo mazo no.
5. Tope duro: la meta diaria, o el tope de sesión si es menor (§10: 10–20 minutos).

Si no hay nada vencido, la sesión se arma solo con tarjetas nuevas. Si tampoco hay
nuevas, el botón dice **"Todo al día"** y ofrece práctica libre que **no altera** el
scheduling FSRS.

## 3. Reglas

- Los pendientes se leen por consulta agregada del repositorio, no cargando todas
  las tarjetas en memoria.
- El dashboard **no calcula fechas**: pregunta al repositorio y al scheduler
  (invariante I-1).
- Modo oscuro por defecto (§10).

## 4. Casos borde

| Caso | Comportamiento |
|---|---|
| Primera apertura, base recién sembrada | 100 colgadero nuevas; se ofrecen solo hasta la meta |
| Nada vencido y nada nuevo | "Todo al día" + práctica libre sin efecto en FSRS |
| Meta ya cumplida hoy | Se puede seguir practicando; la racha ya está asegurada |
| Categorías sin ítems (naipes sin aprobar) | No aparecen como pendientes ni inflan los conteos |

## 5. `done when`

Forma parte del `done when` de la Fase 5. Aporte específico:

1. Test de `mezcla.ts`: prioriza vencidas sobre nuevas; reparte entre categorías;
   respeta el tope; no devuelve tarjetas archivadas ni de mazos vacíos.
2. En el iPhone: abrir la app, ver racha y pendientes reales, pulsar "Practicar
   ahora" y completar una sesión mixta que incluya al menos dos categorías.
