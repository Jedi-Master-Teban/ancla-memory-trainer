import type { ConexionBD } from '../tipos';

export const version = 6;

/**
 * Preferencias de presentación (Fase 8, ADR-026): tema visual elegido por el
 * operador. Aditivo: tabla nueva, ninguna toca tarjeta/revision/racha_config.
 * Singleton (CHECK id=1) — mismo patrón que racha_config (005_racha.ts).
 * Semilla 'arcade' — decisión del operador en Plan Mode (2026-08-20).
 */
export async function aplicar(db: ConexionBD, _ahora: Date): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS preferencias (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      tema TEXT NOT NULL
    );
  `);

  await db.runAsync('INSERT INTO preferencias (id, tema) VALUES (1, ?)', ['arcade']);
}
