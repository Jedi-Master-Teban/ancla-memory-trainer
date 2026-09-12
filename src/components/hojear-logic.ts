import type { Categoria, FilaTarjeta, MetadataColgadero, MetadataNaipe } from '../db/tipos';
import { inicialDePalo, simboloDePalo, sonidosDeValor, type Carta, type Palo, type Valor } from '../domain/fonetica/naipes';

/**
 * Lógica pura del modo Hojear (DESIGN.md §9). Igual que `fab-logic.ts` y
 * `radar-logic.ts`: aquí no entra React ni expo-*, y todo lo que decide un
 * orden o un texto vive aquí para poder testearlo.
 *
 * Hojear NO califica, NO abre sesión y NO toca FSRS. Solo lee el mazo y lo
 * presenta en su orden natural — el único orden que el operador pidió.
 */

/** Orden del riel de Naipes: A♦ → K♣ (mockup 2a). */
export const ORDEN_PALOS: Palo[] = ['diamantes', 'corazones', 'espadas', 'palos'];
export const ORDEN_VALORES: Valor[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function cartaDeTarjeta(tarjeta: FilaTarjeta): Carta | null {
  if (tarjeta.categoria !== 'naipe') return null;
  try {
    const { palo, valor } = JSON.parse(tarjeta.metadata_categoria) as MetadataNaipe;
    return palo && valor ? { palo, valor } : null;
  } catch {
    return null;
  }
}

export function numeroDeColgadero(tarjeta: FilaTarjeta): number | null {
  if (tarjeta.categoria !== 'colgadero') return null;
  try {
    const { numero } = JSON.parse(tarjeta.metadata_categoria) as MetadataColgadero;
    return Number.isFinite(numero) ? numero : null;
  } catch {
    return null;
  }
}

/**
 * Orden natural por categoría:
 * - colgadero → por número (1…100), leído de metadata, no del texto del frente.
 * - naipe → por palo (♦ ♥ ♠ ♣) y dentro del palo por valor (A…K).
 * - numero / lista_item → por antigüedad (`creada_en`), que es el orden en que
 *   el usuario los fue metiendo; es lo más parecido a "natural" que tienen.
 *
 * Nunca filtra: hojear muestra el mazo completo, incluidas las tarjetas sin
 * reverso asignado — ver `restriccionDeNaipe`.
 */
export function ordenarParaHojear(tarjetas: FilaTarjeta[], categoria: Categoria): FilaTarjeta[] {
  const copia = [...tarjetas];
  if (categoria === 'colgadero') {
    return copia.sort((a, b) => (numeroDeColgadero(a) ?? 0) - (numeroDeColgadero(b) ?? 0));
  }
  if (categoria === 'naipe') {
    return copia.sort((a, b) => {
      const ca = cartaDeTarjeta(a);
      const cb = cartaDeTarjeta(b);
      if (!ca || !cb) return 0;
      const dp = ORDEN_PALOS.indexOf(ca.palo) - ORDEN_PALOS.indexOf(cb.palo);
      return dp !== 0 ? dp : ORDEN_VALORES.indexOf(ca.valor) - ORDEN_VALORES.indexOf(cb.valor);
    });
  }
  return copia.sort((a, b) => a.creada_en.localeCompare(b.creada_en));
}

/** Etiquetas de los dos extremos del riel inferior ("1" … "100", "A♦" … "K♣"). */
export function extremosDeRiel(tarjetas: FilaTarjeta[], categoria: Categoria): { inicio: string; fin: string } {
  if (tarjetas.length === 0) return { inicio: '', fin: '' };
  const primera = tarjetas[0];
  const ultima = tarjetas[tarjetas.length - 1];
  if (categoria === 'colgadero') {
    return { inicio: String(numeroDeColgadero(primera) ?? 1), fin: String(numeroDeColgadero(ultima) ?? tarjetas.length) };
  }
  if (categoria === 'naipe') {
    const ca = cartaDeTarjeta(primera);
    const cb = cartaDeTarjeta(ultima);
    return {
      inicio: ca ? `${ca.valor}${simboloDePalo(ca.palo)}` : '',
      fin: cb ? `${cb.valor}${simboloDePalo(cb.palo)}` : '',
    };
  }
  return { inicio: '1', fin: String(tarjetas.length) };
}

/**
 * Texto de la restricción fonética de una carta sin palabra asignada:
 * «D… + sonido Ch/G». Las figuras no tienen restricción de sonido final
 * (ADR-017), así que solo se les pide la inicial del palo.
 */
export function restriccionDeNaipe(carta: Carta): string {
  const inicial = inicialDePalo(carta.palo).toUpperCase();
  const sonidos = sonidosDeValor(carta.valor);
  if (!sonidos || sonidos.length === 0) return `${inicial}… (figura, sin restricción de sonido)`;
  // Se muestran capitalizados porque es texto de cara al usuario, no datos.
  const enMayuscula = sonidos.map((x) => x.charAt(0).toUpperCase() + x.slice(1));
  return `${inicial}… + sonido ${enMayuscula.join('/')}`;
}

/** Progreso 0–1 del riel. Posición, no porcentaje de dominio. */
export function progresoDeRiel(indice: number, total: number): number {
  if (total <= 1) return total === 1 ? 1 : 0;
  return (indice + 1) / total;
}

/** Primer índice de cada palo, para que la fila de palos salte con scrollToIndex. */
export function indicesDePalo(tarjetas: FilaTarjeta[]): Record<Palo, number> {
  const mapa = { diamantes: -1, corazones: -1, espadas: -1, palos: -1 } as Record<Palo, number>;
  tarjetas.forEach((t, i) => {
    const carta = cartaDeTarjeta(t);
    if (carta && mapa[carta.palo] === -1) mapa[carta.palo] = i;
  });
  return mapa;
}

/** Índice desde el que arrancar: la posición guardada, saneada contra el total actual. */
export function indiceInicial(guardado: number | undefined, total: number): number {
  if (!guardado || guardado < 0 || guardado >= total) return 0;
  return guardado;
}
