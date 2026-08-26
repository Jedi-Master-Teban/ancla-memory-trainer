import type { ConexionBD } from '../tipos';

export const version = 5;

/**
 * Racha y configuración (§8.7, agent_docs/modulos/07-racha.md §2). Aditivo:
 * dos tablas nuevas, ninguna toca `tarjeta`/`revision`/`sesion_estudio`.
 *
 * Siembra una única fila en `racha_config` (id=1, CHECK lo garantiza como
 * singleton) — sin ella la app no tiene con qué calcular nada. Valores de
 * arranque, ninguno viene de un dato del operador (no existía nada que
 * preguntar antes de escribir código, per Fase 5 Plan Mode):
 *   - meta_diaria=20: mismo número que `TOPE_POR_DEFECTO` en motor.ts —
 *     una sesión normal completa basta para cumplir el día.
 *   - congeladores_disponibles=2: stock inicial modesto; sin recarga
 *     automática (decisión del operador en Plan Mode) — editable a mano
 *     en app/racha.tsx desde el primer momento.
 *   - hora_recordatorio='21:00': uso nocturno probable (brief §10).
 * Los tres son editables de inmediato desde la app si no encajan.
 */
export async function aplicar(db: ConexionBD, _ahora: Date): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dia_practica (
      fecha_local TEXT PRIMARY KEY,
      tarjetas_revisadas INTEGER NOT NULL DEFAULT 0,
      meta_cumplida INTEGER NOT NULL DEFAULT 0,
      congelador_usado INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS racha_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      meta_diaria INTEGER NOT NULL,
      congeladores_disponibles INTEGER NOT NULL,
      hora_recordatorio TEXT NOT NULL
    );
  `);

  await db.runAsync(
    'INSERT INTO racha_config (id, meta_diaria, congeladores_disponibles, hora_recordatorio) VALUES (1, ?, ?, ?)',
    [20, 2, '21:00']
  );
}
