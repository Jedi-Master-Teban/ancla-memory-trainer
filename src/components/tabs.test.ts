import { TABS, type TabId } from './tabs';

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
