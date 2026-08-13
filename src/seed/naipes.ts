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
  { palo: 'espadas', valor: 'A', palabra: 'Éxodo' },
  { palo: 'espadas', valor: '2', palabra: 'Espina' },
  { palo: 'espadas', valor: '3', palabra: 'Espuma' },
  { palo: 'espadas', valor: '4', palabra: 'Estoque' },
  { palo: 'espadas', valor: '5', palabra: 'Estilo' },
  { palo: 'espadas', valor: '6', palabra: 'Esposa' },
  { palo: 'espadas', valor: '7', palabra: 'Eje' },
  { palo: 'espadas', valor: '8', palabra: 'Estuche' },
  { palo: 'espadas', valor: '9', palabra: 'Estepa' },
  { palo: 'espadas', valor: '10', palabra: 'Estera' },
  { palo: 'espadas', valor: 'J', palabra: 'Espada' },
  { palo: 'espadas', valor: 'Q', palabra: 'Embutido' },
  { palo: 'espadas', valor: 'K', palabra: 'Edén' },

  // Diamantes (D)
  { palo: 'diamantes', valor: 'A', palabra: 'Dedo' },
  { palo: 'diamantes', valor: '2', palabra: 'Duna' },
  { palo: 'diamantes', valor: '3', palabra: 'Dama' },
  { palo: 'diamantes', valor: '4', palabra: 'Dique' },
  { palo: 'diamantes', valor: '5', palabra: 'Dalia' },
  { palo: 'diamantes', valor: '6', palabra: 'Dulce' },
  { palo: 'diamantes', valor: '7', palabra: 'Desafío' },
  { palo: 'diamantes', valor: '8', palabra: 'Ducha' },
  { palo: 'diamantes', valor: '9', palabra: 'Diva' },
  { palo: 'diamantes', valor: '10', palabra: 'Dinero' },
  { palo: 'diamantes', valor: 'J', palabra: 'Diamante' },
  { palo: 'diamantes', valor: 'Q', palabra: 'Dentada' },
  { palo: 'diamantes', valor: 'K', palabra: 'Destino' },

  // Palos / Tréboles (P)
  { palo: 'palos', valor: 'A', palabra: 'Pata' },
  { palo: 'palos', valor: '2', palabra: 'Pan' },
  { palo: 'palos', valor: '3', palabra: 'Puma' },
  { palo: 'palos', valor: '4', palabra: 'Pico' },
  { palo: 'palos', valor: '5', palabra: 'Pollo' },
  { palo: 'palos', valor: '6', palabra: 'Pozo' },
  { palo: 'palos', valor: '7', palabra: 'Piojo' },
  { palo: 'palos', valor: '8', palabra: 'Pinocho' },
  { palo: 'palos', valor: '9', palabra: 'Pavo' },
  { palo: 'palos', valor: '10', palabra: 'Perro' },
  { palo: 'palos', valor: 'J', palabra: 'Palo' },
  { palo: 'palos', valor: 'Q', palabra: 'Patata' },
  { palo: 'palos', valor: 'K', palabra: 'Platino' },

  // Corazones (C)
  { palo: 'corazones', valor: 'A', palabra: 'Cota' },
  { palo: 'corazones', valor: '2', palabra: 'Cono' },
  { palo: 'corazones', valor: '3', palabra: 'Clima' },
  { palo: 'corazones', valor: '4', palabra: 'Cucú' },
  { palo: 'corazones', valor: '5', palabra: 'Culo' },
  { palo: 'corazones', valor: '6', palabra: 'Casa' },
  { palo: 'corazones', valor: '7', palabra: 'Cofia' },
  { palo: 'corazones', valor: '8', palabra: 'Cosecha' },
  { palo: 'corazones', valor: '9', palabra: 'Cuba' },
  { palo: 'corazones', valor: '10', palabra: 'Carro' },
  { palo: 'corazones', valor: 'J', palabra: 'Corazón' },
  { palo: 'corazones', valor: 'Q', palabra: 'Cadete' },
  { palo: 'corazones', valor: 'K', palabra: 'Cadena' },
];
