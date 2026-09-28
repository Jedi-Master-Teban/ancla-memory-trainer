import type { SQLiteDatabase } from 'expo-sqlite';
import { copiasABorrar, tocaCopiaDiaria, type MetaCopia, type TipoCopia } from '../domain/respaldo/copias';
import { borrarCopias, copiasDisponibles, guardarCopia, listarCopias } from './copias';
import { obtenerNacimientoBase, obtenerResumenDatos, obtenerVersionEsquema } from './repository';

/**
 * Copias automáticas de la base entera (ADR-029): `serializeAsync` devuelve el
 * archivo SQLite completo, que se guarda en IndexedDB (`copias.ts`). Después de
 * cada copia se aplica la política de conservación de `domain/respaldo`.
 */
export async function tomarCopia(db: SQLiteDatabase, tipo: TipoCopia, ahora: Date): Promise<MetaCopia | null> {
  if (!copiasDisponibles) return null;
  const resumen = await obtenerResumenDatos(db);
  const versionEsquema = await obtenerVersionEsquema(db);
  const idBase = await obtenerNacimientoBase(db);
  const bytes = await db.serializeAsync();
  const meta: MetaCopia = {
    id: `${tipo}-${ahora.toISOString()}`,
    tipo,
    creadaEn: ahora.toISOString(),
    versionEsquema,
    resumen,
    tamano: bytes.length,
    idBase,
  };
  await guardarCopia(meta, bytes);
  await borrarCopias(copiasABorrar(await listarCopias()));
  return meta;
}

/** La copia del día, si hay progreso y todavía no se hizo hoy. */
export async function copiaDiariaSiToca(db: SQLiteDatabase, ahora: Date): Promise<MetaCopia | null> {
  if (!copiasDisponibles) return null;
  const [copias, resumen] = await Promise.all([listarCopias(), obtenerResumenDatos(db)]);
  if (!tocaCopiaDiaria(copias, resumen, ahora)) return null;
  return tomarCopia(db, 'diaria', ahora);
}
