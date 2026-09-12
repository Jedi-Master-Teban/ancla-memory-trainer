import type { ViewStyle } from 'react-native';

/**
 * Tokens de color de las 3 direcciones visuales (Fase 8, ADR-026). Valores
 * convertidos a mano de oklch→hex desde agent_docs/prototipos/pantallas/*.html
 * (RN 0.81.5 no soporta oklch() — ver ADR-026), renderizando cada color en un
 * navegador real y leyendo el resultado, nunca calculado de memoria.
 *
 * Fase 8 v2 (DESIGN.md §1): 8 tokens nuevos por tema. La regla que sostiene
 * todo el rediseño es que ninguna pantalla inventa un color: si un valor no
 * está aquí, es un bug del token, no una excepción de la pantalla.
 */

export type TemaId = 'arcade' | 'soft' | 'papel';

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

  // ── Fase 8 v2 ────────────────────────────────────────────────────────────
  /** Superficies "hundidas": segmentado, stepper, botón fantasma. */
  cardAlt: string;
  /** Riel de barras de progreso. También es la celda 0 del heatmap. */
  track: string;
  /** Relleno de la pastilla de la pestaña activa en la isla. */
  pill: string;
  /** Tinte de la isla de navegación, por debajo del BlurView. */
  glass: string;
  /** Hairline superior de la isla — es lo que la hace ver de vidrio. */
  glassBorder: string;
  /** Color del halo de sombra del CTA principal. */
  ctaGlow: string;
  /** Fondo suave de la píldora de racha y del halo de la llama. */
  flameSoft: string;
  /** Fondo suave para insignias de retención en verde. */
  bienSoft: string;
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
  borderHairline: 'rgba(255,255,255,0.07)',

  cardAlt: 'rgba(255,255,255,0.07)',
  track: 'rgba(255,255,255,0.10)',
  pill: 'rgba(0,208,236,0.16)',
  glass: 'rgba(28,29,62,0.72)',
  glassBorder: 'rgba(255,255,255,0.10)',
  ctaGlow: 'rgba(0,208,236,0.55)',
  flameSoft: 'rgba(255,130,29,0.20)',
  bienSoft: 'rgba(122,225,99,0.16)',
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

  cardAlt: 'rgba(255,255,255,0.04)',
  track: '#362c24',
  pill: 'rgba(205,110,76,0.16)',
  glass: 'rgba(45,33,24,0.86)',
  glassBorder: '#42352b',
  ctaGlow: 'rgba(205,110,76,0.40)',
  flameSoft: 'rgba(205,110,76,0.16)',
  bienSoft: 'rgba(116,144,101,0.18)',
};

const SOFT: TokensColor = {
  // Warm cream + neumorphic soft shadows. Paleta validada en
  // agent_docs/prototipos/investigacion/v2/prototipo-soft-ui.html
  bg: '#F0EEE9',
  card: '#FAF9F7',
  ink: '#2D2A26',
  inkMuted: '#7A756C',
  accent1: '#FF6B35',
  accent2: '#FFB399',
  accent3: '#10B981',
  accent4: '#FF9F0A',
  inkOnAccent: '#FFFFFF',
  otraVez: '#DC2626',
  dificil: '#F59E0B',
  bien: '#10B981',
  facil: '#3B82F6',
  flameOuterStart: '#FFB84D',
  flameOuterEnd: '#FF6B35',
  flameInner: '#FFD66E',
  flameGlow: '#FF6B35',
  celdaEscala: ['#E8E5DF', '#F5C9A8', '#FFB399', '#FF6B35'],
  borderMuted: '#E8E5DF',

  cardAlt: 'rgba(45,42,38,0.035)',
  track: '#E8E5DF',
  pill: 'rgba(255,107,53,0.13)',
  glass: 'rgba(250,249,247,0.66)',
  glassBorder: 'rgba(255,255,255,0.70)',
  ctaGlow: 'rgba(255,107,53,0.75)',
  flameSoft: 'rgba(255,107,53,0.13)',
  bienSoft: 'rgba(16,185,129,0.13)',
};

const PALETAS: Record<TemaId, TokensColor> = { arcade: ARCADE, soft: SOFT, papel: PAPEL };

export function coloresDelTema(tema: TemaId): TokensColor {
  return PALETAS[tema];
}

/** Los dos temas oscuros. Lo usa BlurView para elegir su `tint`. */
export function esTemaOscuro(tema: TemaId): boolean {
  return tema === 'arcade' || tema === 'papel';
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
  if (tema === 'soft') {
    return {
      contenedor: {
        borderRadius: 18,
        backgroundColor: colorAcento,
        shadowColor: colorAcento,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
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
/**
 * El tipo de retorno se estrecha a las tres propiedades que de verdad devuelve.
 * `ViewStyle` a secas no se puede pasar a un `<Link>` de expo-router (espera
 * `TextStyle`, que EXTIENDE a ViewStyle, así que el supertipo no encaja); estas
 * tres sí son válidas en ambos.
 */
export function cardStyle(tema: TemaId): Pick<ViewStyle, 'backgroundColor' | 'borderWidth' | 'borderColor'> {
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

/**
 * Receta de FORMA por tema (DESIGN.md §2). Hermana de
 * `recetaBotonCalificacion`, pero para radios y sombras genéricos: así una
 * pantalla nueva no tiene que decidir si un radio es 20 o 2 según el tema.
 *
 * Papel y Tinta es plano por definición: radios de 1–2 px y cero sombra.
 * Arcade usa sombra dura (shadowRadius 0) porque su lenguaje es el relieve
 * de arcade, no el desenfoque.
 */
export interface RecetaForma {
  /** Tarjeta grande. */
  rCard: number;
  /** Fila de lista. */
  rRow: number;
  /** Botón. */
  rBtn: number;
  /** Caja de ícono. */
  rIcon: number;
  /** Píldora. */
  rPill: number;
  /** Celda de heatmap. */
  rCell: number;
  /** Radio de la isla de navegación y de la pastilla de su pestaña activa. */
  rIsla: number;
  rIslaPestana: number;
  sombraCard: ViewStyle;
  /** Necesita el acento porque en Soft la sombra del CTA es de su propio color. */
  sombraCta: (t: TokensColor) => ViewStyle;
}

const FORMA: Record<TemaId, RecetaForma> = {
  soft: {
    rCard: 20,
    rRow: 16,
    rBtn: 18,
    rIcon: 12,
    rPill: 999,
    rCell: 4,
    rIsla: 26,
    rIslaPestana: 15,
    sombraCard: {
      shadowColor: '#2D2A26',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.07,
      shadowRadius: 26,
      elevation: 3,
    },
    sombraCta: (t) => ({
      shadowColor: t.accent1,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 18,
      elevation: 6,
    }),
  },
  arcade: {
    rCard: 24,
    rRow: 18,
    rBtn: 16,
    rIcon: 12,
    rPill: 999,
    rCell: 4,
    rIsla: 24,
    rIslaPestana: 19,
    sombraCard: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 20,
      elevation: 4,
    },
    // Sombra dura "3D" del mockup Arcade.
    sombraCta: () => ({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.35,
      shadowRadius: 0,
      elevation: 0,
    }),
  },
  papel: {
    rCard: 2,
    rRow: 2,
    rBtn: 2,
    rIcon: 2,
    rPill: 2,
    rCell: 1,
    rIsla: 2,
    rIslaPestana: 2,
    sombraCard: {},
    sombraCta: () => ({}),
  },
};

export function recetaForma(tema: TemaId): RecetaForma {
  return FORMA[tema];
}
