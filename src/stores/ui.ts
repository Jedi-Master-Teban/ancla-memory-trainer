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
  /**
   * El «+» pide una lista nueva: la pantalla de Listas enfoca el campo del
   * nombre cuando existe y consume la petición. Es una petición pendiente (y
   * no un evento) porque desde otra pantalla el «+» navega a Listas, que aún
   * no está montada cuando se pide.
   */
  nuevaListaPendiente: boolean;
  pedirNuevaLista: () => void;
  consumirNuevaLista: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  tabBarOculta: false,
  ocultarTabBar: () => set({ tabBarOculta: true }),
  mostrarTabBar: () => set({ tabBarOculta: false }),
  nuevaListaPendiente: false,
  pedirNuevaLista: () => set({ nuevaListaPendiente: true }),
  consumirNuevaLista: () => set({ nuevaListaPendiente: false }),
}));
