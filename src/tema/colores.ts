import type { ViewStyle } from 'react-native';

/**
 * Tokens de color de las 2 direcciones visuales (Fase 8, ADR-026). Valores
 * convertidos a mano de oklch→hex desde agent_docs/prototipos/pantallas/*.html
 * (RN 0.81.5 no soporta oklch() — ver ADR-026), renderizando cada color en un
 * navegador real y leyendo el resultado, nunca calculado de memoria.
 */

export type TemaId = 'arcade' | 'papel';

export interface TokensColor {
  bg: string;
  card: string;
  ink: string;
  inkMuted: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  inkOnAccent: string;
  otraVez: string;
  dificil: string;
  bien: string;
  facil: string;
  flameOuterStart: string;
  flameOuterEnd: string;
  flameInner: string;
  flameGlow: string;
  celdaEscala: [string, string, string, string];
  /** Solo Papel — Arcade distingue con sombra, no con borde. */
  borderMuted?: string;
  /** Solo Arcade — hairline luminoso para cards translúcidas (V2). */
  borderHairline?: string;
}

const ARCADE: TokensColor = {
  bg: '#141433',
  card: 'rgba(255,255,255,0.045)',
  ink: '#f8f8fc',
  inkMuted: '#a0a3b8',
  accent1: '#00d0ec',
  accent2: '#f85ab1',
  accent3: '#7ae163',
  accent4: '#f0bb3b',
  inkOnAccent: '#090917',
  otraVez: '#f75d59',
  dificil: '#f2943c',
  bien: '#7ae163',
  facil: '#00d0ec',
  flameOuterStart: '#ffc31a',
  flameOuterEnd: '#f9601f',
  flameInner: '#ffe46e',
  flameGlow: '#ff821d',
  celdaEscala: ['#25273c', '#25467d', '#007fbc', '#00d0ec'],
  /** Solo Arcade — border hairline luminoso para cards translúcidas. */
  borderHairline: 'rgba(255,255,255,0.07)',
};

const PAPEL: TokensColor = {
  bg: '#1f160f',
  card: '#2d2118',
  ink: '#efe6dd',
  inkMuted: '#a89c92',
  accent1: '#cd6e4c',
  accent2: '#884b35',
  accent3: '#749065',
  accent4: '#749065',
  inkOnAccent: '#1f160f',
  otraVez: '#b14f42',
  dificil: '#a67537',
  bien: '#749065',
  facil: '#4b788e',
  flameOuterStart: '#cd6e4c',
  flameOuterEnd: '#cd6e4c',
  flameInner: '#884b35',
  flameGlow: '',
  celdaEscala: ['#362c24', '#5d402d', '#93573b', '#cd6e4c'],
  borderMuted: '#42352b',
};

const PALETAS: Record<TemaId, TokensColor> = { arcade: ARCADE, papel: PAPEL };

export function coloresDelTema(tema: TemaId): TokensColor {
  return PALETAS[tema];
}

export interface RecetaBoton {
  contenedor: {
    borderRadius: number;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
  };
  texto: { color: string };
}

/**
 * Arcade: píldora rellena + sombra dura tipo "3D" (box-shadow 0 5px 0 en el
 * mockup — se aproxima con shadowRadius:0). Papel: plano, borde fino, sin
 * relleno ni sombra. Es una receta de forma, no solo de color — verificado
 * en agent_docs/prototipos/pantallas/naipes.html (calcularTokens bifurca en
 * esArcade para radio/relleno-vs-borde/sombra).
 */
export function recetaBotonCalificacion(tema: TemaId, colorAcento: string): RecetaBoton {
  const t = coloresDelTema(tema);
  if (tema === 'arcade') {
    return {
      contenedor: {
        borderRadius: 16,
        backgroundColor: colorAcento,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 0,
      },
      texto: { color: t.inkOnAccent },
    };
  }
  return {
    contenedor: { borderRadius: 2, borderWidth: 1.5, borderColor: colorAcento, backgroundColor: 'transparent' },
    texto: { color: colorAcento },
  };
}

/**
 * V2 — Estilo de card para Arcade Neón: translúcido + borde hairline.
 * No es un hook de React (puro, sin efectos), solo pereza de shape.
 */
export function cardStyle(tema: TemaId): ViewStyle {
  const t = coloresDelTema(tema);
  if (tema === 'arcade') {
    return {
      backgroundColor: 'rgba(255,255,255,0.045)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.07)',
    } as const;
  }
  return {
    backgroundColor: t.card,
    borderWidth: 0,
  } as const;
}

