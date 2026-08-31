import { sanitizarDigitosConDecimal } from './entrada';

describe('sanitizarDigitosConDecimal', () => {
  describe('casos válidos básicos', () => {
    it('acepta solo dígitos', () => {
      expect(sanitizarDigitosConDecimal('0453')).toBe('0453');
      expect(sanitizarDigitosConDecimal('14159')).toBe('14159');
    });

    it('acepta dígitos con punto decimal', () => {
      expect(sanitizarDigitosConDecimal('3.14159')).toBe('3.14159');
      expect(sanitizarDigitosConDecimal('2.71828182')).toBe('2.71828182');
    });

    it('acepta punto al inicio (fracciones puras)', () => {
      expect(sanitizarDigitosConDecimal('.14159')).toBe('.14159');
    });

    it('acepta largos arbitrarios (π-100)', () => {
      const pi100 = '3.' + '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
      expect(sanitizarDigitosConDecimal(pi100)).toBe(pi100);
    });
  });

  describe('normalización coma → punto (iOS decimal-pad en es-MX/es-ES)', () => {
    it('coma simple se convierte a punto', () => {
      expect(sanitizarDigitosConDecimal('3,14159')).toBe('3.14159');
    });

    it('mezcla de punto y coma prioriza el primero', () => {
      expect(sanitizarDigitosConDecimal('3.14,159')).toBe('3.14159');
      expect(sanitizarDigitosConDecimal('3,14.159')).toBe('3.14159');
    });
  });

  describe('limitación a un solo separador', () => {
    it('elimina segundos puntos', () => {
      expect(sanitizarDigitosConDecimal('3.14.159')).toBe('3.14159');
    });

    it('elimina puntos extra al final', () => {
      expect(sanitizarDigitosConDecimal('3.14.')).toBe('3.14');
    });

    it('sin punto pero con dígitos se conserva todo', () => {
      expect(sanitizarDigitosConDecimal('314159')).toBe('314159');
    });
  });

  describe('rechazo de caracteres inválidos', () => {
    it('elimina letras, signos y símbolos', () => {
      expect(sanitizarDigitosConDecimal('abc3.14def')).toBe('3.14');
      expect(sanitizarDigitosConDecimal('+3.14')).toBe('3.14');
      expect(sanitizarDigitosConDecimal('-3.14')).toBe('3.14');
      expect(sanitizarDigitosConDecimal('3.14e5')).toBe('3.145');
      expect(sanitizarDigitosConDecimal('3. 14')).toBe('3.14');
    });

    it('cadena vacía u entrada vacía devuelve vacío', () => {
      expect(sanitizarDigitosConDecimal('')).toBe('');
      expect(sanitizarDigitosConDecimal('abc')).toBe('');
    });
  });

  describe('consistencia con flujo de repaso (descomponer tras sanitizar)', () => {
    it('el resultado es compatible con descomponer()', () => {
      // π-100 entra entero; descomponer solo ve los dígitos
      const pi = sanitizarDigitosConDecimal('3.14159265358979');
      expect(pi).toBe('3.14159265358979');
      expect(pi.replace('.', '')).toMatch(/^[0-9]+$/);
    });
  });
});
