import type { FilaDiaPractica } from '../../db/tipos';
import { diaAnterior, fechaLocal } from './calculo';

/** Cuántos días hacia atrás se puede congelar (Duolingo: la ventana es corta a propósito). */
export const VENTANA_CONGELABLE_DIAS = 14;

export interface DiaCongelable {
  fecha: string;
  tarjetasRevisadas: number;
}

/**
 * Los días recientes que no cuentan para la racha y que un congelador podría
 * salvar: de ayer hacia atrás, sin los que ya cumplieron la meta ni los ya
 * congelados. Hoy nunca entra: el día no ha terminado (mismo criterio que
 * `calcularRacha`).
 */
export function diasCongelables(dias: FilaDiaPractica[], ahora: Date): DiaCongelable[] {
  const porFecha = new Map(dias.map((d) => [d.fecha_local, d]));
  const resultado: DiaCongelable[] = [];
  let cursor = diaAnterior(fechaLocal(ahora));
  for (let i = 0; i < VENTANA_CONGELABLE_DIAS; i++) {
    const fila = porFecha.get(cursor);
    if (!fila || (fila.meta_cumplida !== 1 && fila.congelador_usado !== 1)) {
      resultado.push({ fecha: cursor, tarjetasRevisadas: fila?.tarjetas_revisadas ?? 0 });
    }
    cursor = diaAnterior(cursor);
  }
  return resultado;
}
