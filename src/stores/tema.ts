import { create } from 'zustand';
import type { FilaPreferencias } from '../db/tipos';
import { coloresDelTema } from '../tema/colores';
import { tipografiaDelTema } from '../tema/tipografia';

interface EstadoTemaStore {
  preferencias: FilaPreferencias | null;
  establecer: (preferencias: FilaPreferencias) => void;
}

/**
 * Cache delgada, mismo patrón que stores/racha.ts — sin lógica async aquí.
 * A diferencia de racha/sesión, `app/_layout.tsx` es quien hace fetch UNA
 * SOLA VEZ al arrancar (el layout monta una sola vez en la vida de la app;
 * no aplica `useFocusEffect`) y siembra el store para toda la sesión;
 * `app/ajustes.tsx` es la única otra pantalla que vuelve a consultar, en
 * cada tap. El tema es global y cambia poco, a diferencia de racha/sesión.
 */
export const useTemaStore = create<EstadoTemaStore>()((set) => ({
  preferencias: null,
  establecer: (preferencias) => set({ preferencias }),
}));

/** Fallback 'arcade' antes de la primera carga — mismo criterio que `config?.meta_diaria ?? 20` en app/index.tsx. */
export function useTema() {
  const tema = useTemaStore((s) => s.preferencias?.tema ?? 'arcade');
  const preferenciaTipografia = useTemaStore((s) => s.preferencias?.tipografia ?? 'tematica');
  return {
    tema,
    colores: coloresDelTema(tema),
    tipografia: tipografiaDelTema(tema, preferenciaTipografia),
    preferenciaTipografia,
  };
}
