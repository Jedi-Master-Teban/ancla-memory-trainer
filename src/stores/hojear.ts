import { create } from 'zustand';
import type { Categoria } from '../db/tipos';

/**
 * Posición de hojeo por categoría — es lo que alimenta la fila «Continuar»
 * del panel de entrada y el `initialScrollIndex` del carrusel.
 *
 * Vive en memoria a propósito: no hay migración de BD en este cambio. Si
 * quieres que sobreviva a cerrar la app, añade una columna a `preferencias`
 * (ver INSTALAR.md §Hojear, punto 4) y persiste `posiciones` ahí — la firma
 * del store no cambia.
 */
interface EstadoHojear {
  posiciones: Partial<Record<Categoria, number>>;
  setPosicion: (categoria: Categoria, indice: number) => void;
  limpiar: (categoria: Categoria) => void;
}

export const useHojearStore = create<EstadoHojear>((set) => ({
  posiciones: {},
  setPosicion: (categoria, indice) =>
    set((estado) => ({ posiciones: { ...estado.posiciones, [categoria]: indice } })),
  limpiar: (categoria) =>
    set((estado) => {
      const siguiente = { ...estado.posiciones };
      delete siguiente[categoria];
      return { posiciones: siguiente };
    }),
}));
