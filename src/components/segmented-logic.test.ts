import { moverSegmento } from './segmented-logic';

describe('moverSegmento', () => {
  const segs = [
    { id: 'a', etiqueta: 'A' },
    { id: 'b', etiqueta: 'B' },
    { id: 'c', etiqueta: 'C' },
  ];

  it('avanza al siguiente con dirección +1', () => {
    expect(moverSegmento(segs, 'a', 1)).toBe('b');
    expect(moverSegmento(segs, 'b', 1)).toBe('c');
  });

  it('envuelve al inicio cuando se pasa del último', () => {
    expect(moverSegmento(segs, 'c', 1)).toBe('a');
  });

  it('retrocede con dirección -1', () => {
    expect(moverSegmento(segs, 'b', -1)).toBe('a');
    expect(moverSegmento(segs, 'a', -1)).toBe('c');
  });

  it('si activo no existe, devuelve el primero', () => {
    expect(moverSegmento(segs, 'x', 1)).toBe('a');
    expect(moverSegmento(segs, 'x', -1)).toBe('a');
  });

  it('con array de 1 segmento siempre devuelve ese', () => {
    expect(moverSegmento([{ id: 'solo', etiqueta: 'Solo' }], 'solo', 1)).toBe('solo');
    expect(moverSegmento([{ id: 'solo', etiqueta: 'Solo' }], 'solo', -1)).toBe('solo');
  });

  it('con array vacío no explota', () => {
    expect(moverSegmento([], 'cualquiera', 1)).toBe('cualquiera');
  });
});
