import { Platform } from 'react-native';
import type { MetaCopia } from '../domain/respaldo/copias';

/**
 * Almacén de las copias automáticas (ADR-029), en IndexedDB y no en SQLite.
 *
 * Por qué aparte: expo-sqlite guarda la base en un grupo de archivos de OPFS
 * con una cabecera de control. Si esa cabecera aparece dañada —por ejemplo, si
 * iOS cierra la app a mitad de una escritura—, la librería «repara» el archivo
 * vaciándolo (`AccessHandlePoolVFS.js`, «Disassociating file with bad
 * digest»). Una copia dentro de ese mismo grupo se iría con él. IndexedDB es
 * otro mecanismo del navegador: sobrevive a ese fallo, aunque no a que iOS
 * borre todo el almacenamiento de la app (para eso está el respaldo a Archivos).
 *
 * Solo web: en nativo (Expo Go) no hay IndexedDB y todo esto no hace nada.
 */

const NOMBRE = 'ancla-copias';
const VERSION = 1;
const METAS = 'metas';
const DATOS = 'datos';
const AJUSTES = 'ajustes';

export const copiasDisponibles = Platform.OS === 'web' && typeof indexedDB !== 'undefined';

let conexion: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  if (!conexion) {
    conexion = new Promise<IDBDatabase>((resolver, rechazar) => {
      const peticion = indexedDB.open(NOMBRE, VERSION);
      peticion.onupgradeneeded = () => {
        const idb = peticion.result;
        if (!idb.objectStoreNames.contains(METAS)) idb.createObjectStore(METAS, { keyPath: 'id' });
        if (!idb.objectStoreNames.contains(DATOS)) idb.createObjectStore(DATOS);
        if (!idb.objectStoreNames.contains(AJUSTES)) idb.createObjectStore(AJUSTES);
      };
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => rechazar(peticion.error);
    }).catch((e) => {
      conexion = null;
      throw e;
    });
  }
  return conexion;
}

/** Una transacción entera, resuelta cuando el navegador confirma que se escribió. */
async function transaccion<T>(
  almacenes: string[],
  modo: IDBTransactionMode,
  tarea: (t: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const idb = await abrir();
  return new Promise<T | undefined>((resolver, rechazar) => {
    const t = idb.transaction(almacenes, modo);
    const peticion = tarea(t);
    t.oncomplete = () => resolver(peticion ? peticion.result : undefined);
    t.onerror = () => rechazar(t.error);
    t.onabort = () => rechazar(t.error ?? new Error('Transacción de IndexedDB abortada'));
  });
}

export async function guardarCopia(meta: MetaCopia, bytes: Uint8Array): Promise<void> {
  if (!copiasDisponibles) return;
  await transaccion([METAS, DATOS], 'readwrite', (t) => {
    t.objectStore(DATOS).put(bytes, meta.id);
    t.objectStore(METAS).put(meta);
  });
}

export async function listarCopias(): Promise<MetaCopia[]> {
  if (!copiasDisponibles) return [];
  const metas = await transaccion<MetaCopia[]>([METAS], 'readonly', (t) => t.objectStore(METAS).getAll());
  return (metas ?? []).sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
}

export async function leerCopia(id: string): Promise<Uint8Array | null> {
  if (!copiasDisponibles) return null;
  const bytes = await transaccion<Uint8Array>([DATOS], 'readonly', (t) => t.objectStore(DATOS).get(id));
  return bytes ?? null;
}

export async function borrarCopias(ids: string[]): Promise<void> {
  if (!copiasDisponibles || ids.length === 0) return;
  await transaccion([METAS, DATOS], 'readwrite', (t) => {
    for (const id of ids) {
      t.objectStore(METAS).delete(id);
      t.objectStore(DATOS).delete(id);
    }
  });
}

/** Ajustes de las copias que no deben viajar dentro de la base (se perderían al restaurar una vieja). */
export type ClaveAjusteCopias = 'ultimoRespaldoExterno' | 'recuperacionDescartadaHasta';

export async function leerAjusteCopias(clave: ClaveAjusteCopias): Promise<string | null> {
  if (!copiasDisponibles) return null;
  const valor = await transaccion<string>([AJUSTES], 'readonly', (t) => t.objectStore(AJUSTES).get(clave));
  return valor ?? null;
}

export async function escribirAjusteCopias(clave: ClaveAjusteCopias, valor: string): Promise<void> {
  if (!copiasDisponibles) return;
  await transaccion([AJUSTES], 'readwrite', (t) => {
    t.objectStore(AJUSTES).put(valor, clave);
  });
}
