import { pestanaActiva, TABS, type TabId } from './tabs';

describe('tabs (configuración pura)', () => {
  it('define exactamente 4 tabs globales', () => {
    expect(TABS).toHaveLength(4);
  });

  it('las tabs son: inicio, editar, stats, ajustes (en orden)', () => {
    const ids = TABS.map((t) => t.id);
    expect(ids).toEqual<TabId[]>(['inicio', 'editar', 'stats', 'ajustes']);
  });

  it('cada tab tiene id, etiqueta e icono no vacíos', () => {
    TABS.forEach((tab) => {
      expect(tab.id).toBeTruthy();
      expect(tab.etiqueta.length).toBeGreaterThan(0);
      expect(tab.icono.length).toBeGreaterThan(0);
    });
  });
});

describe('pestanaActiva — la Guía cuelga de Inicio', () => {
  it('la Guía y cualquiera de sus capítulos encienden Inicio', () => {
    expect(pestanaActiva('/guia')).toBe('inicio');
    expect(pestanaActiva('/guia/colgadero')).toBe('inicio');
  });

  it('una ruta que solo empieza igual no se confunde con la Guía', () => {
    expect(pestanaActiva('/guiado')).toBeNull();
  });
});

