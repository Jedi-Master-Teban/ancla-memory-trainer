import type { ConexionBD } from '../tipos';
import * as m001 from './001_inicial';
import * as m002 from './002_seed_colgadero';
import * as m003 from './003_seed_naipes';
import * as m004 from './004_listas_numeros';
import * as m005 from './005_racha';
import * as m006 from './006_preferencias';
import * as m007 from './007_tipografia';
import * as m008 from './008_tema_soft';

export interface Migracion {
  version: number;
  aplicar(db: ConexionBD, ahora: Date): Promise<void>;
}

export const MIGRACIONES: Migracion[] = [m001, m002, m003, m004, m005, m006, m007, m008];

/** Versión del esquema que espera esta build. Un respaldo más nuevo no se puede restaurar aquí. */
export const ULTIMA_VERSION = Math.max(...MIGRACIONES.map((m) => m.version));

interface Opciones {
  /** Solo para tests: sustituye la lista real. */
  migraciones?: Migracion[];
  /**
   * Se llama antes de tocar nada, y solo si la base ya existía y hay
   * migraciones pendientes: es el momento de copiarla (ADR-029). Si lanza, no
   * se migra.
   */
  antesDeMigrar?: (pendientes: number[]) => Promise<void>;
}

/**
 * Corredor de migraciones (MODELO-DATOS.md §3). Idempotente: cada migración solo
 * se aplica una vez, registrada en la tabla `migracion`. Nunca se editan
 * migraciones ya aplicadas — se añaden nuevas (Skill db-migracion). `ahora` es
 * inyectable (I-6) para que las migraciones de siembra sean deterministas en tests.
 *
 * Cada migración y su registro van en UNA transacción (ADR-029): si algo falla
 * a mitad —un error, o iOS cerrando la app—, la base queda exactamente como
 * estaba y la migración se reintenta en el siguiente arranque. Antes, un fallo
 * a medias dejaba tablas creadas sin registro, y el reintento chocaba con ellas.
 */
export async function ejecutarMigraciones(db: ConexionBD, ahora: Date = new Date(), opciones: Opciones = {}): Promise<void> {
  const lista = opciones.migraciones ?? MIGRACIONES;

  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS migracion (version INTEGER PRIMARY KEY, aplicada_en TEXT NOT NULL);'
  );

  const filas = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
  const aplicadas = new Set(filas.map((f) => f.version));
  const pendientes = lista.filter((m) => !aplicadas.has(m.version));
  if (pendientes.length === 0) return;

  if (aplicadas.size > 0 && opciones.antesDeMigrar) {
    await opciones.antesDeMigrar(pendientes.map((m) => m.version));
  }

  for (const migracion of pendientes) {
    await db.withTransactionAsync(async () => {
      await migracion.aplicar(db, ahora);
      await db.runAsync('INSERT INTO migracion (version, aplicada_en) VALUES (?, ?)', [migracion.version, ahora.toISOString()]);
    });
  }
}
