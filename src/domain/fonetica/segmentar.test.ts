import { COLGADERO_100 } from '../../seed/colgadero';
import { decodificar, segmentarPalabra, type Segmento } from './decodificador';
import { segmentarPalabraNaipe } from './naipes';

/** Atajo de lectura: [texto, dígito] por tramo. */
const pares = (s: Segmento[] | null) => s?.map((x) => [x.texto, x.digito]);

describe('segmentarPalabra — la palabra original partida en sonidos que codifican', () => {
  it('resalta cada consonante con su dígito y deja las vocales sin valor', () => {
    expect(pares(segmentarPalabra('Tufo'))).toEqual([
      ['T', 1],
      ['u', null],
      ['f', 7],
      ['o', null],
    ]);
  });

  it('conserva mayúsculas y tildes tal como las ve el operador', () => {
    expect(pares(segmentarPalabra('Mamá'))).toEqual([
      ['M', 3],
      ['a', null],
      ['m', 3],
      ['á', null],
    ]);
  });

  it('un dígrafo es UN tramo, no dos letras sueltas', () => {
    expect(pares(segmentarPalabra('Chile'))).toEqual([
      ['Ch', 8],
      ['i', null],
      ['l', 5],
      ['e', null],
    ]);
    expect(pares(segmentarPalabra('Queso'))).toEqual([
      ['Qu', 4],
      ['e', null],
      ['s', 6],
      ['o', null],
    ]);
  });

  it('palabras compuestas: los espacios quedan en su sitio aunque normalizar() los quite', () => {
    // Este es el caso que hace falta traducir: los índices del decodificador
    // cuentan sobre "marazul", no sobre "Mar Azul".
    expect(pares(segmentarPalabra('Mar Azul'))).toEqual([
      ['M', 3],
      ['a', null],
      ['r', 0],
      [' A', null],
      ['z', 6],
      ['u', null],
      ['l', 5],
    ]);
  });

  it('devuelve null si la palabra no se puede decodificar, para caer al texto plano', () => {
    expect(segmentarPalabra('Tufo!')).toBeNull();
    expect(segmentarPalabra('')).toBeNull();
  });

  describe('red de seguridad: las 100 palabras del operador', () => {
    it.each(COLGADERO_100.map(({ numero, palabra }) => [palabra, numero] as const))(
      '%s (%i) se reconstruye idéntica y resalta exactamente sus dígitos',
      (palabra) => {
        const segmentos = segmentarPalabra(palabra);
        expect(segmentos).not.toBeNull();
        expect(segmentos!.map((s) => s.texto).join('')).toBe(palabra);
        const resaltados = segmentos!.filter((s) => s.digito !== null).map((s) => s.digito);
        expect(resaltados).toEqual(decodificar(palabra).digitos);
      },
    );
  });
});

describe('segmentarPalabraNaipe — el marcador de palo va aparte de la codificación', () => {
  it('la primera letra es el palo, no un dígito; el resto se decodifica', () => {
    const s = segmentarPalabraNaipe('Dato', { palo: 'diamantes', valor: 'A' });
    expect(s?.[0]).toEqual({ texto: 'D', digito: null, palo: 'diamantes' });
    expect(pares(s?.slice(1) ?? null)).toEqual([
      ['a', null],
      ['t', 1],
      ['o', null],
    ]);
  });

  it('una figura no tiene sonido que decodificar (ADR-017): marcador + resto sin resaltar', () => {
    const s = segmentarPalabraNaipe('Dama', { palo: 'diamantes', valor: 'Q' });
    expect(s).toEqual([
      { texto: 'D', digito: null, palo: 'diamantes' },
      { texto: 'ama', digito: null },
    ]);
  });

  it('null si la palabra no empieza por la letra del palo', () => {
    expect(segmentarPalabraNaipe('Tufo', { palo: 'diamantes', valor: '7' })).toBeNull();
  });

  it('null en Corazones + "ch": es ambiguo, igual que en validarPalabraNaipe', () => {
    expect(segmentarPalabraNaipe('Chino', { palo: 'corazones', valor: '2' })).toBeNull();
  });
});
