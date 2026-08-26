import { State } from 'ts-fsrs';
import type { FilaTarjeta } from '../../db/tipos';
import { armarSesion } from './motor';

const AHORA = new Date('2026-01-10T00:00:00.000Z');

// Identidad: aísla la lógica de SELECCIÓN del barajado de PRESENTACIÓN,
// que por defecto es aleatorio y haría estos asserts de orden exacto flaky.
const sinBarajar = <T,>(arr: T[]): T[] => arr;

function tarjeta(parcial: Partial<FilaTarjeta> & { id: string }): FilaTarjeta {
  return {
    mazo_id: 'mazo-1',
    categoria: 'colgadero',
    contenido_frente: '1',
    contenido_reverso: 'Tea',
    fsrs_state: State.New,
    fsrs_dificultad: 0,
    fsrs_estabilidad: 0,
    fsrs_reps: 0,
    fsrs_lapses: 0,
    fsrs_scheduled_days: 0,
    fsrs_learning_steps: 0,
    fecha_ultima_revision: null,
    fecha_proxima_revision: AHORA.toISOString(),
    metadata_categoria: '{}',
    creada_en: AHORA.toISOString(),
    archivada: 0,
    ...parcial,
  };
}

describe('armarSesion — selección (con aleatorizar desactivado)', () => {
  it('prioriza vencidas sobre nuevas', () => {
    const nueva = tarjeta({ id: 'nueva', contenido_frente: '1' });
    const vencida = tarjeta({
      id: 'vencida',
      contenido_frente: '2',
      fsrs_state: State.Review,
      fsrs_reps: 1,
      fecha_proxima_revision: new Date(AHORA.getTime() - 86_400_000).toISOString(),
    });

    const sesion = armarSesion([nueva, vencida], { ahora: AHORA, tope: 20, aleatorizar: sinBarajar });

    expect(sesion.map((t) => t.id)).toEqual(['vencida', 'nueva']);
  });

  it('selecciona las vencidas por más urgente (más atrasada) primero', () => {
    const pocoAtrasada = tarjeta({
      id: 'poco',
      fsrs_state: State.Review,
      fsrs_reps: 1,
      fecha_proxima_revision: new Date(AHORA.getTime() - 1_000).toISOString(),
    });
    const muyAtrasada = tarjeta({
      id: 'mucho',
      fsrs_state: State.Review,
      fsrs_reps: 1,
      fecha_proxima_revision: new Date(AHORA.getTime() - 10 * 86_400_000).toISOString(),
    });

    const sesion = armarSesion([pocoAtrasada, muyAtrasada], { ahora: AHORA, tope: 20, aleatorizar: sinBarajar });

    expect(sesion.map((t) => t.id)).toEqual(['mucho', 'poco']);
  });

  it('selecciona las nuevas en orden de número (cobertura sistemática del corpus, no alfabético)', () => {
    const t2 = tarjeta({ id: 't2', contenido_frente: '2' });
    const t10 = tarjeta({ id: 't10', contenido_frente: '10' });
    const t1 = tarjeta({ id: 't1', contenido_frente: '1' });

    const sesion = armarSesion([t10, t2, t1], { ahora: AHORA, tope: 20, aleatorizar: sinBarajar });

    expect(sesion.map((t) => t.id)).toEqual(['t1', 't2', 't10']);
  });

  it('excluye tarjetas archivadas', () => {
    const activa = tarjeta({ id: 'activa' });
    const archivada = tarjeta({ id: 'archivada', archivada: 1 });

    const sesion = armarSesion([activa, archivada], { ahora: AHORA, tope: 20, aleatorizar: sinBarajar });

    expect(sesion.map((t) => t.id)).toEqual(['activa']);
  });

  it('respeta el tope, aun cuando hay más tarjetas disponibles', () => {
    const tarjetas = Array.from({ length: 30 }, (_, i) => tarjeta({ id: `t${i}`, contenido_frente: String(i) }));

    const sesion = armarSesion(tarjetas, { ahora: AHORA, tope: 20 });

    expect(sesion).toHaveLength(20);
  });

  it('usa 20 como tope por defecto si no se especifica', () => {
    const tarjetas = Array.from({ length: 30 }, (_, i) => tarjeta({ id: `t${i}`, contenido_frente: String(i) }));

    const sesion = armarSesion(tarjetas, { ahora: AHORA });

    expect(sesion).toHaveLength(20);
  });

  it('una tarjeta en repaso que aún no vence no entra en la sesión', () => {
    const futura = tarjeta({
      id: 'futura',
      fsrs_state: State.Review,
      fsrs_reps: 1,
      fecha_proxima_revision: new Date(AHORA.getTime() + 86_400_000).toISOString(),
    });

    const sesion = armarSesion([futura], { ahora: AHORA, tope: 20 });

    expect(sesion).toEqual([]);
  });

  it('sin tarjetas disponibles devuelve una sesión vacía', () => {
    expect(armarSesion([], { ahora: AHORA, tope: 20 })).toEqual([]);
  });
});

describe('armarSesion — barajado de presentación', () => {
  it('por defecto invoca el barajado: mismo conjunto de tarjetas, sin garantía de orden', () => {
    const tarjetas = Array.from({ length: 15 }, (_, i) => tarjeta({ id: `t${i}`, contenido_frente: String(i + 1) }));

    const sesion = armarSesion(tarjetas, { ahora: AHORA, tope: 20 });

    expect(sesion).toHaveLength(15);
    expect(new Set(sesion.map((t) => t.id))).toEqual(new Set(tarjetas.map((t) => t.id)));
  });

  it('usa el `aleatorizar` inyectado — así se puede verificar que la selección SÍ pasa por él', () => {
    const tarjetas = Array.from({ length: 5 }, (_, i) => tarjeta({ id: `t${i}`, contenido_frente: String(i + 1) }));
    const invertir = <T,>(arr: T[]): T[] => [...arr].reverse();

    const normal = armarSesion(tarjetas, { ahora: AHORA, tope: 20, aleatorizar: sinBarajar });
    const invertida = armarSesion(tarjetas, { ahora: AHORA, tope: 20, aleatorizar: invertir });

    expect(invertida.map((t) => t.id)).toEqual([...normal.map((t) => t.id)].reverse());
  });
});
