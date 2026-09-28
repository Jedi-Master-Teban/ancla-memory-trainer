import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { ConexionBD } from './tipos';
import { copiaDiariaSiToca, tomarCopia } from './instantaneas';
import { ejecutarMigraciones } from './migrations';
import { pedirProteccion } from './persistencia';

const NOMBRE_BD = 'memory-trainer.db';

let bdPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Única apertura de la BD real del dispositivo. Único punto del proyecto que
 * importa `expo-sqlite` para abrirla (CLAUDE.md, convención 1). Aplica
 * migraciones antes de devolver la conexión, así que cualquier consumidor
 * recibe siempre un esquema al día.
 *
 * Si abrir falla, la promesa NO se queda guardada: el siguiente intento vuelve
 * a abrir. Antes, un fallo pasajero —en la PWA, OPFS todavía ocupado por la
 * versión anterior justo después de una actualización— dejaba la app sin base
 * hasta cerrarla del todo, y todas las pantallas aparecían vacías.
 */
export function obtenerBD(): Promise<ConexionBD> {
  return obtenerBDReal();
}

/**
 * La conexión de expo-sqlite en sí, con `serializeAsync` y copia entre bases.
 * Solo para `src/db/` (respaldo): el resto de la app habla con `ConexionBD`.
 */
export function obtenerBDReal(): Promise<SQLiteDatabase> {
  if (!bdPromise) {
    bdPromise = abrir().catch((e) => {
      bdPromise = null;
      throw e;
    });
  }
  return bdPromise;
}

async function abrir(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(NOMBRE_BD);
  await ejecutarMigraciones(db, new Date(), {
    // Copia de la base antes de tocar su esquema (ADR-029). Si la copia falla
    // (sin espacio, IndexedDB no disponible) se migra igual: cada migración es
    // atómica, y una app que no abre tras actualizar deja al usuario sin forma
    // ni de exportar lo suyo.
    antesDeMigrar: async () => {
      try {
        await tomarCopia(db, 'antes-de-actualizar', new Date());
      } catch (e) {
        console.error('No se pudo copiar la base antes de migrar:', e);
      }
    },
  });
  // De fondo: no retrasan el arranque y, si fallan, no lo impiden.
  pedirProteccion().catch(() => undefined);
  copiaDiariaSiToca(db, new Date()).catch((e) => console.error('No se pudo hacer la copia diaria:', e));
  return db;
}
