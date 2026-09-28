import { fechaLocal } from '../racha/calculo';

/**
 * Lógica pura de las copias de seguridad (ADR-029). Sin React ni expo-*: decide
 * qué copiar, qué conservar y cuándo ofrecer recuperar, para poder probarlo
 * con Jest. Guardar y leer los bytes vive en `src/db/`.
 *
 * Hay dos clases de copia:
 * - Automáticas, dentro del teléfono: una diaria y una antes de cada
 *   actualización que migre la base. Protegen de una migración fallida o de
 *   que la base aparezca vacía, pero viven en el mismo almacenamiento que la
 *   app: si iOS lo borra entero, se van con él.
 * - El respaldo que el usuario exporta a Archivos o iCloud. Es la única que
 *   sobrevive a borrar la app o cambiar de teléfono.
 */

export type TipoCopia = 'diaria' | 'antes-de-actualizar' | 'antes-de-restaurar';

/** Lo que el usuario ha hecho: si todo es 0, la base está como recién instalada. */
export interface ResumenDatos {
  revisiones: number;
  sesiones: number;
  diasPracticados: number;
  listas: number;
  numeros: number;
}

export interface MetaCopia {
  id: string;
  tipo: TipoCopia;
  /** ISO 8601. */
  creadaEn: string;
  versionEsquema: number;
  resumen: ResumenDatos;
  /** Bytes del archivo. */
  tamano: number;
  /**
   * Nacimiento de la base copiada: la fecha de su primera migración. Distingue
   * «la base se perdió y se creó otra» (nacimiento posterior) de «el usuario
   * borró lo suyo» (la misma base).
   */
  idBase: string;
}

/** Cuántas copias automáticas se conservan de cada tipo. */
export const CONSERVAR: Record<TipoCopia, number> = {
  diaria: 3,
  'antes-de-actualizar': 2,
  'antes-de-restaurar': 2,
};

/** Los 16 primeros bytes de todo archivo SQLite 3: «SQLite format 3» y un NUL. */
const CABECERA_SQLITE = [83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0];

/** ¿Es de verdad una base SQLite? Se mira antes de abrir un archivo que dice ser un respaldo. */
export function esArchivoSQLite(bytes: Uint8Array): boolean {
  if (bytes.length < CABECERA_SQLITE.length) return false;
  return CABECERA_SQLITE.every((b, i) => bytes[i] === b);
}

export function tieneProgreso(resumen: ResumenDatos): boolean {
  return (
    resumen.revisiones > 0 ||
    resumen.sesiones > 0 ||
    resumen.diasPracticados > 0 ||
    resumen.listas > 0 ||
    resumen.numeros > 0
  );
}

const masReciente = (a: MetaCopia, b: MetaCopia) => b.creadaEn.localeCompare(a.creadaEn);

/**
 * Qué copia ofrecer al arrancar, si alguna. La señal de pérdida es que la base
 * actual sea OTRA —nacida después que la de la copia, o sea, recreada desde
 * cero— y esté vacía, mientras una copia de la anterior tiene progreso.
 *
 * Una base vacía no basta: si el usuario borra su única lista, la base queda
 * sin progreso pero es la misma, y ofrecerle «recuperar sus datos» sería
 * absurdo (lo encontró la prueba E2E de restaurar).
 *
 * `descartadaHasta`: si el usuario ya eligió empezar de cero, no se le vuelve a
 * preguntar por las copias de hasta esa fecha.
 */
export function copiaParaRecuperar(
  actual: ResumenDatos,
  idBaseActual: string,
  copias: MetaCopia[],
  descartadaHasta: string | null,
): MetaCopia | null {
  if (tieneProgreso(actual)) return null;
  const candidata = [...copias]
    .filter((c) => tieneProgreso(c.resumen))
    .filter((c) => c.idBase !== '' && c.idBase < idBaseActual)
    .filter((c) => descartadaHasta === null || c.creadaEn > descartadaHasta)
    .sort(masReciente)[0];
  return candidata ?? null;
}

/**
 * Una copia diaria por día de calendario local, y solo si hay progreso: copiar
 * una base vacía desplazaría, en unos días, a las copias buenas.
 */
export function tocaCopiaDiaria(copias: MetaCopia[], actual: ResumenDatos, ahora: Date): boolean {
  if (!tieneProgreso(actual)) return false;
  const hoy = fechaLocal(ahora);
  return !copias.some((c) => c.tipo === 'diaria' && fechaLocal(new Date(c.creadaEn)) === hoy);
}

/**
 * Qué copias sobran: de cada tipo se conservan las `CONSERVAR[tipo]` más
 * recientes. La copia más reciente CON progreso nunca se borra, aunque le toque
 * por antigüedad: si la base se vació y después llegaron actualizaciones, las
 * copias nuevas estarían vacías y empujarían fuera a la única que sirve. Esa
 * copia ocupa uno de los cupos de su tipo, así que el total sigue acotado.
 */
export function copiasABorrar(copias: MetaCopia[]): string[] {
  const protegida = [...copias].filter((c) => tieneProgreso(c.resumen)).sort(masReciente)[0]?.id;
  const borrar: string[] = [];
  for (const tipo of Object.keys(CONSERVAR) as TipoCopia[]) {
    const delTipo = copias.filter((c) => c.tipo === tipo).sort(masReciente);
    const tieneProtegida = delTipo.some((c) => c.id === protegida);
    const otras = delTipo.filter((c) => c.id !== protegida);
    const cupo = CONSERVAR[tipo] - (tieneProtegida ? 1 : 0);
    for (const c of otras.slice(cupo)) borrar.push(c.id);
  }
  return borrar;
}

/** «ancla-respaldo-2026-09-28.db»: la fecha distingue los respaldos en Archivos. */
export function nombreDeRespaldo(ahora: Date): string {
  return `ancla-respaldo-${fechaLocal(ahora)}.db`;
}

const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const contar = (n: number, singular: string, plural: string) => `${miles(n)} ${n === 1 ? singular : plural}`;

/** «1.240 repasos · 45 días de práctica · 3 listas · 2 números», para que el usuario reconozca una copia. */
export function resumenLegible(resumen: ResumenDatos): string {
  const partes: string[] = [];
  if (resumen.revisiones > 0) partes.push(contar(resumen.revisiones, 'repaso', 'repasos'));
  if (resumen.diasPracticados > 0) partes.push(contar(resumen.diasPracticados, 'día de práctica', 'días de práctica'));
  if (resumen.listas > 0) partes.push(contar(resumen.listas, 'lista', 'listas'));
  if (resumen.numeros > 0) partes.push(contar(resumen.numeros, 'número', 'números'));
  return partes.length > 0 ? partes.join(' · ') : 'Sin práctica todavía';
}

const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
const dosCifras = (n: number) => String(n).padStart(2, '0');

/**
 * Cuándo se hizo una copia, como lo diría una persona: «hoy a las 10:32»,
 * «ayer a las 21:05», «el 25 sep. a las 09:00». Hora local del teléfono.
 */
export function describirFecha(iso: string, ahora: Date): string {
  const fecha = new Date(iso);
  const hora = `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
  const dia = fechaLocal(fecha);
  if (dia === fechaLocal(ahora)) return `hoy a las ${hora}`;
  const ayer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1);
  if (dia === fechaLocal(ayer)) return `ayer a las ${hora}`;
  const anio = fecha.getFullYear() === ahora.getFullYear() ? '' : ` de ${fecha.getFullYear()}`;
  return `el ${fecha.getDate()} ${MESES[fecha.getMonth()]}${anio} a las ${hora}`;
}
