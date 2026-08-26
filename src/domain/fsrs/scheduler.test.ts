import { State, type Card, type CardInput } from 'ts-fsrs';
import { crearTarjetaNueva, programar, retrievability } from './scheduler';
import { estadoVisual } from './estado';

const AHORA = new Date('2026-01-01T00:00:00.000Z');

describe('E-1: tarjeta nueva calificada Bien', () => {
  it('deja de ser nueva, programa fecha futura, con estabilidad y dificultad inicializadas por la librería', () => {
    const nueva = crearTarjetaNueva(AHORA);
    expect(nueva.state).toBe(State.New);

    const resultado = programar(nueva, 'bien', AHORA);

    expect(resultado.card.state).not.toBe(State.New);
    expect(resultado.card.due.getTime()).toBeGreaterThan(AHORA.getTime());
    expect(Number.isFinite(resultado.card.stability)).toBe(true);
    expect(resultado.card.stability).toBeGreaterThan(0);
    expect(Number.isFinite(resultado.card.difficulty)).toBe(true);
    expect(resultado.card.difficulty).toBeGreaterThan(0);
  });
});

describe('E-2: tarjeta nueva calificada Otra vez', () => {
  it('sigue en aprendizaje y la próxima revisión es del mismo día (intervalo mínimo)', () => {
    const nueva = crearTarjetaNueva(AHORA);

    const resultado = programar(nueva, 'otra_vez', AHORA);

    expect(resultado.card.state).toBe(State.Learning);
    const intervaloMs = resultado.card.due.getTime() - AHORA.getTime();
    expect(intervaloMs).toBeGreaterThanOrEqual(0);
    expect(intervaloMs).toBeLessThan(24 * 60 * 60 * 1000);
  });
});

describe('E-3: monotonía de los cuatro grados (invariante I-3)', () => {
  it('Again ≤ Hard ≤ Good ≤ Easy sobre una tarjeta nueva', () => {
    const nueva = crearTarjetaNueva(AHORA);

    const again = programar(nueva, 'otra_vez', AHORA).card.due.getTime();
    const hard = programar(nueva, 'dificil', AHORA).card.due.getTime();
    const good = programar(nueva, 'bien', AHORA).card.due.getTime();
    const easy = programar(nueva, 'facil', AHORA).card.due.getTime();

    expect(again).toBeLessThanOrEqual(hard);
    expect(hard).toBeLessThanOrEqual(good);
    expect(good).toBeLessThanOrEqual(easy);
  });

  it('Again ≤ Hard ≤ Good ≤ Easy sobre una tarjeta en repaso', () => {
    let tarjeta: Card = crearTarjetaNueva(AHORA);
    tarjeta = programar(tarjeta, 'bien', AHORA).card;
    const segundaRevision = new Date(tarjeta.due);
    tarjeta = programar(tarjeta, 'bien', segundaRevision).card;
    expect(tarjeta.state).toBe(State.Review);

    const puntoDePartida = new Date(tarjeta.due);
    const again = programar(tarjeta, 'otra_vez', puntoDePartida).card.due.getTime();
    const hard = programar(tarjeta, 'dificil', puntoDePartida).card.due.getTime();
    const good = programar(tarjeta, 'bien', puntoDePartida).card.due.getTime();
    const easy = programar(tarjeta, 'facil', puntoDePartida).card.due.getTime();

    expect(again).toBeLessThanOrEqual(hard);
    expect(hard).toBeLessThanOrEqual(good);
    expect(good).toBeLessThanOrEqual(easy);
  });
});

describe('E-4: lapso de una tarjeta madura', () => {
  it('calificada Otra vez: la estabilidad decrece, lapses sube, pasa a relearning, y nunca se reporta madura', () => {
    const tarjetaMadura: CardInput = {
      due: AHORA,
      stability: 60,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 60,
      learning_steps: 0,
      reps: 10,
      lapses: 0,
      state: State.Review,
      last_review: new Date('2025-11-02T00:00:00.000Z'),
    };

    const resultado = programar(tarjetaMadura, 'otra_vez', AHORA);

    expect(resultado.card.stability).toBeLessThan(60);
    expect(resultado.card.lapses).toBe(1);
    expect(resultado.card.state).toBe(State.Relearning);

    const estado = estadoVisual(resultado.card, AHORA);
    expect(estado).not.toBe('madura');
  });
});

describe('E-5: ida y vuelta por SQLite (serialización ISO)', () => {
  it('programar tras serializar a ISO y deserializar da el mismo resultado que programar en memoria', () => {
    const nueva = crearTarjetaNueva(AHORA);
    const primero = programar(nueva, 'bien', AHORA).card;

    const serializado: CardInput = {
      due: primero.due.toISOString(),
      stability: primero.stability,
      difficulty: primero.difficulty,
      elapsed_days: 0,
      scheduled_days: primero.scheduled_days,
      learning_steps: primero.learning_steps,
      reps: primero.reps,
      lapses: primero.lapses,
      state: primero.state,
      last_review: primero.last_review ? primero.last_review.toISOString() : null,
    };

    const siguienteFecha = new Date(primero.due);

    const resultadoDesdeSQLite = programar(serializado, 'bien', siguienteFecha);
    const resultadoEnMemoria = programar(primero, 'bien', siguienteFecha);

    expect(resultadoDesdeSQLite.card.stability).toBeCloseTo(resultadoEnMemoria.card.stability, 10);
    expect(resultadoDesdeSQLite.card.difficulty).toBeCloseTo(resultadoEnMemoria.card.difficulty, 10);
    expect(resultadoDesdeSQLite.card.due.getTime()).toBe(resultadoEnMemoria.card.due.getTime());
    expect(resultadoDesdeSQLite.card.state).toBe(resultadoEnMemoria.card.state);
  });
});

describe('retrievability()', () => {
  it('una tarjeta recién calificada tiene retrievability cercana a 1 en el mismo instante', () => {
    const nueva = crearTarjetaNueva(AHORA);
    const { card } = programar(nueva, 'bien', AHORA);

    const r = retrievability(card, AHORA);

    expect(r).toBeGreaterThan(0.9);
    expect(r).toBeLessThanOrEqual(1);
  });
});
