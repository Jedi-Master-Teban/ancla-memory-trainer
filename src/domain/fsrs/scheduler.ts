import { createEmptyCard, fsrs, Rating, type Card, type CardInput, type Grade, type RecordLogItem } from 'ts-fsrs';
import type { FilaTarjeta } from '../../db/tipos';
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

/**
 * Reshape puro `FilaTarjeta` (fila de BD) → `CardInput` (lo que espera
 * `ts-fsrs`). Vivía en `repository.ts`; se movió aquí (Fase 5) porque
 * `mezcla.ts` también lo necesita para `retrievability()` y una importación
 * desde `repository.ts` habría creado un ciclo (`repository.ts` ya importa
 * `mezcla.ts` para `armarSesionMixta`).
 */
export function filaTarjetaACardInput(fila: FilaTarjeta): CardInput {
  return {
    due: fila.fecha_proxima_revision,
    stability: fila.fsrs_estabilidad,
    difficulty: fila.fsrs_dificultad,
    elapsed_days: 0,
    scheduled_days: fila.fsrs_scheduled_days,
    learning_steps: fila.fsrs_learning_steps,
    reps: fila.fsrs_reps,
    lapses: fila.fsrs_lapses,
    state: fila.fsrs_state,
    last_review: fila.fecha_ultima_revision,
  };
}
