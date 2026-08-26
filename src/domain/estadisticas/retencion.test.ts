import { Rating, State } from 'ts-fsrs';
import type { FilaRevision, FilaTarjeta } from '../../db/tipos';
import {
  calcularPanelRetencion,
  contarPorEstado,
  esTarjetaProblematica,
  porcentajeRetencion,
} from './retencion';

const AHORA = new Date('2026-01-10T00:00:00.000Z');
const DIA_MS = 86_400_000;

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

function revision(parcial: Partial<FilaRevision> & { id: string; tarjeta_id: string }): FilaRevision {
  return {
    sesion_id: 'sesion-1',
    calificacion: Rating.Good,
    fecha: AHORA.toISOString(),
    estabilidad_antes: 1,
    estabilidad_despues: 2,
    elapsed_days: 1,
    direccion: null,
    ...parcial,
  };
}

describe('porcentajeRetencion', () => {
  it('sin revisiones: null, no 0/0', () => {
    expect(porcentajeRetencion([], 'todo', AHORA)).toBeNull();
  });

  it('las 4 calificaciones: exactamente 50% — Difícil NO cuenta como retenida', () => {
    const revisiones = [
      revision({ id: 'r1', tarjeta_id: 't1', calificacion: Rating.Again }),
      revision({ id: 'r2', tarjeta_id: 't1', calificacion: Rating.Hard }),
      revision({ id: 'r3', tarjeta_id: 't1', calificacion: Rating.Good }),
      revision({ id: 'r4', tarjeta_id: 't1', calificacion: Rating.Easy }),
    ];

    expect(porcentajeRetencion(revisiones, 'todo', AHORA)).toBe(0.5);
  });

  it('ventana 7d incluye el borde exacto (7 días atrás) y excluye un milisegundo antes', () => {
    const bordeExacto = revision({
      id: 'borde',
      tarjeta_id: 't1',
      calificacion: Rating.Good,
      fecha: new Date(AHORA.getTime() - 7 * DIA_MS).toISOString(),
    });
    const fueraDeVentana = revision({
      id: 'fuera',
      tarjeta_id: 't1',
      calificacion: Rating.Good,
      fecha: new Date(AHORA.getTime() - 7 * DIA_MS - 1).toISOString(),
    });

    expect(porcentajeRetencion([bordeExacto], '7d', AHORA)).toBe(1);
    expect(porcentajeRetencion([fueraDeVentana], '7d', AHORA)).toBeNull();
  });

  it('ventana 30d sigue el mismo criterio de borde', () => {
    const dentro = revision({
      id: 'dentro',
      tarjeta_id: 't1',
      fecha: new Date(AHORA.getTime() - 30 * DIA_MS).toISOString(),
    });
    const fuera = revision({
      id: 'fuera',
      tarjeta_id: 't1',
      fecha: new Date(AHORA.getTime() - 30 * DIA_MS - 1).toISOString(),
    });

    expect(porcentajeRetencion([dentro], '30d', AHORA)).toBe(1);
    expect(porcentajeRetencion([fuera], '30d', AHORA)).toBeNull();
  });

  it('ventana "todo" no filtra por edad, incluso muy antigua', () => {
    const antigua = revision({
      id: 'antigua',
      tarjeta_id: 't1',
      fecha: new Date(AHORA.getTime() - 400 * DIA_MS).toISOString(),
    });

    expect(porcentajeRetencion([antigua], 'todo', AHORA)).toBe(1);
  });
});

describe('contarPorEstado', () => {
  it('bucketiza correctamente delegando en estadoVisual, sin reimplementar umbrales', () => {
    const nueva = tarjeta({ id: 'n', fsrs_state: State.New });
    const aprendiendo = tarjeta({ id: 'a', fsrs_state: State.Learning });
    const madura = tarjeta({
      id: 'm',
      fsrs_state: State.Review,
      fsrs_estabilidad: 30,
      fecha_ultima_revision: AHORA.toISOString(),
    });
    const enRiesgo = tarjeta({
      id: 'r',
      fsrs_state: State.Review,
      fsrs_estabilidad: 1,
      fecha_ultima_revision: new Date(AHORA.getTime() - 60 * DIA_MS).toISOString(),
    });

    const conteo = contarPorEstado([nueva, aprendiendo, madura, enRiesgo], AHORA);

    expect(conteo).toEqual({ nueva: 1, aprendiendo: 1, madura: 1, en_riesgo: 1 });
  });

  it('array vacío da todos los conteos en cero', () => {
    expect(contarPorEstado([], AHORA)).toEqual({ nueva: 0, aprendiendo: 0, madura: 0, en_riesgo: 0 });
  });
});

describe('esTarjetaProblematica', () => {
  it('lapses >= 3 califica por sí solo, aunque no llegue a 5 revisiones', () => {
    const t = tarjeta({ id: 't', fsrs_lapses: 3 });
    expect(esTarjetaProblematica(t, 2, null)).toBe(true);
  });

  it('lapses < 3 y menos de 5 revisiones nunca califica por la rama de tasa, ni con 0% de retención', () => {
    const t = tarjeta({ id: 't', fsrs_lapses: 0 });
    expect(esTarjetaProblematica(t, 4, 0)).toBe(false);
  });

  it('exactamente 5 revisiones al 49.9% califica; al 50.0% no', () => {
    const t = tarjeta({ id: 't', fsrs_lapses: 0 });
    expect(esTarjetaProblematica(t, 5, 0.499)).toBe(true);
    expect(esTarjetaProblematica(t, 5, 0.5)).toBe(false);
  });

  it('sin lapses, sin revisiones suficientes y sin tasa: no problemática', () => {
    const t = tarjeta({ id: 't', fsrs_lapses: 0 });
    expect(esTarjetaProblematica(t, 0, null)).toBe(false);
  });
});

describe('calcularPanelRetencion', () => {
  it('agrupa por categoría y separa correctamente activas de archivadas', () => {
    const colgadero1 = tarjeta({ id: 'c1', categoria: 'colgadero' });
    const colgadero2Archivada = tarjeta({ id: 'c2', categoria: 'colgadero', archivada: 1 });
    const naipe1 = tarjeta({ id: 'n1', categoria: 'naipe' });

    const revisiones = [
      revision({ id: 'r1', tarjeta_id: 'c1', calificacion: Rating.Good }),
      // revisión de una tarjeta YA archivada: cuenta en §2 (revision nunca se borra),
      // pero c2 no debe aparecer en tarjetasProblematicas (§4 solo activas)
      revision({ id: 'r2', tarjeta_id: 'c2', calificacion: Rating.Again }),
      revision({ id: 'r3', tarjeta_id: 'n1', calificacion: Rating.Easy }),
    ];

    const panel = calcularPanelRetencion([colgadero1, colgadero2Archivada, naipe1], revisiones, 'todo', AHORA);

    const colgaderoMetricas = panel.porCategoria.find((m) => m.categoria === 'colgadero');
    expect(colgaderoMetricas?.porcentajeRetencion).toBe(0.5); // r1 (Good) + r2 (Again) = 1/2

    expect(panel.tarjetasProblematicas.some((p) => p.tarjeta.id === 'c2')).toBe(false);
  });

  it('tarjetas problemáticas quedan ordenadas peor primero: tasa ascendente, luego lapses descendente', () => {
    const peorTasa = tarjeta({ id: 'peor-tasa', fsrs_lapses: 3 });
    const muchosLapsesTasaAlta = tarjeta({ id: 'muchos-lapses', fsrs_lapses: 10 });

    const revisiones = [
      // peorTasa: 5 revisiones, 0% retención
      ...Array.from({ length: 5 }, (_, i) =>
        revision({ id: `pt${i}`, tarjeta_id: 'peor-tasa', calificacion: Rating.Again })
      ),
      // muchosLapsesTasaAlta: 5 revisiones, 100% retención — solo califica por lapses>=3
      ...Array.from({ length: 5 }, (_, i) =>
        revision({ id: `ml${i}`, tarjeta_id: 'muchos-lapses', calificacion: Rating.Good })
      ),
    ];

    const panel = calcularPanelRetencion([peorTasa, muchosLapsesTasaAlta], revisiones, 'todo', AHORA);

    expect(panel.tarjetasProblematicas.map((p) => p.tarjeta.id)).toEqual(['peor-tasa', 'muchos-lapses']);
  });

  it('sin tarjetas ni revisiones: panel vacío pero con las 4 categorías presentes', () => {
    const panel = calcularPanelRetencion([], [], 'todo', AHORA);
    expect(panel.porCategoria).toHaveLength(4);
    expect(panel.porCategoria.every((m) => m.porcentajeRetencion === null)).toBe(true);
    expect(panel.tarjetasProblematicas).toEqual([]);
  });
});
