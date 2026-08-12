import { createEmptyCard, fsrs, Rating, type Card, type CardInput, type Grade, type RecordLogItem } from 'ts-fsrs';
import { FSRS_PARAMS } from './config';

export type Calificacion = 'otra_vez' | 'dificil' | 'bien' | 'facil';

const CALIFICACION_A_GRADE: Record<Calificacion, Grade> = {
  otra_vez: Rating.Again,
  dificil: Rating.Hard,
  bien: Rating.Good,
  facil: Rating.Easy,
};

const f = fsrs(FSRS_PARAMS);

export function crearTarjetaNueva(ahora: Date): Card {
  return createEmptyCard(ahora);
}

export function programar(tarjeta: Card | CardInput, calificacion: Calificacion, ahora: Date): RecordLogItem {
  return f.next(tarjeta, ahora, CALIFICACION_A_GRADE[calificacion]);
}

export function retrievability(tarjeta: Card | CardInput, ahora: Date): number {
  return f.get_retrievability(tarjeta, ahora, false);
}
