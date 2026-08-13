import { calcularRacha, diaAnterior, fechaLocal } from './calculo';
import type { FilaDiaPractica, FilaRachaConfig } from '../../db/tipos';

function config(overrides: Partial<FilaRachaConfig> = {}): FilaRachaConfig {
  return { id: 1, meta_diaria: 20, congeladores_disponibles: 2, hora_recordatorio: '21:00', ...overrides };
}

function dia(fecha_local: string, overrides: Partial<FilaDiaPractica> = {}): FilaDiaPractica {
  return { fecha_local, tarjetas_revisadas: 0, meta_cumplida: 0, congelador_usado: 0, ...overrides };
}

describe('fechaLocal', () => {
  it('formatea año-mes-día con ceros a la izquierda', () => {
    expect(fechaLocal(new Date(2026, 0, 5, 15, 0))).toBe('2026-01-05');
  });

  it('lee los getters locales, no UTC — una hora avanzada de la noche no cambia la fecha', () => {
    const tarde = new Date(2026, 0, 5, 23, 30);
    expect(fechaLocal(tarde)).toBe('2026-01-05');
  });
});

describe('diaAnterior — cruza meses y años sin saltos (caso borde 6)', () => {
  it('un día normal', () => {
    expect(diaAnterior('2026-01-05')).toBe('2026-01-04');
  });

  it('cruza de un mes a otro', () => {
    expect(diaAnterior('2026-03-01')).toBe('2026-02-28');
  });

  it('cruza de diciembre a enero, de un año a otro', () => {
    expect(diaAnterior('2027-01-01')).toBe('2026-12-31');
  });

  it('respeta años bisiestos', () => {
    expect(diaAnterior('2028-03-01')).toBe('2028-02-29');
  });
});

describe('calcularRacha — 7 casos borde de 07-racha.md §6', () => {
  it('caso 1: primer día de uso → racha = 1 tras cumplir la meta, el mismo día', () => {
    const dias = [dia('2026-01-05', { tarjetas_revisadas: 20, meta_cumplida: 1 })];
    const ahora = new Date(2026, 0, 5, 15, 0);

    const resultado = calcularRacha(dias, config(), ahora);

    expect(resultado.diasConsecutivos).toBe(1);
    expect(resultado.estado).toBe('activa');
    expect(resultado.metaDeHoyCumplida).toBe(true);
  });

  it('caso 2: hoy sin cumplir, ayer cumplido → racha intacta; "en_riesgo" solo tras la hora de recordatorio', () => {
    const dias = [dia('2026-01-04', { tarjetas_revisadas: 20, meta_cumplida: 1 })];
    const cfg = config({ hora_recordatorio: '21:00' });

    const antesDeLaHora = calcularRacha(dias, cfg, new Date(2026, 0, 5, 18, 0));
    expect(antesDeLaHora.diasConsecutivos).toBe(1);
    expect(antesDeLaHora.metaDeHoyCumplida).toBe(false);
    expect(antesDeLaHora.estado).toBe('activa');

    const despuesDeLaHora = calcularRacha(dias, cfg, new Date(2026, 0, 5, 22, 0));
    expect(despuesDeLaHora.diasConsecutivos).toBe(1);
    expect(despuesDeLaHora.estado).toBe('en_riesgo');
  });

  it('caso 3: un hueco de un día sin congelador → la racha cuenta solo los días posteriores al hueco', () => {
    const dias = [
      dia('2026-01-03', { meta_cumplida: 1 }),
      dia('2026-01-04'),
      dia('2026-01-05', { meta_cumplida: 1 }),
      dia('2026-01-06', { meta_cumplida: 1 }),
    ];
    const ahora = new Date(2026, 0, 7, 10, 0);

    const resultado = calcularRacha(dias, config(), ahora);

    expect(resultado.diasConsecutivos).toBe(2);
  });

  it('caso 4: un hueco cubierto con congelador → la racha continúa', () => {
    const dias = [
      dia('2026-01-01', { meta_cumplida: 1 }),
      dia('2026-01-02', { congelador_usado: 1 }),
      dia('2026-01-03', { meta_cumplida: 1 }),
    ];
    const ahora = new Date(2026, 0, 4, 10, 0);

    const resultado = calcularRacha(dias, config(), ahora);

    expect(resultado.diasConsecutivos).toBe(3);
  });

  it('caso 5: dos huecos seguidos con un solo congelador → la racha se rompe', () => {
    const dias = [
      dia('2026-01-05', { meta_cumplida: 1 }),
      dia('2026-01-06', { congelador_usado: 1 }),
      dia('2026-01-07'),
    ];
    const ahora = new Date(2026, 0, 8, 22, 0);

    const resultado = calcularRacha(dias, config({ hora_recordatorio: '21:00' }), ahora);

    expect(resultado.diasConsecutivos).toBe(0);
    expect(resultado.estado).toBe('rota');
  });

  it('caso 6: cambio de mes y de año → sin saltos', () => {
    const dias = [dia('2026-12-30', { meta_cumplida: 1 }), dia('2026-12-31', { meta_cumplida: 1 })];
    const ahora = new Date(2027, 0, 1, 10, 0);

    const resultado = calcularRacha(dias, config(), ahora);

    expect(resultado.diasConsecutivos).toBe(2);
  });

  it('caso 7: cambio de huso horario — un día saltado por viaje no se "arregla" (ADR-010)', () => {
    const dias = [dia('2026-03-15', { meta_cumplida: 1 })];
    const ahora = new Date(2026, 2, 17, 10, 0); // falta el registro del 16

    const resultado = calcularRacha(dias, config(), ahora);

    expect(resultado.diasConsecutivos).toBe(0);
  });
});

describe('calcularRacha — casos adicionales', () => {
  it('sin ningún día registrado, antes de la hora de recordatorio: activa, no "rota" por defecto', () => {
    const resultado = calcularRacha([], config({ hora_recordatorio: '21:00' }), new Date(2026, 0, 5, 10, 0));
    expect(resultado.diasConsecutivos).toBe(0);
    expect(resultado.estado).toBe('activa');
  });

  it('sin ningún día registrado, después de la hora de recordatorio: rota', () => {
    const resultado = calcularRacha([], config({ hora_recordatorio: '21:00' }), new Date(2026, 0, 5, 22, 0));
    expect(resultado.estado).toBe('rota');
  });

  it('congeladoresDisponibles refleja la config tal cual, sin gastarlo (gastar es acción de repository)', () => {
    const resultado = calcularRacha([], config({ congeladores_disponibles: 3 }), new Date(2026, 0, 5, 10, 0));
    expect(resultado.congeladoresDisponibles).toBe(3);
  });
});
