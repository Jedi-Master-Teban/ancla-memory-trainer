-- Consultas de verificación manual — Fase 6, Panel de Retención
-- (agent_docs/modulos/08-panel-retencion.md §5-6)
--
-- El `done when` de esta fase exige que la pantalla NUNCA sea la única
-- fuente de verdad de sí misma: cada número que muestra app/estadisticas.tsx
-- tiene aquí su consulta manual equivalente. Se corre a mano contra la BD
-- real del dispositivo (memory-trainer.db) y se compara sin diferencias.
-- Prohibido ajustar la consulta para que coincida con la pantalla — eso
-- invierte el sentido de la verificación (§6).
--
-- DOS AVISOS PERMANENTES antes de correr cualquier consulta de aquí:
--
-- 1) Sustituir siempre la fecha por el valor EXACTO de "Calculado: ..."
--    que muestra la pantalla al pie — nunca datetime('now'), que corre en
--    el instante en que el operador ejecuta la consulta, no en el instante
--    en que la pantalla calculó sus números.
--
-- 2) Los conteos de "aprendiendo/madura/en_riesgo" NO son expresables en
--    SQL puro: dependen de retrievability(), una curva exponencial de
--    ts-fsrs (verificado contra el código fuente instalado:
--    R = (1 + factor·t/S)^decay). Reimplementar esa fórmula a mano en SQL
--    está prohibido por este proyecto (NUNCA reimplementar FSRS a mano).
--    Las consultas de la sección 2 vuelcan las filas crudas necesarias; el
--    conteo final se termina pasando cada fila por estadoVisual() real
--    (src/domain/fsrs/estado.ts) — la misma función que usa la app — con el
--    mismo "ahora" literal de la captura, por ejemplo con un script
--    desechable de una línea.


-- ============================================================
-- 1. % de retención — por categoría × ventana (4 × 3 = 12 corridas)
-- ============================================================
-- Sustituir 'colgadero' por 'naipe' | 'lista_item' | 'numero', y la fecha
-- por (ahora_de_la_captura − 7 días) o (− 30 días), literal.
-- Para ventana "todo": quitar por completo la línea "AND revision.fecha >= ...".

SELECT
  COUNT(*) AS total_revisiones,
  SUM(CASE WHEN revision.calificacion >= 3 THEN 1 ELSE 0 END) AS revisiones_retenidas,
  ROUND(100.0 * SUM(CASE WHEN revision.calificacion >= 3 THEN 1 ELSE 0 END) / COUNT(*), 1) AS porcentaje_retencion
FROM revision
JOIN tarjeta ON tarjeta.id = revision.tarjeta_id
WHERE tarjeta.categoria = 'colgadero'
  AND revision.fecha >= '2026-01-01T00:00:00.000Z';  -- sustituir por el valor real


-- ============================================================
-- 2. Conteo por estado — por categoría (4 corridas)
-- ============================================================
-- Sustituir 'colgadero' por cada categoría.

-- "nuevas" SÍ es 100% verificable en SQL puro (no depende de retrievability):
SELECT COUNT(*) AS nuevas
FROM tarjeta
WHERE categoria = 'colgadero' AND archivada = 0 AND fsrs_state = 0;

-- CORRECCIÓN (2026-08-15, encontrada corriendo esta misma verificación contra
-- datos reales): "aprendiendo" NO es solo fsrs_state IN (1,3). Leyendo
-- estadoVisual() real (src/domain/fsrs/estado.ts): Learning/Relearning
-- siempre cuenta como aprendiendo, PERO una tarjeta en Review (fsrs_state=2)
-- que no es ni en_riesgo (retrievability < 0.9) ni madura (estabilidad >= 21
-- días) TAMBIÉN cae en aprendiendo — es la rama "por defecto" de la función.
-- La parte de Learning/Relearning sí es SQL puro:
SELECT COUNT(*) AS aprendiendo_learning_relearning
FROM tarjeta
WHERE categoria = 'colgadero' AND archivada = 0 AND fsrs_state IN (1, 3);

-- aprendiendo (la parte que viene de Review)/madura/en_riesgo (fsrs_state = 2):
-- las tres dependen de retrievability() y ninguna es SQL puro. Vuelca las
-- filas crudas — el conteo final de las tres pasa cada fila por
-- estadoVisual() real, ver aviso (2) arriba. El total de "aprendiendo" que
-- muestra la pantalla es aprendiendo_learning_relearning (arriba) MÁS las
-- filas de aquí que estadoVisual() clasifique como 'aprendiendo'.
SELECT id, fsrs_estabilidad, fecha_ultima_revision
FROM tarjeta
WHERE categoria = 'colgadero' AND archivada = 0 AND fsrs_state = 2;


-- ============================================================
-- 3. Historial de sesiones (1 consulta, sin parámetros)
-- ============================================================
SELECT id, iniciada_en, terminada_en, duracion_segundos, aciertos, fallos, modo
FROM sesion_estudio
ORDER BY iniciada_en DESC;


-- ============================================================
-- 4. Detalle de una sesión (parametrizada por sesion_id)
-- ============================================================
-- Sustituir 'SESION_ID_AQUI' por el id real de la sesión expandida en pantalla.
SELECT id, tarjeta_id, calificacion, fecha, direccion
FROM revision
WHERE sesion_id = 'SESION_ID_AQUI'
ORDER BY fecha;


-- ============================================================
-- 5. Tarjetas problemáticas (1 consulta completa, cruza las 4 categorías)
-- ============================================================
-- Mismo criterio que esTarjetaProblematica (src/domain/estadisticas/retencion.ts):
-- lapses >= 3, O (>= 5 revisiones Y tasa de retención < 50%).
-- Mismo orden que compararPeorPrimero: tasa ascendente (sin dato al final),
-- empate por lapses descendente, empate final por id.
SELECT
  tarjeta.id,
  tarjeta.categoria,
  tarjeta.contenido_frente,
  tarjeta.contenido_reverso,
  tarjeta.fsrs_lapses,
  COUNT(revision.id) AS veces_revisada,
  ROUND(1.0 * SUM(CASE WHEN revision.calificacion >= 3 THEN 1 ELSE 0 END) / NULLIF(COUNT(revision.id), 0), 3) AS tasa_retencion
FROM tarjeta
LEFT JOIN revision ON revision.tarjeta_id = tarjeta.id
WHERE tarjeta.archivada = 0
GROUP BY tarjeta.id, tarjeta.categoria, tarjeta.contenido_frente, tarjeta.contenido_reverso, tarjeta.fsrs_lapses
HAVING tarjeta.fsrs_lapses >= 3
    OR (COUNT(revision.id) >= 5
        AND (1.0 * SUM(CASE WHEN revision.calificacion >= 3 THEN 1 ELSE 0 END) / COUNT(revision.id)) < 0.5)
ORDER BY tasa_retencion IS NULL, tasa_retencion ASC, tarjeta.fsrs_lapses DESC, tarjeta.id ASC;
