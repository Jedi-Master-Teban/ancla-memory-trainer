import type { ConexionBD } from '../tipos';
import * as m001 from './001_inicial';
import * as m002 from './002_seed_colgadero';
import * as m003 from './003_seed_naipes';
import * as m004 from './004_listas_numeros';
import * as m005 from './005_racha';
import * as m006 from './006_preferencias';
import * as m007 from './007_tipografia';

interface Migracion {
  version: number;
  aplicar(db: ConexionBD, ahora: Date): Promise<void>;
}

const MIGRACIONES: Migracion[] = [m001, m002, m003, m004, m005, m006, m007];

/**
 * Corredor de migraciones (MODELO-DATOS.md §3). Idempotente: cada migración solo
 * se aplica una vez, registrada en la tabla `migracion`. Nunca se editan
 * migraciones ya aplicadas — se añaden nuevas (Skill db-migracion). `ahora` es
 * inyectable (I-6) para que las migraciones de siembra sean deterministas en tests.
 */
export async function ejecutarMigraciones(db: ConexionBD, ahora: Date = new Date()): Promise<void> {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS migracion (version INTEGER PRIMARY KEY, aplicada_en TEXT NOT NULL);'
  );

  const filas = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
  const aplicadas = new Set(filas.map((f) => f.version));

  for (const migracion of MIGRACIONES) {
    if (aplicadas.has(migracion.version)) continue;
    await migracion.aplicar(db, ahora);
    await db.runAsync('INSERT INTO migracion (version, aplicada_en) VALUES (?, ?)', [migracion.version, ahora.toISOString()]);
  }
}
