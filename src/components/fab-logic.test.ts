import { categoriaDeRuta, rutaCrear } from './fab-logic';

describe('categoriaDeRuta', () => {
  describe('pantallas de categoría', () => {
    it('detecta colgadero', () => {
      expect(categoriaDeRuta('/colgadero')).toBe('colgadero');
    });

    it('detecta naipes', () => {
      expect(categoriaDeRuta('/naipes')).toBe('naipe');
    });

    it('detecta listas', () => {
      expect(categoriaDeRuta('/listas')).toBe('lista_item');
    });

    it('detecta numeros', () => {
      expect(categoriaDeRuta('/numeros')).toBe('numero');
    });

    it('detecta rutas drill-down de categoría', () => {
      expect(categoriaDeRuta('/colgadero/flash')).toBe('colgadero');
      expect(categoriaDeRuta('/colgadero/velocidad')).toBe('colgadero');
      expect(categoriaDeRuta('/numeros/repasar')).toBe('numero');
      expect(categoriaDeRuta('/naipes/123')).toBe('naipe');
    });
  });

  describe('pantallas de creación', () => {
    it('detecta /crear/colgadero como categoría colgadero', () => {
      expect(categoriaDeRuta('/crear/colgadero')).toBe('colgadero');
    });

    it('detecta /crear/naipe como categoría naipe', () => {
      expect(categoriaDeRuta('/crear/naipe')).toBe('naipe');
    });

    it('detecta /crear/lista_item como categoría lista_item', () => {
      expect(categoriaDeRuta('/crear/lista_item')).toBe('lista_item');
    });

    it('detecta /crear/numero como categoría numero', () => {
      expect(categoriaDeRuta('/crear/numero')).toBe('numero');
    });

    it('detecta /crear con id (modo edición)', () => {
      expect(categoriaDeRuta('/crear/colgadero?id=42')).toBe('colgadero');
    });
  });

  describe('rutas no-categoría', () => {
    it('devuelve null en inicio', () => {
      expect(categoriaDeRuta('/')).toBeNull();
    });

    it('devuelve null en editar', () => {
      expect(categoriaDeRuta('/editar')).toBeNull();
    });

    it('devuelve null en estadísticas', () => {
      expect(categoriaDeRuta('/estadisticas')).toBeNull();
    });

    it('devuelve null en ajustes', () => {
      expect(categoriaDeRuta('/ajustes')).toBeNull();
    });
  });

  it('devuelve null con pathname undefined', () => {
    expect(categoriaDeRuta(undefined)).toBeNull();
  });
});

describe('rutaCrear', () => {
  it('colgadero → /crear/colgadero', () => {
    expect(rutaCrear('colgadero')).toBe('/crear/colgadero');
  });

  it('naipe → /crear/naipe', () => {
    expect(rutaCrear('naipe')).toBe('/crear/naipe');
  });

  it('lista_item → /crear/lista_item', () => {
    expect(rutaCrear('lista_item')).toBe('/crear/lista_item');
  });

  it('numero → /crear/numero', () => {
    expect(rutaCrear('numero')).toBe('/crear/numero');
  });
});
