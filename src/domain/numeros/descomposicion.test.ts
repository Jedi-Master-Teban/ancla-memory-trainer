import { descomponer, ORO, RARA, trocear } from './descomposicion';

describe('trocear — pares de dígitos de izquierda a derecha', () => {
  it('cantidad par de dígitos → solo pares', () => {
    expect(trocear('3145')).toEqual(['31', '45']);
  });

  it('cantidad impar de dígitos → el dígito sobrante queda al final', () => {
    expect(trocear('12345')).toEqual(['12', '34', '5']);
  });

  it('número largo par: 3001234567 → 30 | 01 | 23 | 45 | 67', () => {
    expect(trocear('3001234567')).toEqual(['30', '01', '23', '45', '67']);
  });

  it('conserva el cero inicial: "0453" no se convierte en "453"', () => {
    // Si se coaccionara a Number primero se perdería el cero y el
    // troceo saldría distinto (["45","3"] en vez de ["04","53"]).
    expect(trocear('0453')).toEqual(['04', '53']);
  });

  it('un solo dígito → un trozo de un dígito', () => {
    expect(trocear('7')).toEqual(['7']);
  });

  it('rechaza cadena vacía', () => {
    expect(() => trocear('')).toThrow();
  });

  it('rechaza caracteres no numéricos', () => {
    expect(() => trocear('12a4')).toThrow();
  });
});

describe('descomponer — resuelve cada trozo a su palabra colgadero', () => {
  const buscarPalabra = (valor: number): string | undefined =>
    ({ 31: 'Mito', 45: 'Cola', 5: 'Ley', 12: 'Tina' })[valor];

  it('3145 → Mito | Cola, según el ejemplo del módulo', () => {
    const trozos = descomponer('3145', buscarPalabra);
    expect(trozos).toEqual([
      { digitos: '31', valor: 31, palabra: 'Mito' },
      { digitos: '45', valor: 45, palabra: 'Cola' },
    ]);
  });

  it('cantidad impar: el dígito sobrante final se resuelve como colgadero 1-9', () => {
    const trozos = descomponer('125', buscarPalabra);
    expect(trozos[trozos.length - 1]).toEqual({ digitos: '5', valor: 5, palabra: 'Ley' });
  });

  it('conserva el cero inicial de un trozo: "04" busca el valor 4, no pierde el dígito mostrado', () => {
    const trozos = descomponer('0453', (valor) => ({ 4: 'Oca', 53: 'Nomo' })[valor]);
    expect(trozos[0]).toEqual({ digitos: '04', valor: 4, palabra: 'Oca' });
  });

  it('trozo "00" resuelve a Rara (ADR-019), sin consultar la búsqueda inyectada', () => {
    const buscarQueNuncaDeberiaLlamarse = jest.fn(() => 'NO_DEBERIA_APARECER');
    const trozos = descomponer('1200', buscarQueNuncaDeberiaLlamarse);
    expect(trozos[1]).toEqual({ digitos: '00', valor: 0, palabra: RARA });
    expect(buscarQueNuncaDeberiaLlamarse).not.toHaveBeenCalledWith(0);
  });

  it('dígito sobrante final "0" resuelve a Oro (ADR-019)', () => {
    const trozos = descomponer('120', buscarPalabra);
    expect(trozos[trozos.length - 1]).toEqual({ digitos: '0', valor: 0, palabra: ORO });
  });

  it('un valor sin palabra en la búsqueda inyectada no revienta: palabra queda null', () => {
    const trozos = descomponer('9999', () => undefined);
    expect(trozos).toEqual([
      { digitos: '99', valor: 99, palabra: null },
      { digitos: '99', valor: 99, palabra: null },
    ]);
  });

  it('una palabra vacía en la búsqueda cuenta como "sin colgadero" (palabra editada a blanco)', () => {
    const trozos = descomponer('31', () => '');
    expect(trozos[0].palabra).toBeNull();
  });
});
