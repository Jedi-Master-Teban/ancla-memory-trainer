import { backupDatabaseAsync, deserializeDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { esArchivoSQLite, nombreDeRespaldo, type MetaCopia, type ResumenDatos } from '../domain/respaldo/copias';
import { obtenerBDReal } from './client';
import { escribirAjusteCopias, leerAjusteCopias, leerCopia, listarCopias } from './copias';
import { tomarCopia } from './instantaneas';
import { ejecutarMigraciones, ULTIMA_VERSION } from './migrations';
import { listarTablas, obtenerResumenDatos, obtenerVersionEsquema, verificarIntegridad } from './repository';

/**
 * Respaldo que el usuario se lleva y restauración (ADR-029).
 *
 * El respaldo es el archivo SQLite completo (`serializeAsync`), el mismo que
 * servía para las consultas de verificación de la Fase 6. Restaurar no
 * reemplaza el archivo en disco: abre la copia en memoria y la vuelca sobre la
 * base viva con la API de backup de SQLite, que escribe en una sola transacción.
 *
 * iOS solo deja abrir el menú de compartir y el selector de archivos DURANTE
 * el toque del usuario. Por eso `compartirRespaldo` y `elegirArchivoDeRespaldo`
 * hacen esas llamadas antes de cualquier `await`: una espera previa gastaría el
 * permiso del gesto y Safari respondería `NotAllowedError`.
 */

const TABLAS_DE_ANCLA = ['migracion', 'mazo', 'tarjeta', 'revision'];

export const respaldoDisponible = Platform.OS === 'web' && typeof document !== 'undefined';

export interface RespaldoPreparado {
  archivo: File;
  nombre: string;
  tamano: number;
}

/** Serializa la base. Es asíncrono, así que va ANTES del toque que la comparte. */
export async function prepararRespaldo(ahora: Date): Promise<RespaldoPreparado> {
  const db = await obtenerBDReal();
  const bytes = await db.serializeAsync();
  const nombre = nombreDeRespaldo(ahora);
  const archivo = new File([bytes as Uint8Array<ArrayBuffer>], nombre, { type: 'application/octet-stream' });
  return { archivo, nombre, tamano: bytes.length };
}

export type ResultadoEntrega = 'compartido' | 'descargado' | 'cancelado' | 'sin-permiso';

/**
 * Menú de compartir de iOS (Guardar en Archivos, iCloud, AirDrop…) o, si el
 * navegador no comparte archivos, una descarga. Llamar dentro del toque.
 */
export function compartirRespaldo(respaldo: RespaldoPreparado): Promise<ResultadoEntrega> {
  const datos: ShareData = { files: [respaldo.archivo], title: 'Respaldo de Ancla' };
  if (typeof navigator !== 'undefined' && navigator.canShare?.(datos)) {
    return navigator.share(datos).then(
      () => marcarRespaldo('compartido'),
      (e: unknown) => {
        const nombre = (e as { name?: string })?.name;
        if (nombre === 'AbortError') return 'cancelado';
        if (nombre === 'NotAllowedError') return 'sin-permiso';
        return descargar(respaldo);
      },
    );
  }
  return descargar(respaldo);
}

function descargar(respaldo: RespaldoPreparado): Promise<ResultadoEntrega> {
  const url = URL.createObjectURL(respaldo.archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = respaldo.nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return marcarRespaldo('descargado');
}

async function marcarRespaldo(resultado: ResultadoEntrega): Promise<ResultadoEntrega> {
  await escribirAjusteCopias('ultimoRespaldoExterno', new Date().toISOString()).catch(() => undefined);
  return resultado;
}

/** Fecha ISO del último respaldo exportado, o null si nunca se hizo. */
export function ultimoRespaldo(): Promise<string | null> {
  return leerAjusteCopias('ultimoRespaldoExterno').catch(() => null);
}

/**
 * Abre el selector de archivos del sistema. Llamar dentro del toque. Resuelve
 * con los bytes del archivo elegido, o null si el usuario cancela.
 */
export function elegirArchivoDeRespaldo(): Promise<Uint8Array | null> {
  return new Promise((resolver) => {
    const entrada = document.createElement('input');
    entrada.type = 'file';
    // Sin `accept`: iOS no conoce la extensión .db y atenuaría el archivo en el
    // selector. Cualquier archivo se puede elegir; la cabecera decide si sirve.
    entrada.style.display = 'none';
    entrada.addEventListener('change', async () => {
      const archivo = entrada.files?.[0];
      entrada.remove();
      resolver(archivo ? new Uint8Array(await archivo.arrayBuffer()) : null);
    });
    entrada.addEventListener('cancel', () => {
      entrada.remove();
      resolver(null);
    });
    document.body.appendChild(entrada);
    entrada.click();
  });
}

export type Inspeccion = { ok: true; versionEsquema: number; resumen: ResumenDatos } | { ok: false; motivo: string };

/** Abre el archivo en memoria y comprueba que sea una base de Ancla sana y restaurable aquí. */
export async function inspeccionarRespaldo(bytes: Uint8Array): Promise<Inspeccion> {
  if (!esArchivoSQLite(bytes)) {
    return { ok: false, motivo: 'Ese archivo no es un respaldo de Ancla.' };
  }
  let copia;
  try {
    copia = await deserializeDatabaseAsync(bytes);
  } catch {
    return { ok: false, motivo: 'El archivo está dañado y no se puede abrir.' };
  }
  try {
    if (!(await verificarIntegridad(copia))) {
      return { ok: false, motivo: 'El archivo está dañado: SQLite encontró errores en su estructura.' };
    }
    const tablas = await listarTablas(copia);
    if (!TABLAS_DE_ANCLA.every((t) => tablas.includes(t))) {
      return { ok: false, motivo: 'Ese archivo es una base de datos, pero no de Ancla.' };
    }
    const versionEsquema = await obtenerVersionEsquema(copia);
    if (versionEsquema > ULTIMA_VERSION) {
      return {
        ok: false,
        motivo: 'Ese respaldo es de una versión más nueva de Ancla. Abre la app con internet para que se actualice y vuelve a intentarlo.',
      };
    }
    return { ok: true, versionEsquema, resumen: await obtenerResumenDatos(copia) };
  } finally {
    await copia.closeAsync();
  }
}

/**
 * Sustituye los datos actuales por los del respaldo. Antes copia los actuales
 * («antes de restaurar»), así que restaurar también se puede deshacer desde
 * las copias automáticas. Un respaldo de una versión anterior se migra al
 * esquema actual. Después hay que recargar la app: las pantallas tienen en
 * memoria los datos viejos.
 */
export async function restaurarRespaldo(bytes: Uint8Array): Promise<void> {
  const inspeccion = await inspeccionarRespaldo(bytes);
  if (!inspeccion.ok) throw new Error(inspeccion.motivo);
  const db = await obtenerBDReal();
  await tomarCopia(db, 'antes-de-restaurar', new Date());
  const copia = await deserializeDatabaseAsync(bytes);
  try {
    await backupDatabaseAsync({ sourceDatabase: copia, destDatabase: db });
  } finally {
    await copia.closeAsync();
  }
  await ejecutarMigraciones(db, new Date());
}

export async function restaurarCopiaAutomatica(id: string): Promise<void> {
  const bytes = await leerCopia(id);
  if (!bytes) throw new Error('Esa copia ya no está disponible.');
  await restaurarRespaldo(bytes);
}

export function listarCopiasAutomaticas(): Promise<MetaCopia[]> {
  return listarCopias().catch(() => []);
}

/** Si el usuario elige empezar de cero, no se le vuelve a ofrecer esa copia. */
export function descartarRecuperacion(copia: MetaCopia): Promise<void> {
  return escribirAjusteCopias('recuperacionDescartadaHasta', copia.creadaEn);
}

export function recuperacionDescartadaHasta(): Promise<string | null> {
  return leerAjusteCopias('recuperacionDescartadaHasta').catch(() => null);
}

/**
 * Vuelve a cargar la app desde su página principal, para que todas las
 * pantallas lean la base restaurada. La dirección base la inyecta el build
 * (`experiments.baseUrl` de app.json).
 */
export function recargarApp(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const base = process.env.EXPO_BASE_URL ?? '';
  window.location.replace(`${base}/`);
}
