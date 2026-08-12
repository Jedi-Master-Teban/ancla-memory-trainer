import { openDatabaseAsync } from 'expo-sqlite';
import type { ConexionBD } from './tipos';
import { ejecutarMigraciones } from './migrations';

const NOMBRE_BD = 'memory-trainer.db';

let bdPromise: Promise<ConexionBD> | null = null;

/**
 * Única apertura de la BD real del dispositivo. Único punto del proyecto que
 * importa `expo-sqlite` (CLAUDE.md, convención 1). Aplica migraciones antes de
 * devolver la conexión, así que cualquier consumidor recibe siempre un esquema
 * al día.
 */
export function obtenerBD(): Promise<ConexionBD> {
  if (!bdPromise) {
    bdPromise = openDatabaseAsync(NOMBRE_BD).then(async (db) => {
      await ejecutarMigraciones(db);
      return db;
    });
  }
  return bdPromise;
}
