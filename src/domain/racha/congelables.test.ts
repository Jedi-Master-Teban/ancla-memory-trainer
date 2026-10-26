import type { FilaDiaPractica } from '../../db/tipos';
import { diasCongelables, VENTANA_CONGELABLE_DIAS } from './congelables';

const dia = (fecha_local: string, tarjetas_revisadas: number, meta_cumplida: 0 | 1, congelador_usado: 0 | 1 = 0): FilaDiaPractica =>
  ({ fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado }) as FilaDiaPractica;

// Hoy = 2026-10-25. «Ayer» es el primer día que se puede congelar.
const AHORA = new Date(2026, 9, 25, 12, 0, 0);

describe('diasCongelables — días recientes sin cumplir que aún se pueden congelar', () => {
  it('sin ningún registro, ofrece los 14 días anteriores a hoy, de ayer hacia atrás', () => {
    const r = diasCongelables([], AHORA);
    expect(r).toHaveLength(VENTANA_CONGELABLE_DIAS);
    expect(r[0]).toEqual({ fecha: '2026-10-24', tarjetasRevisadas: 0 });
    expect(r[13].fecha).toBe('2026-10-11');
  });

  it('hoy nunca se ofrece: el día no ha terminado', () => {
    expect(diasCongelables([], AHORA).map((d) => d.fecha)).not.toContain('2026-10-25');
  });

  it('un día que cumplió la meta ya cuenta: no se ofrece', () => {
    const r = diasCongelables([dia('2026-10-24', 25, 1)], AHORA);
    expect(r.map((d) => d.fecha)).not.toContain('2026-10-24');
    expect(r).toHaveLength(VENTANA_CONGELABLE_DIAS - 1);
  });

  it('un día ya congelado no se ofrece otra vez', () => {
    const r = diasCongelables([dia('2026-10-23', 3, 0, 1)], AHORA);
    expect(r.map((d) => d.fecha)).not.toContain('2026-10-23');
  });

  it('un día a medias se ofrece con las tarjetas que sí se repasaron', () => {
    const r = diasCongelables([dia('2026-10-22', 7, 0)], AHORA);
    expect(r.find((d) => d.fecha === '2026-10-22')).toEqual({ fecha: '2026-10-22', tarjetasRevisadas: 7 });
  });

  it('cruza el cambio de mes sin saltarse días', () => {
    const r = diasCongelables([], new Date(2026, 10, 2, 9, 0, 0));
    expect(r.slice(0, 3).map((d) => d.fecha)).toEqual(['2026-11-01', '2026-10-31', '2026-10-30']);
  });
});
