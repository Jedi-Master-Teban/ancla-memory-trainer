import {
  destinoDelFab,
  CATEGORIAS_CREABLES, categoriaDeRuta, debeMostrarFab, esRutaDeSesion, rutaCrear } from './fab-logic';

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

describe('esRutaDeSesion', () => {
  it.each([
    '/colgadero/flash',
    '/colgadero/reverso',
    '/colgadero/velocidad',
    '/naipes/flash',
    '/naipes/reverso',
    '/naipes/velocidad',
    '/naipes/baraja-completa',
    '/listas/estudiar',
    '/numeros/repasar',
    '/practicar',
    '/practica-libre',
    '/resumen-sesion',
  ])('%s es sesión', (ruta) => {
    expect(esRutaDeSesion(ruta)).toBe(true);
  });

  it.each(['/', '/colgadero', '/naipes', '/listas', '/numeros', '/editar'])(
    '%s no es sesión',
    (ruta) => {
      expect(esRutaDeSesion(ruta)).toBe(false);
    },
  );

  it('ignora la query string', () => {
    expect(esRutaDeSesion('/colgadero/flash?id=3')).toBe(true);
  });

  it('undefined no es sesión', () => {
    expect(esRutaDeSesion(undefined)).toBe(false);
  });
});

describe('debeMostrarFab', () => {
  describe('lo esconde donde no se puede crear nada', () => {
    it('en Inicio', () => {
      expect(debeMostrarFab('/')).toBe(false);
      expect(debeMostrarFab('/index')).toBe(false);
    });

    it.each(['/estadisticas', '/ajustes', '/racha', '/historial-sesiones'])(
      'en %s — son de consulta, no se crea nada',
      (ruta) => {
        expect(debeMostrarFab(ruta)).toBe(false);
      },
    );

    it('en la Guía y sus capítulos — se lee, no se crea nada', () => {
      expect(debeMostrarFab('/guia')).toBe(false);
      expect(debeMostrarFab('/guia/colgadero')).toBe(false);
    });

    it('durante una sesión de estudio — competía con los botones de calificar', () => {
      expect(debeMostrarFab('/colgadero/flash')).toBe(false);
      expect(debeMostrarFab('/naipes/reverso')).toBe(false);
      expect(debeMostrarFab('/practicar')).toBe(false);
      expect(debeMostrarFab('/listas/estudiar')).toBe(false);
      expect(debeMostrarFab('/resumen-sesion')).toBe(false);
    });

    it('sin pathname', () => {
      expect(debeMostrarFab(undefined)).toBe(false);
    });

    it.each(['/naipes', '/naipes/baraja-completa', '/crear/naipe', '/crear/naipe?id=4'])(
      'en %s — los naipes son 52 cartas fijas, no se crean',
      (ruta) => {
        expect(debeMostrarFab(ruta)).toBe(false);
      },
    );

    it.each(['/crear/colgadero', '/crear/lista_item', '/crear/lista_item?listaId=7'])(
      'en el formulario %s — un «+» sobre el formulario no crea nada',
      (ruta) => {
        expect(debeMostrarFab(ruta)).toBe(false);
      },
    );
  });

  describe('lo muestra donde sí se crea', () => {
    it.each(['/colgadero', '/listas', '/numeros', '/listas/7'])('en %s', (ruta) => {
      expect(debeMostrarFab(ruta)).toBe(true);
    });

    it('en Editar (donde elige categoría) y en el formulario de números', () => {
      expect(debeMostrarFab('/editar')).toBe(true);
      expect(debeMostrarFab('/numeros/nuevo')).toBe(true);
    });
  });
});

describe('destinoDelFab — qué hace el «+» en cada sitio', () => {
  it('colgadero abre su formulario', () => {
    expect(destinoDelFab('colgadero', '/colgadero')).toEqual({ tipo: 'ruta', ruta: '/crear/colgadero' });
  });

  it('números abre su pantalla con vista previa', () => {
    expect(destinoDelFab('numero', '/numeros')).toEqual({ tipo: 'ruta', ruta: '/numeros/nuevo' });
  });

  it('dentro de una lista añade un objeto A ESA lista', () => {
    expect(destinoDelFab('lista_item', '/listas/abc-12')).toEqual({
      tipo: 'ruta',
      ruta: '/crear/lista_item?listaId=abc-12',
    });
  });

  it('en la pantalla de Listas crea una lista nueva (no un objeto sin lista)', () => {
    expect(destinoDelFab('lista_item', '/listas')).toEqual({ tipo: 'nueva-lista' });
  });

  it('desde fuera de Listas (el menú de Editar) también crea una lista nueva', () => {
    expect(destinoDelFab('lista_item', '/editar')).toEqual({ tipo: 'nueva-lista' });
    expect(destinoDelFab('lista_item', undefined)).toEqual({ tipo: 'nueva-lista' });
  });

  it('naipes no tiene destino: no se crean', () => {
    expect(destinoDelFab('naipe', '/naipes')).toBeNull();
  });

  it('el menú de categorías no ofrece naipes', () => {
    expect(CATEGORIAS_CREABLES).toEqual(['colgadero', 'lista_item', 'numero']);
  });
});
