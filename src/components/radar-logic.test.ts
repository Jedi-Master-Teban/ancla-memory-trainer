import {
  puntoVertice,
  poligonoDatos,
  poligonoAnillo,
  puntoEtiqueta,
} from './radar-logic';

describe('puntoVertice', () => {
  it('índice 0 en radar de 4 → vértice arriba', () => {
    const p = puntoVertice(0, 4, 100, 200, 200);
    expect(p.x).toBeCloseTo(200, 5);
    expect(p.y).toBeCloseTo(100, 5); // arriba = cy - radio
  });

  it('índice 2 en radar de 4 → vértice abajo', () => {
    const p = puntoVertice(2, 4, 100, 200, 200);
    expect(p.x).toBeCloseTo(200, 5);
    expect(p.y).toBeCloseTo(300, 5); // abajo = cy + radio
  });

  it('radio 0 → siempre devuelve el centro', () => {
    const p = puntoVertice(1, 5, 0, 100, 100);
    expect(p.x).toBeCloseTo(100, 5);
    expect(p.y).toBeCloseTo(100, 5);
  });

  it('con 3 ejes (triángulo) genera ángulos de 120°', () => {
    const p0 = puntoVertice(0, 3, 100, 0, 0);
    const p1 = puntoVertice(1, 3, 100, 0, 0);
    const p2 = puntoVertice(2, 3, 100, 0, 0);
    expect(p0.y).toBeCloseTo(-100, 5); // arriba
    expect(p1.x).toBeCloseTo(86.6, 1); // abajo-derecha
    expect(p2.x).toBeCloseTo(-86.6, 1); // abajo-izquierda
  });
});

describe('poligonoDatos', () => {
  it('genera string de puntos SVG para 4 valores', () => {
    const str = poligonoDatos([1, 0.5, 0.75, 0.25], 100, 100, 80);
    const puntos = str.split(' ');
    expect(puntos).toHaveLength(4);
    puntos.forEach((p) => expect(p).toMatch(/^\d+\.\d+,\d+\.\d+$/));
  });

  it('clampa valores > 1 al borde externo', () => {
    const clamped = poligonoDatos([2.5], 0, 0, 100);
    const [x, y] = clamped.split(',').map(Number);
    expect(y).toBeCloseTo(-100, 5); // índice 0 = arriba, radio máximo
  });

  it('clampa valores < 0 al centro', () => {
    const str = poligonoDatos([-0.5], 0, 0, 100);
    const [x, y] = str.split(',').map(Number);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(0, 5);
  });

  it('lista vacía devuelve string vacío', () => {
    expect(poligonoDatos([], 0, 0, 100)).toBe('');
  });
});

describe('poligonoAnillo', () => {
  it('anillo al 50% tiene todos los vértices a mitad de radio', () => {
    const str = poligonoAnillo(4, 0.5, 0, 0, 100);
    const puntos = str.split(' ').map((p) => p.split(',').map(Number));
    puntos.forEach(([x, y]) => {
      const distancia = Math.sqrt(x * x + y * y);
      expect(distancia).toBeCloseTo(50, 5);
    });
  });

  it('anillo al 100% = vértices a radio completo', () => {
    const str = poligonoAnillo(4, 1, 0, 0, 100);
    const puntos = str.split(' ').map((p) => p.split(',').map(Number));
    puntos.forEach(([x, y]) => {
      const distancia = Math.sqrt(x * x + y * y);
      expect(distancia).toBeCloseTo(100, 5);
    });
  });
});

describe('puntoEtiqueta', () => {
  it('con margen positivo queda afuera del último anillo', () => {
    const p = puntoEtiqueta(0, 4, 0, 0, 100, 14);
    expect(p.y).toBeCloseTo(-114, 5); // -100 - 14
  });

  it('sin margen queda sobre el borde', () => {
    const p = puntoEtiqueta(0, 4, 0, 0, 100, 0);
    expect(p.y).toBeCloseTo(-100, 5);
  });
});
