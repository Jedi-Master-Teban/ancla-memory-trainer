import { create } from 'zustand';

/**
 * Estado global de UI overlay. Usado para ocultar el TabBar en pantallas
 * de drill-down (repasar flashcards, crear, editar en profundidad) donde
 * la tab bar global no aporta y estorba el foco.
 */
interface UIState {
  tabBarOculta: boolean;
  ocultarTabBar: () => void;
  mostrarTabBar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  tabBarOculta: false,
  ocultarTabBar: () => set({ tabBarOculta: true }),
  mostrarTabBar: () => set({ tabBarOculta: false }),
}));
