import type { Carta } from '../fonetica/naipes';
import { compararReproduccion, generarOrdenBaraja, LAS_52_CARTAS } from './baraja';

const sinBarajar = <T,>(arr: T[]): T[] => arr;

describe('LAS_52_CARTAS', () => {
  it('contiene exactamente 52 cartas: 4 palos × 13 valores', () => {
    expect(LAS_52_CARTAS).toHaveLength(52);
  });

  it('no tiene cartas repetidas', () => {
    const claves = new Set(LAS_52_CARTAS.map((c) => `${c.palo}-${c.valor}`));
    expect(claves.size).toBe(52);
  });
});

describe('generarOrdenBaraja', () => {
  it('por defecto baraja: mismo conjunto de 52 cartas, sin garantía de orden', () => {
    const orden = generarOrdenBaraja(LAS_52_CARTAS);
    expect(orden).toHaveLength(52);
    expect(new Set(orden.map((c) => `${c.palo}-${c.valor}`))).toEqual(
      new Set(LAS_52_CARTAS.map((c) => `${c.palo}-${c.valor}`))
    );
  });

  it('usa el aleatorizador inyectado', () => {
    const invertir = <T,>(arr: T[]): T[] => [...arr].reverse();
    const normal = generarOrdenBaraja(LAS_52_CARTAS, sinBarajar);
    const invertida = generarOrdenBaraja(LAS_52_CARTAS, invertir);
    expect(invertida).toEqual([...normal].reverse());
  });
});

describe('compararReproduccion — comparación posicional', () => {
  const original: Carta[] = [
    { palo: 'espadas', valor: 'A' },
    { palo: 'diamantes', valor: '2' },
    { palo: 'palos', valor: 'K' },
  ];

  it('reproducción perfecta: todas correctas', () => {
    const resultado = compararReproduccion(original, original);
    expect(resultado).toEqual({ correctas: 3, total: 3, aciertosPorPosicion: [true, true, true] });
  });

  it('detecta fallos por posición, no por presencia en la lista', () => {
    // segunda y tercera posición cambiadas de orden entre sí
    const reproducida: Carta[] = [
      { palo: 'espadas', valor: 'A' },
      { palo: 'palos', valor: 'K' },
      { palo: 'diamantes', valor: '2' },
    ];
    const resultado = compararReproduccion(original, reproducida);
    expect(resultado).toEqual({ correctas: 1, total: 3, aciertosPorPosicion: [true, false, false] });
  });

  it('una reproducción incompleta cuenta las posiciones faltantes como fallo', () => {
    const reproducida: Carta[] = [{ palo: 'espadas', valor: 'A' }];
    const resultado = compararReproduccion(original, reproducida);
    expect(resultado.correctas).toBe(1);
    expect(resultado.total).toBe(3);
    expect(resultado.aciertosPorPosicion).toEqual([true, false, false]);
  });
});
