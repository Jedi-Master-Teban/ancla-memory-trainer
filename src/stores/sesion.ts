import { create } from 'zustand';
import type { Calificacion } from '../domain/fsrs/scheduler';
import type { FilaTarjeta } from '../db/tipos';

interface EstadoSesion {
  tarjetas: FilaTarjeta[];
  sesionId: string | null;
  indice: number;
  revelada: boolean;
  aciertos: number;
  fallos: number;

  iniciar: (tarjetas: FilaTarjeta[], sesionId: string) => void;
  revelar: () => void;
  avanzar: (calificacion: Calificacion) => void;
  reiniciar: () => void;
}

/**
 * Estado de la sesión de práctica EN CURSO (UI únicamente). No persiste nada:
 * la pantalla llama a `calificarTarjeta` del repositorio para persistir, y
 * luego a `avanzar()` aquí para mover el índice y la racha de la sesión.
 */
export const useSesionStore = create<EstadoSesion>()((set) => ({
  tarjetas: [],
  sesionId: null,
  indice: 0,
  revelada: false,
  aciertos: 0,
  fallos: 0,

  iniciar: (tarjetas, sesionId) =>
    set({ tarjetas, sesionId, indice: 0, revelada: false, aciertos: 0, fallos: 0 }),

  revelar: () => set({ revelada: true }),

  avanzar: (calificacion) => {
    const acierto = calificacion !== 'otra_vez';
    set((estado) => ({
      indice: estado.indice + 1,
      revelada: false,
      aciertos: estado.aciertos + (acierto ? 1 : 0),
      fallos: estado.fallos + (acierto ? 0 : 1),
    }));
  },

  reiniciar: () => set({ tarjetas: [], sesionId: null, indice: 0, revelada: false, aciertos: 0, fallos: 0 }),
}));
