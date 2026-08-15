import { openDatabaseAsync } from 'expo-sqlite';
import type { ConexionBD } from './tipos';
import { ejecutarMigraciones } from './migrations';

const NOMBRE_BD = 'memory-trainer.db';

let bdPromise: Promise<ConexionBD> | null = null;
let rutaBD: string | null = null;

/**
 * Única apertura de la BD real del dispositivo. Único punto del proyecto que
 * importa `expo-sqlite` (CLAUDE.md, convención 1). Aplica migraciones antes de
 * devolver la conexión, así que cualquier consumidor recibe siempre un esquema
 * al día.
 */
export function obtenerBD(): Promise<ConexionBD> {
  if (!bdPromise) {
    bdPromise = openDatabaseAsync(NOMBRE_BD).then(async (db) => {
      rutaBD = db.databasePath;
      await ejecutarMigraciones(db);
      return db;
    });
  }
  return bdPromise;
}

/**
 * Ruta real del archivo `.db` en el dispositivo — solo para la exportación de
 * verificación de la Fase 6 (§ agent_docs/consultas-verificacion.sql). No es
 * parte de `ConexionBD` a propósito (ADR-014): esa interfaz existe para que
 * los tests la satisfagan con un adaptador de `node:sqlite`, que no tiene
 * ningún archivo real que exportar. `db.databasePath` (expo-sqlite) es una
 * ruta de sistema de archivos sin esquema — `file://` se antepone en quien
 * la use con `expo-sharing`, no aquí.
 */
export async function rutaArchivoBD(): Promise<string> {
  await obtenerBD();
  if (!rutaBD) throw new Error('BD no inicializada');
  return rutaBD;
}
