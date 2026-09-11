import type { Card, CardInput } from 'ts-fsrs';
import { programar, type Calificacion } from './scheduler';

/**
 * Previsualización de los 4 intervalos de FSRS (DESIGN.md §5.5).
 *
 * Los botones de calificación muestran debajo de su etiqueta cuándo volvería
 * la tarjeta con cada respuesta. La regla dura: ese número lo calcula el
 * scheduler, NUNCA se escribe a mano. Los `<10 min / 2 d / 6 d / 12 d` del
 * mockup son un ejemplo de un caso concreto, no una constante de la app: FSRS
 * los deriva del estado real de cada tarjeta, así que cambian tarjeta a
 * tarjeta y sesión a sesión. Escribirlos fijos convertiría la UI en una
 * mentira sobre el algoritmo.
 *
 * `programar` es puro (no escribe en BD), así que llamarlo cuatro veces para
 * previsualizar no tiene efectos secundarios.
 */

const ORDEN: Calificacion[] = ['otra_vez', 'dificil', 'bien', 'facil'];

/** Formato humano y corto — tiene que caber en 10 px bajo la etiqueta. */
export function formatearIntervalo(desde: Date, hasta: Date): string {
  const minutos = Math.round((hasta.getTime() - desde.getTime()) / 60_000);
  if (minutos < 60) return `${Math.max(1, minutos)} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 31) return `${dias} d`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return `${meses} m`;
  const anios = (dias / 365).toFixed(dias % 365 === 0 ? 0 : 1);
  return `${anios} a`;
}

export type IntervalosPrevistos = Record<Calificacion, string>;

export function intervalosPrevistos(
  tarjeta: Card | CardInput,
  ahora: Date,
): IntervalosPrevistos {
  const salida = {} as IntervalosPrevistos;
  for (const calificacion of ORDEN) {
    const { card } = programar(tarjeta, calificacion, ahora);
    salida[calificacion] = formatearIntervalo(ahora, new Date(card.due));
  }
  return salida;
}
