import { State } from 'ts-fsrs';
import type { FilaTarjeta } from '../../db/tipos';
import { mezclarSesion, TOPE_CONSECUTIVAS_MISMA_CATEGORIA } from './mezcla';

const AHORA = new Date('2026-01-10T00:00:00.000Z');

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

function vencida(id: string, categoria: FilaTarjeta['categoria'], diasAtrasada: number): FilaTarjeta {
  return tarjeta({
    id,
    categoria,
    fsrs_state: State.Review,
    fsrs_reps: 1,
    fsrs_estabilidad: 10,
    fecha_ultima_revision: new Date(AHORA.getTime() - (diasAtrasada + 5) * 86_400_000).toISOString(),
    fecha_proxima_revision: new Date(AHORA.getTime() - diasAtrasada * 86_400_000).toISOString(),
  });
}

function rachaMaxima(tarjetas: FilaTarjeta[]): number {
  let maxima = 0;
  let actual = 0;
  let anterior: string | null = null;
  for (const t of tarjetas) {
    actual = t.categoria === anterior ? actual + 1 : 1;
    anterior = t.categoria;
    maxima = Math.max(maxima, actual);
  }
  return maxima;
}

describe('mezclarSesion — prioridad de vencidas', () => {
  it('prioriza vencidas de cualquier categoría sobre nuevas de cualquier categoría', () => {
    const nuevaColgadero = tarjeta({ id: 'n-colgadero', categoria: 'colgadero' });
    const vencidaNaipe = vencida('v-naipe', 'naipe', 3);

    const sesion = mezclarSesion([nuevaColgadero, vencidaNaipe], { ahora: AHORA, metaDiaria: 20 });

    expect(sesion.map((t) => t.id)).toEqual(['v-naipe', 'n-colgadero']);
  });

  it('ordena las vencidas por mayor retraso primero, cruzando categorías', () => {
    const pocoAtrasada = vencida('poco', 'colgadero', 1);
    const muyAtrasada = vencida('mucho', 'naipe', 10);

    const sesion = mezclarSesion([pocoAtrasada, muyAtrasada], { ahora: AHORA, metaDiaria: 20 });

    expect(sesion.map((t) => t.id)).toEqual(['mucho', 'poco']);
  });

  it('en empate exacto de fecha, desambigua por menor retrievability primero (misma categoría, para no cruzar con el intercalado)', () => {
    const mismaFecha = new Date(AHORA.getTime() - 1 * 86_400_000).toISOString();
    const ultimaRevisionComun = new Date(AHORA.getTime() - 20 * 86_400_000).toISOString();

    const estable = tarjeta({
      id: 'estable',
      categoria: 'colgadero',
      fsrs_state: State.Review,
      fsrs_reps: 1,
      fsrs_estabilidad: 100,
      fecha_ultima_revision: ultimaRevisionComun,
      fecha_proxima_revision: mismaFecha,
    });
    const inestable = tarjeta({
      id: 'inestable',
      categoria: 'colgadero',
      fsrs_state: State.Review,
      fsrs_reps: 1,
      fsrs_estabilidad: 2,
      fecha_ultima_revision: ultimaRevisionComun,
      fecha_proxima_revision: mismaFecha,
    });

    const sesion = mezclarSesion([estable, inestable], { ahora: AHORA, metaDiaria: 20 });

    // misma fecha_proxima_revision para ambas — el desempate debe ser por
    // retrievability real (ts-fsrs), nunca un valor fijado a mano.
    expect(sesion.map((t) => t.id)).toEqual(['inestable', 'estable']);
  });
});

describe('mezclarSesion — reparto justo de nuevas entre categorías', () => {
  it('ninguna categoría monopoliza: con cupo para 4, dos categorías con nuevas se turnan', () => {
    const colgaderos = Array.from({ length: 5 }, (_, i) =>
      tarjeta({ id: `c${i}`, categoria: 'colgadero', contenido_frente: String(i + 1) })
    );
    const naipes = Array.from({ length: 5 }, (_, i) =>
      tarjeta({ id: `n${i}`, categoria: 'naipe', contenido_frente: String(i + 1) })
    );

    const sesion = mezclarSesion([...colgaderos, ...naipes], { ahora: AHORA, metaDiaria: 4 });

    expect(sesion).toHaveLength(4);
    const porCategoria = new Set(sesion.map((t) => t.categoria));
    expect(porCategoria.has('colgadero')).toBe(true);
    expect(porCategoria.has('naipe')).toBe(true);
    expect(sesion.filter((t) => t.categoria === 'colgadero')).toHaveLength(2);
    expect(sesion.filter((t) => t.categoria === 'naipe')).toHaveLength(2);
  });

  it('una categoría sin tarjetas no rompe el reparto', () => {
    const colgaderos = Array.from({ length: 3 }, (_, i) =>
      tarjeta({ id: `c${i}`, categoria: 'colgadero', contenido_frente: String(i + 1) })
    );

    const sesion = mezclarSesion(colgaderos, { ahora: AHORA, metaDiaria: 10 });

    expect(sesion).toHaveLength(3);
  });
});

describe('mezclarSesion — tope', () => {
  it('meta diaria grande: el tope cae a 20 (TOPE_POR_DEFECTO de motor.ts, no un número nuevo)', () => {
    const tarjetas = Array.from({ length: 30 }, (_, i) =>
      tarjeta({ id: `t${i}`, contenido_frente: String(i + 1) })
    );

    const sesion = mezclarSesion(tarjetas, { ahora: AHORA, metaDiaria: 50 });

    expect(sesion).toHaveLength(20);
  });

  it('meta diaria pequeña: el tope cae por debajo de 20', () => {
    const tarjetas = Array.from({ length: 30 }, (_, i) =>
      tarjeta({ id: `t${i}`, contenido_frente: String(i + 1) })
    );

    const sesion = mezclarSesion(tarjetas, { ahora: AHORA, metaDiaria: 5 });

    expect(sesion).toHaveLength(5);
  });

  it('topeSesion explícito tiene prioridad sobre el derivado de metaDiaria', () => {
    const tarjetas = Array.from({ length: 30 }, (_, i) =>
      tarjeta({ id: `t${i}`, contenido_frente: String(i + 1) })
    );

    const sesion = mezclarSesion(tarjetas, { ahora: AHORA, metaDiaria: 50, topeSesion: 7 });

    expect(sesion).toHaveLength(7);
  });
});

describe('mezclarSesion — casos vacíos y de exclusión', () => {
  it('excluye tarjetas archivadas', () => {
    const activa = tarjeta({ id: 'activa' });
    const archivada = tarjeta({ id: 'archivada', archivada: 1 });

    const sesion = mezclarSesion([activa, archivada], { ahora: AHORA, metaDiaria: 20 });

    expect(sesion.map((t) => t.id)).toEqual(['activa']);
  });

  it('sin vencidas: la sesión es solo de nuevas', () => {
    const nueva = tarjeta({ id: 'nueva' });

    const sesion = mezclarSesion([nueva], { ahora: AHORA, metaDiaria: 20 });

    expect(sesion.map((t) => t.id)).toEqual(['nueva']);
  });

  it('nada vencido ni nuevo: array vacío', () => {
    const futura = tarjeta({
      id: 'futura',
      fsrs_state: State.Review,
      fsrs_reps: 1,
      fecha_proxima_revision: new Date(AHORA.getTime() + 86_400_000).toISOString(),
    });

    expect(mezclarSesion([futura], { ahora: AHORA, metaDiaria: 20 })).toEqual([]);
  });

  it('sin tarjetas disponibles devuelve una sesión vacía', () => {
    expect(mezclarSesion([], { ahora: AHORA, metaDiaria: 20 })).toEqual([]);
  });
});

describe('mezclarSesion — intercalado (evita rachas largas de la misma categoría)', () => {
  it('seis vencidas de colgadero seguidas de vencidas de otra categoría no quedan seis seguidas', () => {
    const colgaderos = Array.from({ length: 6 }, (_, i) => vencida(`c${i}`, 'colgadero', 20 - i));
    const otras = [vencida('n1', 'naipe', 2), vencida('l1', 'lista_item', 1)];

    const sesion = mezclarSesion([...colgaderos, ...otras], { ahora: AHORA, metaDiaria: 20 });

    expect(sesion).toHaveLength(8);
    expect(rachaMaxima(sesion)).toBeLessThanOrEqual(TOPE_CONSECUTIVAS_MISMA_CATEGORIA);
    // sigue siendo el mismo conjunto, solo reordenado
    expect(new Set(sesion.map((t) => t.id))).toEqual(new Set([...colgaderos, ...otras].map((t) => t.id)));
  });

  it('el intercalado nunca adelanta una nueva por delante de una vencida', () => {
    const colgaderosVencidos = Array.from({ length: 6 }, (_, i) => vencida(`v${i}`, 'colgadero', 20 - i));
    const nuevasVarias = Array.from({ length: 4 }, (_, i) => tarjeta({ id: `nv${i}`, categoria: 'naipe' }));

    const sesion = mezclarSesion([...colgaderosVencidos, ...nuevasVarias], { ahora: AHORA, metaDiaria: 20 });

    const ultimaVencidaIdx = sesion.findLastIndex((t) => t.fsrs_state !== State.New);
    const primeraNuevaIdx = sesion.findIndex((t) => t.fsrs_state === State.New);
    expect(ultimaVencidaIdx).toBeLessThan(primeraNuevaIdx);
  });
});
