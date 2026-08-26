import { COLGADERO_100 } from '../../seed/colgadero';
import { aNumero, decodificar, explicar, validarColgadero } from './decodificador';

describe('semilla colgadero — red de seguridad del módulo (las 100 palabras del operador)', () => {
  it.each(COLGADERO_100.map(({ numero, palabra }) => [palabra, numero] as const))(
    '%s decodifica a %i',
    (palabra, numero) => {
      expect(aNumero(palabra)).toBe(numero);
    }
  );
});

describe('los 12 casos difíciles de decodificacion-fonetica.md §3', () => {
  it.each([
    ['Hucha', 8, 'h inicial muda + dígrafo ch'],
    ['Techo', 18, 'prioridad de ch sobre c'],
    ['Cheque', 84, 'ch + qu ante e (u muda)'],
    ['Acecho', 68, 'c ante e = 6, luego ch = 8'],
    ['Coco', 44, 'ambas c ante o'],
    ['Meca', 34, 'c ante a = 4'],
    ['Corro', 40, 'rr = 0'],
    ['Torre', 10, 'rr = 0'],
    ['Torero', 100, 'dos r simples = 0 y 0'],
    ['Niño', 22, 'ñ = 2'],
    ['Sofá', 67, 'normalización de tilde'],
    ['Guerra', 80, 'gu ante e = 8, luego rr = 0'],
  ] as const)('%s → %i (%s)', (palabra, numero, _descripcion) => {
    expect(aNumero(palabra)).toBe(numero);
  });

  it('Guante → 821 (g+u=8 por regla "g en cualquier otro caso", no por gu+e/i)', () => {
    expect(aNumero('Guante')).toBe(821);
  });

  it('Pingüino → 9282 (ü normalizada a u, luego gu+i=8)', () => {
    expect(aNumero('Pingüino')).toBe(9282);
  });
});

describe('rechazo de entradas inválidas', () => {
  it('cadena vacía lanza error', () => {
    expect(() => decodificar('')).toThrow();
  });

  it('dígitos dentro de la palabra lanzan error', () => {
    expect(() => decodificar('tea1')).toThrow();
  });

  it('caracteres no alfabéticos lanzan error', () => {
    expect(() => decodificar('tea!')).toThrow();
  });

  it('una palabra de solo vocales/mudas no produce ningún dígito y aNumero() lanza error', () => {
    expect(() => aNumero('aeiou')).toThrow();
  });
});

describe('normalización idempotente', () => {
  it('decodificar("Café") y decodificar("cafe") dan el mismo resultado', () => {
    expect(decodificar('Café')).toEqual(decodificar('cafe'));
  });

  it('decodificar("NIÑO") y decodificar("niño") dan el mismo resultado', () => {
    expect(decodificar('NIÑO')).toEqual(decodificar('niño'));
  });
});

describe('explicar()', () => {
  it('produce una cadena que contiene todos los dígitos del resultado', () => {
    const salida = explicar('Techo');
    const { digitos } = decodificar('Techo');
    for (const digito of digitos) {
      expect(salida).toContain(String(digito));
    }
    expect(salida).toContain('18');
  });
});

describe('validarColgadero()', () => {
  it('true cuando la palabra codifica el número', () => {
    expect(validarColgadero(18, 'Techo')).toBe(true);
  });

  it('false cuando no coincide', () => {
    expect(validarColgadero(99, 'Techo')).toBe(false);
  });

  it('false (no lanza) ante una palabra inválida', () => {
    expect(validarColgadero(1, '')).toBe(false);
  });
});
