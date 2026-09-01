import type { TokensColor } from '../../tema/colores';

/**
 * Calcula el color del marco de la racha según días consecutivos.
 * Escala inspirada en Duolingo (gris→amarillo→naranja→rojo→oro) y la
 * investigación de Octalysis "Meaningful Tiers" — cada umbral es un
 * achievement tangible que el usuario no quiere perder (loss aversion).
 *
 * - 0 días     → gris muted
 * - 1-6 días   → amarillo suave (warmth)
 * - 7-29 días  → naranja (hábito formándose)
 * - 30-99 días → rojo brillante (commitment)
 * - 100-364 d  → rojo con halo (mastery)
 * - 365+ días  → dorado (legend)
 *
 * Devuelve { fondo, borde, halo } — todos válidos para usar en estilos.
 */
export interface ColorRacha {
  fondo: string;
  borde: string;
  halo: string;
}

export function colorRachaPorDias(dias: number, tokens: TokensColor): ColorRacha {
  if (dias >= 365) {
    return { fondo: '#FFD70022', borde: '#FFD700', halo: '#FFD70088' };
  }
  if (dias >= 100) {
    return { fondo: '#FF450022', borde: '#FF4500', halo: '#FF450088' };
  }
  if (dias >= 30) {
    return { fondo: '#EF444422', borde: '#EF4444', halo: '#EF444488' };
  }
  if (dias >= 7) {
    // Naranja — usamos el accent del tema (consistencia visual)
    return {
      fondo: `${tokens.accent1}22`,
      borde: tokens.accent1,
      halo: `${tokens.accent1}88`,
    };
  }
  if (dias >= 1) {
    return {
      fondo: '#F59E0B22',
      borde: '#F59E0B',
      halo: '#F59E0B66',
    };
  }
  // 0 días — gris muted, sin urgencia
  return {
    fondo: 'transparent',
    borde: tokens.inkMuted,
    halo: 'transparent',
  };
}

/**
 * Etiqueta del siguiente umbral para mostrar al usuario como meta motivadora.
 * Devuelve null si ya está en el nivel máximo (365+).
 */
export function siguienteUmbral(dias: number): { dias: number; etiqueta: string } | null {
  if (dias < 7) return { dias: 7, etiqueta: 'Una semana' };
  if (dias < 30) return { dias: 30, etiqueta: 'Un mes' };
  if (dias < 100) return { dias: 100, etiqueta: '100 días (mastery)' };
  if (dias < 365) return { dias: 365, etiqueta: 'Un año (legend)' };
  return null;
}
