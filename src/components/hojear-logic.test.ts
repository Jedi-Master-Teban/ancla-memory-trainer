import type { FilaTarjeta } from '../db/tipos';
import {
  extremosDeRiel,
  indiceInicial,
  indicesDePalo,
  ordenarParaHojear,
  progresoDeRiel,
  restriccionDeNaipe,
} from './hojear-logic';

function tarjeta(parcial: Partial<FilaTarjeta>): FilaTarjeta {
  return {
    id: 't',
    mazo_id: 'm',
    categoria: 'colgadero',
    contenido_frente: '',
    contenido_reverso: '',
    fsrs_state: 0,
    fsrs_dificultad: 0,
    fsrs_estabilidad: 0,
    fsrs_reps: 0,
    fsrs_lapses: 0,
    fsrs_scheduled_days: 0,
    fsrs_learning_steps: 0,
    fecha_ultima_revision: null,
    fecha_proxima_revision: '2026-01-01',
    metadata_categoria: '{}',
    creada_en: '2026-01-01',
    archivada: 0,
    ...parcial,
  };
}

const colgadero = (numero: number) =>
  tarjeta({ id: `c${numero}`, metadata_categoria: JSON.stringify({ numero }) });

const naipe = (palo: string, valor: string) =>
  tarjeta({ id: `${valor}${palo}`, categoria: 'naipe', metadata_categoria: JSON.stringify({ palo, valor }) });

describe('hojear-logic', () => {
  it('colgadero se ordena por el número de metadata, no por el texto del frente', () => {
    const orden = ordenarParaHojear([colgadero(100), colgadero(2), colgadero(37)], 'colgadero');
    expect(orden.map((t) => t.id)).toEqual(['c2', 'c37', 'c100']);
  });

  it('naipes se ordena por palo (♦ ♥ ♠ ♣) y luego por valor (A…K)', () => {
    const orden = ordenarParaHojear(
      [naipe('palos', 'A'), naipe('diamantes', 'K'), naipe('diamantes', 'A'), naipe('corazones', '10')],
      'naipe',
    );
    expect(orden.map((t) => t.id)).toEqual(['Adiamantes', 'Kdiamantes', '10corazones', 'Apalos']);
  });

  it('los extremos del riel son los de la propia lista, no constantes escritas a mano', () => {
    const cs = ordenarParaHojear([colgadero(1), colgadero(100)], 'colgadero');
    expect(extremosDeRiel(cs, 'colgadero')).toEqual({ inicio: '1', fin: '100' });
    const ns = ordenarParaHojear([naipe('diamantes', 'A'), naipe('palos', 'K')], 'naipe');
    expect(extremosDeRiel(ns, 'naipe')).toEqual({ inicio: 'A♦', fin: 'K♣' });
  });

  it('la restricción de una carta numérica nombra inicial de palo y sonidos del valor', () => {
    expect(restriccionDeNaipe({ palo: 'diamantes', valor: '8' })).toBe('D… + sonido Ch/G');
  });

  it('una figura no recibe restricción de sonido final (ADR-017)', () => {
    expect(restriccionDeNaipe({ palo: 'corazones', valor: 'Q' })).toContain('figura');
  });

  it('indicesDePalo apunta al primero de cada palo', () => {
    const orden = ordenarParaHojear([naipe('palos', 'A'), naipe('diamantes', 'A'), naipe('diamantes', '2')], 'naipe');
    expect(indicesDePalo(orden)).toMatchObject({ diamantes: 0, palos: 2 });
  });

  it('el progreso es posición, no dominio: la carta 8 de 52 va al 15 %', () => {
    expect(Math.round(progresoDeRiel(7, 52) * 100)).toBe(15);
  });

  it('una posición guardada fuera de rango vuelve al principio', () => {
    expect(indiceInicial(120, 52)).toBe(0);
    expect(indiceInicial(36, 100)).toBe(36);
    expect(indiceInicial(undefined, 100)).toBe(0);
  });
});
