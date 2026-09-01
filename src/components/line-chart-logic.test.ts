import {
  agruparPorPeriodo,
  construirGeometria,
  mejorPunto,
  type PuntoLinea,
} from './line-chart-logic';

describe('agruparPorPeriodo', () => {
  it('"dia" devuelve los puntos ordenados sin agrupar', () => {
    const pts: PuntoLinea[] = [
      { fecha: '2026-08-30', valor: 10 },
      { fecha: '2026-08-29', valor: 5 },
    ];
    const r = agruparPorPeriodo(pts, 'dia');
    expect(r).toEqual([
      { fecha: '2026-08-29', valor: 5 },
      { fecha: '2026-08-30', valor: 10 },
    ]);
  });

  it('"semana" suma puntos que caen en la misma semana (lunes a domingo)', () => {
    // 2026-08-31 es lunes. 2026-09-01 (martes) y 2026-09-02 (miércoles)
    // están en la misma semana.
    const pts: PuntoLinea[] = [
      { fecha: '2026-08-31', valor: 10 },
      { fecha: '2026-09-01', valor: 15 },
      { fecha: '2026-09-02', valor: 5 },
      // 2026-09-07 (lunes siguiente) empieza nueva semana
      { fecha: '2026-09-07', valor: 20 },
    ];
    const r = agruparPorPeriodo(pts, 'semana');
    expect(r).toEqual([
      { fecha: '2026-08-31', valor: 30 },
      { fecha: '2026-09-07', valor: 20 },
    ]);
  });

  it('"mes" agrupa por YYYY-MM-01', () => {
    const pts: PuntoLinea[] = [
      { fecha: '2026-08-15', valor: 10 },
      { fecha: '2026-08-31', valor: 5 },
      { fecha: '2026-09-01', valor: 20 },
    ];
    const r = agruparPorPeriodo(pts, 'mes');
    expect(r).toEqual([
      { fecha: '2026-08-01', valor: 15 },
      { fecha: '2026-09-01', valor: 20 },
    ]);
  });

  it('array vacío devuelve array vacío', () => {
    expect(agruparPorPeriodo([], 'dia')).toEqual([]);
    expect(agruparPorPeriodo([], 'semana')).toEqual([]);
    expect(agruparPorPeriodo([], 'mes')).toEqual([]);
  });
});

describe('construirGeometria', () => {
  it('array vacío devuelve strings vacíos', () => {
    const g = construirGeometria([], 100, 100);
    expect(g.puntosPolyline).toBe('');
    expect(g.puntosArea).toBe('');
    expect(g.puntosCirculo).toEqual([]);
  });

  it('puntos normales generan polyline con N pares x,y', () => {
    const g = construirGeometria(
      [
        { fecha: '2026-08-01', valor: 10 },
        { fecha: '2026-08-02', valor: 20 },
        { fecha: '2026-08-03', valor: 5 },
      ],
      300,
      120,
    );
    const pares = g.puntosPolyline.split(' ');
    expect(pares).toHaveLength(3);
    expect(g.ejeY.max).toBe(20);
    expect(g.ejeY.min).toBe(0);
    expect(g.puntosCirculo).toHaveLength(3);
  });

  it('un solo punto queda centrado horizontalmente', () => {
    const g = construirGeometria(
      [{ fecha: '2026-08-01', valor: 5 }],
      100,
      100,
      10,
      10,
    );
    expect(g.puntosCirculo).toHaveLength(1);
    expect(g.puntosCirculo[0].cx).toBe(50); // 10 + 80/2
  });

  it('todos los valores en 0: la línea queda en la base', () => {
    const g = construirGeometria(
      [
        { fecha: '2026-08-01', valor: 0 },
        { fecha: '2026-08-02', valor: 0 },
      ],
      100,
      100,
      10,
      10,
    );
    const yValues = g.puntosPolyline.split(' ').map((p) => Number(p.split(',')[1]));
    expect(yValues.every((y) => y === 90)).toBe(true); // base = paddingY + interior.alto
  });
});

describe('mejorPunto', () => {
  it('devuelve el índice y valor del máximo', () => {
    const r = mejorPunto([
      { fecha: '2026-08-01', valor: 5 },
      { fecha: '2026-08-02', valor: 50 },
      { fecha: '2026-08-03', valor: 20 },
    ]);
    expect(r).toEqual({ indice: 1, valor: 50, fecha: '2026-08-02' });
  });

  it('array vacío devuelve null', () => {
    expect(mejorPunto([])).toBeNull();
  });

  it('empates: devuelve el primero que aparece', () => {
    const r = mejorPunto([
      { fecha: '2026-08-01', valor: 10 },
      { fecha: '2026-08-02', valor: 10 },
    ]);
    expect(r?.indice).toBe(0);
  });
});
