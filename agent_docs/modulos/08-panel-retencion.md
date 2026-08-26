# Módulo 08 — Panel de Evaluación de Retención (§8.8)

- **Fase:** 6
- **Depende de:** la tabla `revision`, que existe desde la Fase 1 (invariante I-4)
- **Archivos:** `src/domain/estadisticas/retencion.ts`, `app/estadisticas.tsx`,
  `src/components/TarjetasProblematicas.tsx`, `agent_docs/consultas-verificacion.sql`

## 1. Por qué esta fase es distinta

Su `done when` es el más exigente del proyecto: *"los números de retención mostrados
coinciden con los datos crudos de SQLite (verificado con query manual)"*. Es decir:
**la pantalla no puede ser la única fuente de verdad de sí misma.**

Por eso el módulo entrega dos cosas: el código que calcula, y un archivo de consultas
SQL manuales que lo verifica desde fuera.

## 2. Métricas por categoría

| Métrica | Definición operativa |
|---|---|
| % de retención | filas de `revision` con calificación ≥ "Bien" ÷ total de filas, en la ventana elegida |
| Nuevas | tarjetas en `State.New` |
| Aprendiendo | `State.Learning` o `Relearning` |
| Maduras | `State.Review` con estabilidad ≥ 21 días |
| En riesgo | `State.Review` con retrievability < 0.9 |

Las definiciones salen de `estadoVisual()` (`MODELO-DATOS.md` §1.2) y **no se
recalculan a mano aquí**. Una segunda definición de "madura" en esta pantalla es
exactamente el bug que esta fase existe para descartar.

Ventanas: 7 días, 30 días, todo. La ventana afecta al % de retención; los conteos por
estado son siempre del momento actual.

## 3. Historial de sesiones

Lista de `sesion_estudio`: fecha, duración, tarjetas revisadas, aciertos/fallos, modo.
Detalle de una sesión = sus filas de `revision`.

## 4. Tarjetas problemáticas

Tarjetas consistentemente olvidadas. Criterio: **`lapses ≥ 3`** o **tasa de aciertos
< 50 % con al menos 5 revisiones**. Ordenadas por peores primero, con acceso directo
a editar el ítem (enlaza con el módulo 06).

El umbral es una constante única y documentada, no un número disperso por la UI.

## 5. `consultas-verificacion.sql` — el instrumento de la fase

Un archivo con la consulta SQL manual equivalente a **cada** métrica de la pantalla.
Se ejecuta contra la BD real del dispositivo y su salida se compara con lo mostrado.

Regla: si un número de la pantalla no tiene su consulta correspondiente en ese
archivo, **la fase no cierra**. No se acepta "se ve razonable".

## 6. `done when` de la Fase 6

Literal de §11: **los números de retención mostrados coinciden con los datos crudos
de SQLite (verificado con query manual).**

Evidencia exigida:
1. Captura textual de lo que muestra la pantalla, métrica por métrica.
2. Salida de cada consulta de `consultas-verificacion.sql`.
3. Comparación explícita de ambas listas, con las diferencias en cero.
4. `npm test` verde + `npx tsc --noEmit` limpio.

Si alguna cifra no cuadra, **se reporta la discrepancia** y la fase queda abierta.
Ajustar la consulta para que coincida con la pantalla invierte el sentido de la
verificación y está prohibido.
