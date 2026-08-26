/**
 * Validador de palabras colgadero para naipes (§7.4 del brief). Mazo francés
 * estándar de 52 cartas, J/Q/K (ADR-016 — no baraja española). Reglas y su
 * razonamiento completo en agent_docs/seeds/naipes-52.md.
 */
import { decodificar, explicar, normalizar } from './decodificador';

export type Palo = 'espadas' | 'diamantes' | 'palos' | 'corazones';
export type Valor = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export interface Carta {
  palo: Palo;
  valor: Valor;
}

export interface ResultadoValidacionNaipe {
  valida: boolean;
  motivo?: string;
  advertencias: string[];
}

const INICIAL_DE_PALO: Record<Palo, string> = {
  espadas: 'e',
  diamantes: 'd',
  palos: 'p',
  corazones: 'c',
};

const DIGITO_DE_VALOR: Partial<Record<Valor, number>> = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 0,
};

const VALOR_DE_DIGITO: Record<number, Valor> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  0: '10',
};

const SONIDOS_DE_DIGITO: Record<number, string[]> = {
  1: ['t', 'd'],
  2: ['n', 'ñ'],
  3: ['m'],
  4: ['c', 'k', 'q'],
  5: ['l', 'll'],
  6: ['s', 'z'],
  7: ['f', 'j'],
  8: ['ch'],
  9: ['v', 'b', 'p'],
  0: ['r', 'rr'],
};

export function inicialDePalo(palo: Palo): string {
  return INICIAL_DE_PALO[palo];
}

const SIMBOLO_DE_PALO: Record<Palo, string> = {
  espadas: '♠',
  diamantes: '♦',
  palos: '♣',
  corazones: '♥',
};

export function simboloDePalo(palo: Palo): string {
  return SIMBOLO_DE_PALO[palo];
}

/** "10♠", "K♥" — formato de visualización, mazo francés estándar (ADR-016). */
export function etiquetaCarta(carta: Carta): string {
  return `${carta.valor}${simboloDePalo(carta.palo)}`;
}

export function esFigura(valor: Valor): boolean {
  return valor === 'J' || valor === 'Q' || valor === 'K';
}

export function sonidosDeValor(valor: Valor): string[] | null {
  if (esFigura(valor)) return null;
  const digito = DIGITO_DE_VALOR[valor] as number;
  return SONIDOS_DE_DIGITO[digito];
}

function paloDeInicial(inicial: string): Palo | null {
  const entrada = (Object.entries(INICIAL_DE_PALO) as [Palo, string][]).find(([, letra]) => letra === inicial);
  return entrada ? entrada[0] : null;
}

export function validarPalabraNaipe(palabra: string, carta: Carta): ResultadoValidacionNaipe {
  const advertencias: string[] = [];

  if (palabra.length === 0) {
    return { valida: false, motivo: 'La palabra no puede estar vacía', advertencias };
  }

  const normalizada = normalizar(palabra);
  const marcador = inicialDePalo(carta.palo);

  if (!normalizada.startsWith(marcador)) {
    return {
      valida: false,
      motivo: `Debe empezar con "${marcador}" (palo ${carta.palo}), pero "${palabra}" empieza con "${normalizada[0]}"`,
      advertencias,
    };
  }

  if (carta.palo === 'corazones' && normalizada.startsWith('ch')) {
    return {
      valida: false,
      motivo:
        'Ambiguo para Corazones: "ch" podría ser el marcador "c" + "h" muda, o el dígrafo de valor 8. Usa una palabra que empiece con "c" + vocal.',
      advertencias,
    };
  }

  if (esFigura(carta.valor)) {
    // Solo Regla 1 — sin restricción de sonido final (ADR-017).
    return { valida: true, advertencias };
  }

  const resto = normalizada.slice(marcador.length);
  if (resto.length === 0) {
    return {
      valida: false,
      motivo: 'No queda nada después de la letra de palo para codificar el valor',
      advertencias,
    };
  }

  let digitosResto: number[];
  try {
    digitosResto = decodificar(resto).digitos;
  } catch (error) {
    return { valida: false, motivo: `No se pudo decodificar "${resto}": ${String(error)}`, advertencias };
  }

  if (digitosResto.length === 0) {
    return {
      valida: false,
      motivo: 'No hay ningún sonido consonante después del marcador de palo',
      advertencias,
    };
  }

  const digitoEsperado = DIGITO_DE_VALOR[carta.valor];
  const ultimoDigito = digitosResto[digitosResto.length - 1];

  if (ultimoDigito !== digitoEsperado) {
    return {
      valida: false,
      motivo: `El último sonido consonante codifica ${ultimoDigito}, se esperaba ${digitoEsperado} (valor ${carta.valor})`,
      advertencias,
    };
  }

  if (digitosResto.length > 1) {
    advertencias.push(
      `Tiene ${digitosResto.length} sonidos consonantes después del marcador; la forma más fácil de decodificar a velocidad es exactamente uno.`
    );
  }

  return { valida: true, advertencias };
}

/**
 * Cadena fonética legible para el reverso de una carta numérica (ej.
 * "d + t(1) → 1" para "Dato" en Diamantes-As), Fase 8 — mismo propósito que
 * `explicar()` ya cumple para Colgadero. Reusa `explicar()` sobre el resto
 * tras el marcador de palo (mismo `slice` que `validarPalabraNaipe` usa en
 * la línea de arriba) — nunca decodifica la palabra completa, el marcador
 * no es parte de la codificación numérica. `null` para figuras: no hay nada
 * que decodificar (ADR-017), igual que `sonidosDeValor`.
 */
export function explicarNaipe(carta: Carta, palabra: string): string | null {
  if (esFigura(carta.valor)) return null;

  const normalizada = normalizar(palabra);
  const marcador = inicialDePalo(carta.palo);
  if (!normalizada.startsWith(marcador)) return null;

  const resto = normalizada.slice(marcador.length);
  if (resto.length === 0) return null;

  return `${marcador} + ${explicar(resto)}`;
}

/**
 * Inversa de `validarPalabraNaipe`. Para cartas numéricas, decodifica
 * foneticamente. Para figuras, no hay nada que decodificar (ADR-017): busca
 * en `palabrasAsignadas` — nunca inventa una carta para una figura.
 *
 * Limitación conocida: si una palabra pensada como figura AÚN NO está en
 * `palabrasAsignadas` y además decodifica foneticamente a un valor numérico
 * válido, se reporta como esa carta numérica. No hay forma de distinguir
 * "pensada como figura" de "coincide con un número" sin la tabla — las
 * figuras no tienen firma fonética propia. Ver naipes.test.ts.
 */
export function cartaDesdePalabra(palabra: string, palabrasAsignadas: Map<string, Carta>): Carta | null {
  const normalizada = normalizar(palabra);

  const asignada = palabrasAsignadas.get(normalizada);
  if (asignada) return asignada;

  const inicial = normalizada[0];
  const palo = paloDeInicial(inicial);
  if (!palo) return null;
  if (palo === 'corazones' && normalizada.startsWith('ch')) return null;

  const resto = normalizada.slice(1);
  if (resto.length === 0) return null;

  let digitos: number[];
  try {
    digitos = decodificar(resto).digitos;
  } catch {
    return null;
  }
  if (digitos.length === 0) return null;

  const ultimoDigito = digitos[digitos.length - 1];
  const valor = VALOR_DE_DIGITO[ultimoDigito];
  if (!valor) return null;

  return { palo, valor };
}
