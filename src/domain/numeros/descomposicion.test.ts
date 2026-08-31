import { descomponer, descomponerConDecimal, ORO, RARA, trocear, trocearConDecimal } from './descomposicion';

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

  it('acepta punto decimal — lo elimina antes de trocear (π-100, φ)', () => {
    expect(trocear('3.14')).toEqual(['31', '4']);
    expect(trocear('31.415')).toEqual(['31', '41', '5']);
    expect(trocear('.141592')).toEqual(['14', '15', '92']);
  });

  it('acepta coma decimal — también la elimina (es-MX/es-ES iOS)', () => {
    expect(trocear('3,14159')).toEqual(['31', '41', '59']);
  });

  it('rechaza solo separador sin dígitos', () => {
    expect(() => trocear('.')).toThrow();
    expect(() => trocear(',')).toThrow();
  });
});

describe('trocearConDecimal — separa entera y decimal (petición UX: π=3, no 31)', () => {
  it('3.14159 → entera "3", decimal "14 15 9"', () => {
    expect(trocearConDecimal('3.14159')).toEqual({ parteEntera: ['3'], parteDecimal: ['14', '15', '9'] });
  });

  it('sin punto se comporta como trocear', () => {
    expect(trocearConDecimal('0453')).toEqual({ parteEntera: ['04', '53'], parteDecimal: [] });
  });

  it('solo-punto inicial → entera vacía, todo decimal', () => {
    expect(trocearConDecimal('.141592')).toEqual({ parteEntera: [], parteDecimal: ['14', '15', '92'] });
  });

  it('π con punto y coma mezclados — el primero gana', () => {
    expect(trocearConDecimal('3.14,159')).toEqual({ parteEntera: ['3'], parteDecimal: ['14', '15', '9'] });
  });

  it('φ (phi) con decimal', () => {
    expect(trocearConDecimal('1.61803')).toEqual({ parteEntera: ['1'], parteDecimal: ['61', '80', '3'] });
  });

  it('e con entero', () => {
    expect(trocearConDecimal('2.71828')).toEqual({ parteEntera: ['2'], parteDecimal: ['71', '82', '8'] });
  });

  it('entero largo con decimal (raíz de 2)', () => {
    expect(trocearConDecimal('1.41421356')).toEqual({ parteEntera: ['1'], parteDecimal: ['41', '42', '13', '56'] });
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
