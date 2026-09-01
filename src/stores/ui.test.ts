import { useUIStore } from './ui';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ tabBarOculta: false });
  });

  it('empieza con tabBarOculta=false', () => {
    expect(useUIStore.getState().tabBarOculta).toBe(false);
  });

  it('ocultarTabBar() lo pone en true', () => {
    useUIStore.getState().ocultarTabBar();
    expect(useUIStore.getState().tabBarOculta).toBe(true);
  });

  it('mostrarTabBar() lo devuelve a false', () => {
    useUIStore.getState().ocultarTabBar();
    useUIStore.getState().mostrarTabBar();
    expect(useUIStore.getState().tabBarOculta).toBe(false);
  });
});
