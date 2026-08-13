import { create } from 'zustand';
import type { FilaDiaPractica, FilaRachaConfig } from '../db/tipos';
import type { ResultadoRacha } from '../domain/racha/calculo';

interface EstadoRachaStore {
  resultado: ResultadoRacha | null;
  config: FilaRachaConfig | null;
  dias: FilaDiaPractica[];
  establecer: (datos: { resultado: ResultadoRacha; config: FilaRachaConfig; dias: FilaDiaPractica[] }) => void;
}

/**
 * Cache delgada de lo ya consultado — sin lógica async aquí (mismo límite
 * documentado en stores/sesion.ts). Cada pantalla (dashboard, racha.tsx)
 * hace su propia consulta al repositorio y llama `establecer(...)`; el
 * store solo existe para que IndicadorRacha/Heatmap90 lean el mismo dato
 * sin prop-drilling entre las dos pantallas que los usan.
 */
export const useRachaStore = create<EstadoRachaStore>()((set) => ({
  resultado: null,
  config: null,
  dias: [],

  establecer: ({ resultado, config, dias }) => set({ resultado, config, dias }),
}));
