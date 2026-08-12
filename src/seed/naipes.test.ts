import { LAS_52_CARTAS } from '../domain/naipes/baraja';
import { NAIPES_52 } from './naipes';

describe('NAIPES_52 (skeleton para que el operador lo llene)', () => {
  it('tiene exactamente 52 entradas', () => {
    expect(NAIPES_52).toHaveLength(52);
  });

  it('cubre exactamente las 52 combinaciones palo+valor de LAS_52_CARTAS, sin duplicados', () => {
    const clavesSemilla = new Set(NAIPES_52.map((n) => `${n.palo}-${n.valor}`));
    const clavesEsperadas = new Set(LAS_52_CARTAS.map((c) => `${c.palo}-${c.valor}`));
    expect(clavesSemilla).toEqual(clavesEsperadas);
    expect(clavesSemilla.size).toBe(52);
  });
});
