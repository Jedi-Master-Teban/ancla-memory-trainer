import type { ConexionBD } from '../tipos';
import * as m001 from './001_inicial';

interface Migracion {
  version: number;
  aplicar(db: ConexionBD): Promise<void>;
}

const MIGRACIONES: Migracion[] = [m001];

/**
 * Corredor de migraciones (MODELO-DATOS.md §3). Idempotente: cada migración solo
 * se aplica una vez, registrada en la tabla `migracion`. Nunca se editan
 * migraciones ya aplicadas — se añaden nuevas (Skill db-migracion).
 */
export async function ejecutarMigraciones(db: ConexionBD, ahoraISO: () => string = () => new Date().toISOString()): Promise<void> {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS migracion (version INTEGER PRIMARY KEY, aplicada_en TEXT NOT NULL);'
  );

  const filas = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
  const aplicadas = new Set(filas.map((f) => f.version));

  for (const migracion of MIGRACIONES) {
    if (aplicadas.has(migracion.version)) continue;
    await migracion.aplicar(db);
    await db.runAsync('INSERT INTO migracion (version, aplicada_en) VALUES (?, ?)', [migracion.version, ahoraISO()]);
  }
}
