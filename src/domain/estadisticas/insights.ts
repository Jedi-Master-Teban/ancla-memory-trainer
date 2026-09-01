import type { RetencionPorCategoria } from './retencion-categorias';

/**
 * Insights contextuales rule-based para Ancla. Explicables, testeables,
 * sin ML ni API externa. Cada regla devuelve un mensaje de 1-2 frases
 * con CTA numérica cuando es posible.
 *
 * Investigación:
 * - Stephen Few: insights deben ser ACCIONABLES, no de vanidad.
 * - Duolingo: tono directo, motivador sin condescendencia.
 * - Kahneman & Tversky: preferir mensajes de loss aversion cuando aplica.
 */

export type TipoInsight = 'alerta' | 'positivo' | 'neutral' | 'motivacion';

export interface Insight {
  tipo: TipoInsight;
  titulo: string;
  detalle?: string;
  /** Categoría o dimensión específica a la que aplica (para deep link futuro). */
  contexto?: string;
}

/**
 * Regla 1: Categoría con retención baja (< 60%).
 * Loss aversion: "5 tarjetas bastan" — accionable, no genérico.
 */
export function insightPuntoDebil(retencion: RetencionPorCategoria): Insight | null {
  const UMBRAL = 0.6;
  let peorCat: keyof RetencionPorCategoria | null = null;
  let peorValor = 1;
  for (const [cat, valor] of Object.entries(retencion) as [keyof RetencionPorCategoria, number][]) {
    if (valor < UMBRAL && valor < peorValor) {
      peorValor = valor;
      peorCat = cat;
    }
  }
  if (peorCat === null) return null;
  const etiquetas: Record<keyof RetencionPorCategoria, string> = {
    colgadero: 'Colgadero',
    naipe: 'Naipes',
    lista_item: 'Listas',
    numero: 'Números',
  };
  const tarjetasEstimadas = Math.ceil((UMBRAL - peorValor) * 20);
  return {
    tipo: 'alerta',
    titulo: `${etiquetas[peorCat]} bajó a ${Math.round(peorValor * 100)}%`,
    detalle: `${tarjetasEstimadas} tarjetas bastan para volver al ${Math.round(UMBRAL * 100)}%.`,
    contexto: peorCat,
  };
}

/**
 * Regla 2: Tendencia positiva — XP esta semana vs semana anterior.
 */
export function insightTendenciaPositiva(
  xpSemanaActual: number,
  xpSemanaAnterior: number,
): Insight | null {
  if (xpSemanaAnterior === 0 || xpSemanaActual <= xpSemanaAnterior) return null;
  const pct = Math.round(((xpSemanaActual - xpSemanaAnterior) / xpSemanaAnterior) * 100);
  return {
    tipo: 'positivo',
    titulo: `+${pct}% XP esta semana`,
    detalle: `${xpSemanaActual} vs ${xpSemanaAnterior} la semana anterior.`,
  };
}

/**
 * Regla 3: Racha activa + hoy incompleto = motivación.
 * Loss aversion: "no rompas la racha".
 */
export function insightRachaEnRiesgo(
  diasConsecutivos: number,
  xpHoy: number,
  metaDiaria: number,
): Insight | null {
  if (diasConsecutivos < 7) return null;
  if (xpHoy >= metaDiaria) return null;
  const faltan = metaDiaria - xpHoy;
  return {
    tipo: 'motivacion',
    titulo: `Llevas ${diasConsecutivos} días`,
    detalle: `Te faltan ${faltan} XP para no romper la racha hoy.`,
  };
}

/**
 * Regla 4: Todas las categorías sólidas (>= 85%) → subir meta.
 * Mensaje positivo que reconoce el avance.
 */
export function insightMemoriaSolida(retencion: RetencionPorCategoria): Insight | null {
  const MINIMO = 0.85;
  for (const valor of Object.values(retencion)) {
    if (valor < MINIMO) return null;
  }
  return {
    tipo: 'positivo',
    titulo: 'Memoria sólida',
    detalle: 'Considera subir la meta diaria a 30 XP para mantener el desafío.',
  };
}

/**
 * Helper que ejecuta todas las reglas y devuelve los insights aplicables.
 */
export function generarInsights(args: {
  retencion: RetencionPorCategoria;
  xpSemanaActual: number;
  xpSemanaAnterior: number;
  diasConsecutivos: number;
  xpHoy: number;
  metaDiaria: number;
}): Insight[] {
  const insights: Insight[] = [];
  const r1 = insightPuntoDebil(args.retencion);
  if (r1) insights.push(r1);
  const r2 = insightTendenciaPositiva(args.xpSemanaActual, args.xpSemanaAnterior);
  if (r2) insights.push(r2);
  const r3 = insightRachaEnRiesgo(args.diasConsecutivos, args.xpHoy, args.metaDiaria);
  if (r3) insights.push(r3);
  const r4 = insightMemoriaSolida(args.retencion);
  if (r4) insights.push(r4);
  return insights;
}
