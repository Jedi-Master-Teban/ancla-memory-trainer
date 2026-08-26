import { barajar } from '../aleatorio';
import type { Carta, Palo, Valor } from '../fonetica/naipes';

const PALOS: Palo[] = ['espadas', 'diamantes', 'palos', 'corazones'];
const VALORES: Valor[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** Las 52 cartas del mazo francés estándar, en orden fijo (palo, luego valor). */
export const LAS_52_CARTAS: Carta[] = PALOS.flatMap((palo) => VALORES.map((valor) => ({ palo, valor })));

export interface ResultadoBaraja {
  correctas: number;
  total: number;
  aciertosPorPosicion: boolean[];
}

/**
 * Genera el orden de presentación de la Baraja Completa
 * (modulos/03-naipes.md §4). Mismo patrón de barajado inyectable que
 * `armarSesion` (ADR-015) — reusa `barajar` desde `domain/aleatorio.ts`.
 */
export function generarOrdenBaraja(cartas: Carta[], aleatorizar: <T>(arr: T[]) => T[] = barajar): Carta[] {
  return aleatorizar(cartas);
}

/**
 * Compara la reproducción del usuario contra el orden mostrado,
 * posición a posición — no por presencia en la lista.
 */
export function compararReproduccion(original: Carta[], reproducida: Carta[]): ResultadoBaraja {
  const aciertosPorPosicion = original.map((carta, i) => {
    const respuesta = reproducida[i];
    return respuesta != null && respuesta.palo === carta.palo && respuesta.valor === carta.valor;
  });

  return {
    correctas: aciertosPorPosicion.filter(Boolean).length,
    total: original.length,
    aciertosPorPosicion,
  };
}
