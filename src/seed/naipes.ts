import type { Palo, Valor } from '../domain/fonetica/naipes';

/**
 * Las 52 palabras colgadero de naipes. Dato del operador — el agente no
 * inventa ninguna (§4.1 del brief, agent_docs/seeds/naipes-52.md §5).
 *
 * `palabra: ''` significa "todavía sin asignar". Una carta sin palabra se
 * siembra igual (contenido_reverso vacío) pero queda excluida de las
 * sesiones de repaso hasta que se llene — mismo tratamiento que cualquier
 * ítem sin completar (seeds/naipes-52.md §5).
 *
 * Reglas (agent_docs/seeds/naipes-52.md):
 * - Numéricas (A–10): empieza con la letra del palo, termina con el sonido
 *   consonante del valor (tabla en decodificacion-fonetica.md).
 * - Figuras (J, Q, K): solo empieza con la letra del palo — sin restricción
 *   de sonido final (ADR-017).
 * - Palos: Espadas=E, Diamantes=D, Palos=P, Corazones=C.
 * - Corazones no puede empezar con "ch" (ambiguo con el marcador — §3).
 */
export interface NaipeSemilla {
  palo: Palo;
  valor: Valor;
  palabra: string;
}

export const NAIPES_52: NaipeSemilla[] = [
  // Espadas (E)
  { palo: 'espadas', valor: 'A', palabra: '' },
  { palo: 'espadas', valor: '2', palabra: '' },
  { palo: 'espadas', valor: '3', palabra: '' },
  { palo: 'espadas', valor: '4', palabra: '' },
  { palo: 'espadas', valor: '5', palabra: '' },
  { palo: 'espadas', valor: '6', palabra: '' },
  { palo: 'espadas', valor: '7', palabra: '' },
  { palo: 'espadas', valor: '8', palabra: '' },
  { palo: 'espadas', valor: '9', palabra: '' },
  { palo: 'espadas', valor: '10', palabra: '' },
  { palo: 'espadas', valor: 'J', palabra: '' },
  { palo: 'espadas', valor: 'Q', palabra: '' },
  { palo: 'espadas', valor: 'K', palabra: '' },

  // Diamantes (D)
  { palo: 'diamantes', valor: 'A', palabra: '' },
  { palo: 'diamantes', valor: '2', palabra: '' },
  { palo: 'diamantes', valor: '3', palabra: '' },
  { palo: 'diamantes', valor: '4', palabra: '' },
  { palo: 'diamantes', valor: '5', palabra: '' },
  { palo: 'diamantes', valor: '6', palabra: '' },
  { palo: 'diamantes', valor: '7', palabra: '' },
  { palo: 'diamantes', valor: '8', palabra: '' },
  { palo: 'diamantes', valor: '9', palabra: '' },
  { palo: 'diamantes', valor: '10', palabra: '' },
  { palo: 'diamantes', valor: 'J', palabra: '' },
  { palo: 'diamantes', valor: 'Q', palabra: '' },
  { palo: 'diamantes', valor: 'K', palabra: '' },

  // Palos / Tréboles (P)
  { palo: 'palos', valor: 'A', palabra: '' },
  { palo: 'palos', valor: '2', palabra: '' },
  { palo: 'palos', valor: '3', palabra: '' },
  { palo: 'palos', valor: '4', palabra: '' },
  { palo: 'palos', valor: '5', palabra: '' },
  { palo: 'palos', valor: '6', palabra: '' },
  { palo: 'palos', valor: '7', palabra: '' },
  { palo: 'palos', valor: '8', palabra: '' },
  { palo: 'palos', valor: '9', palabra: '' },
  { palo: 'palos', valor: '10', palabra: '' },
  { palo: 'palos', valor: 'J', palabra: '' },
  { palo: 'palos', valor: 'Q', palabra: '' },
  { palo: 'palos', valor: 'K', palabra: '' },

  // Corazones (C)
  { palo: 'corazones', valor: 'A', palabra: '' },
  { palo: 'corazones', valor: '2', palabra: '' },
  { palo: 'corazones', valor: '3', palabra: '' },
  { palo: 'corazones', valor: '4', palabra: '' },
  { palo: 'corazones', valor: '5', palabra: '' },
  { palo: 'corazones', valor: '6', palabra: '' },
  { palo: 'corazones', valor: '7', palabra: '' },
  { palo: 'corazones', valor: '8', palabra: '' },
  { palo: 'corazones', valor: '9', palabra: '' },
  { palo: 'corazones', valor: '10', palabra: '' },
  { palo: 'corazones', valor: 'J', palabra: '' },
  { palo: 'corazones', valor: 'Q', palabra: '' },
  { palo: 'corazones', valor: 'K', palabra: '' },
];
