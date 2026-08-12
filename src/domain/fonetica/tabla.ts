/**
 * Alfabeto fonético canónico (§7.2 del brief). Fuente de verdad:
 * agent_docs/decodificacion-fonetica.md — no duplicar la regla en otro sitio.
 */
export interface EntradaTablaFonetica {
  digito: number;
  sonidos: string;
  regla: string;
}

export const TABLA_FONETICA: EntradaTablaFonetica[] = [
  { digito: 1, sonidos: 'T, D', regla: 'La T tiene un palo vertical' },
  { digito: 2, sonidos: 'N, Ñ', regla: 'La N tiene dos palos' },
  { digito: 3, sonidos: 'M', regla: 'La M tiene tres palos' },
  { digito: 4, sonidos: 'C(ca,co,cu), K, Q', regla: 'C es inicial de "cuatro"' },
  { digito: 5, sonidos: 'L, LL', regla: 'L es cifra romana de 50' },
  { digito: 6, sonidos: 'S, Z, C(ce,ci)', regla: 'S es inicial y final de "seis"' },
  { digito: 7, sonidos: 'F, J, G(ge,gi)', regla: 'F invertida se parece a un 7' },
  { digito: 8, sonidos: 'Ch, G(ga,go,gu)', regla: 'Ch tiene la forma cerrada del 8' },
  { digito: 9, sonidos: 'V, B, P', regla: 'P invertida se parece a un 9' },
  { digito: 0, sonidos: 'R, RR', regla: 'El cero es redondo como una rueda' },
];
