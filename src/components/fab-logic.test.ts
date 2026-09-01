import { categoriaDeRuta } from './fab-logic';

describe('categoriaDeRuta', () => {
  it('detecta colgadero', () => {
    expect(categoriaDeRuta('/colgadero')).toBe('colgadero');
    expect(categoriaDeRuta('/colgadero/flash')).toBe('colgadero');
    expect(categoriaDeRuta('/colgadero/velocidad')).toBe('colgadero');
  });

  it('detecta naipe', () => {
    expect(categoriaDeRuta('/naipes')).toBe('naipe');
    expect(categoriaDeRuta('/naipes/flash')).toBe('naipe');
  });

  it('detecta lista_item (sin colisión con /listas/X)', () => {
    expect(categoriaDeRuta('/listas')).toBe('lista_item');
    expect(categoriaDeRuta('/listas/abc')).toBe('lista_item');
  });

  it('detecta numero', () => {
    expect(categoriaDeRuta('/numeros')).toBe('numero');
    expect(categoriaDeRuta('/numeros/repasar')).toBe('numero');
  });

  it('devuelve null en rutas no-categoría', () => {
    expect(categoriaDeRuta('/')).toBeNull();
    expect(categoriaDeRuta('/editar')).toBeNull();
    expect(categoriaDeRuta('/estadisticas')).toBeNull();
    expect(categoriaDeRuta('/ajustes')).toBeNull();
    expect(categoriaDeRuta('/racha')).toBeNull();
  });

  it('devuelve null con pathname undefined', () => {
    expect(categoriaDeRuta(undefined)).toBeNull();
  });

  it('orden de checks importa: /naipes NO se confunde con /listas', () => {
    expect(categoriaDeRuta('/listas/x')).toBe('lista_item');
    expect(categoriaDeRuta('/numeros/x')).toBe('numero');
  });
});
