import { coloresDelTema } from '../../tema/colores';
import { colorRachaPorDias, siguienteUmbral } from './streak-color';

describe('colorRachaPorDias', () => {
  const tokens = coloresDelTema('soft');

  it('0 días → sin color de racha (gris muted)', () => {
    const c = colorRachaPorDias(0, tokens);
    expect(c.fondo).toBe('transparent');
    expect(c.halo).toBe('transparent');
  });

  it('1-6 días → amarillo suave', () => {
    expect(colorRachaPorDias(1, tokens).borde).toBe('#F59E0B');
    expect(colorRachaPorDias(6, tokens).borde).toBe('#F59E0B');
  });

  it('7-29 días → naranja (accent del tema)', () => {
    const c = colorRachaPorDias(15, tokens);
    expect(c.borde).toBe(tokens.accent1);
  });

  it('30-99 días → rojo brillante', () => {
    expect(colorRachaPorDias(50, tokens).borde).toBe('#EF4444');
  });

  it('100-364 días → rojo con halo (mastery)', () => {
    const c = colorRachaPorDias(150, tokens);
    expect(c.borde).toBe('#FF4500');
    expect(c.halo).toContain('#FF4500');
  });

  it('365+ días → dorado legend', () => {
    expect(colorRachaPorDias(365, tokens).borde).toBe('#FFD700');
    expect(colorRachaPorDias(1000, tokens).borde).toBe('#FFD700');
  });

  it('siempre devuelve los 3 campos (fondo, borde, halo)', () => {
    [0, 1, 7, 30, 100, 365].forEach((d) => {
      const c = colorRachaPorDias(d, tokens);
      expect(c.fondo).toBeDefined();
      expect(c.borde).toBeDefined();
      expect(c.halo).toBeDefined();
    });
  });
});

describe('siguienteUmbral', () => {
  it('0-6 días → meta "Una semana"', () => {
    expect(siguienteUmbral(0)).toEqual({ dias: 7, etiqueta: 'Una semana' });
    expect(siguienteUmbral(6)).toEqual({ dias: 7, etiqueta: 'Una semana' });
  });

  it('7-29 días → meta "Un mes"', () => {
    expect(siguienteUmbral(7)).toEqual({ dias: 30, etiqueta: 'Un mes' });
    expect(siguienteUmbral(29)).toEqual({ dias: 30, etiqueta: 'Un mes' });
  });

  it('30-99 días → meta "100 días"', () => {
    expect(siguienteUmbral(30)).toEqual({ dias: 100, etiqueta: '100 días (mastery)' });
  });

  it('100-364 días → meta "Un año"', () => {
    expect(siguienteUmbral(100)).toEqual({ dias: 365, etiqueta: 'Un año (legend)' });
  });

  it('365+ días → null (ya está en legend)', () => {
    expect(siguienteUmbral(365)).toBeNull();
    expect(siguienteUmbral(1000)).toBeNull();
  });
});
