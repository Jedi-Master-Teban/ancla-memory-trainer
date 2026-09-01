/**
 * Geometría pura del LineChart. Construye paths SVG, agrupa datos por
 * ventana (día/semana/mes/todo) y normaliza coordenadas. Testeable.
 */

export type PeriodoLineChart = 'dia' | 'semana' | 'mes' | 'todo';

export interface PuntoLinea {
  fecha: string; // YYYY-MM-DD
  valor: number; // ej. XP o tarjetas revisadas
}

export interface GeometriaLinea {
  puntosPolyline: string;
  puntosArea: string;
  puntosCirculo: Array<{ cx: number; cy: number }>;
  ejeY: { min: number; max: number };
}

/**
 * Agrupa puntos por período (semana = lunes a domingo, mes = primer día).
 * Devuelve lista ordenada cronológicamente con la suma del período.
 */
export function agruparPorPeriodo(
  puntos: PuntoLinea[],
  periodo: PeriodoLineChart,
): PuntoLinea[] {
  if (puntos.length === 0) return [];
  const ordenado = [...puntos].sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (periodo === 'dia') return ordenado;

  const buckets = new Map<string, number>();
  for (const p of ordenado) {
    let clave = p.fecha;
    if (periodo === 'semana') clave = inicioDeSemana(p.fecha);
    if (periodo === 'mes') clave = p.fecha.slice(0, 7) + '-01';
    buckets.set(clave, (buckets.get(clave) ?? 0) + p.valor);
  }
  return Array.from(buckets.entries())
    .map(([fecha, valor]) => ({ fecha, valor }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function inicioDeSemana(fecha: string): string {
  // Semana inicia en lunes (ISO 8601).
  const d = new Date(fecha + 'T00:00:00Z');
  const dia = d.getUTCDay(); // 0=domingo, 1=lunes, ...
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Construye paths SVG para una línea con área debajo, dentro de un
 * viewBox de `ancho` × `alto` con padding lateral y superior.
 */
export function construirGeometria(
  puntos: PuntoLinea[],
  ancho: number,
  alto: number,
  paddingX = 10,
  paddingY = 10,
): GeometriaLinea {
  if (puntos.length === 0) {
    return {
      puntosPolyline: '',
      puntosArea: '',
      puntosCirculo: [],
      ejeY: { min: 0, max: 0 },
    };
  }
  const valores = puntos.map((p) => p.valor);
  const min = 0;
  const max = Math.max(...valores, 1);
  const interior = {
    ancho: ancho - paddingX * 2,
    alto: alto - paddingY * 2,
  };
  const xEn = (i: number) =>
    puntos.length === 1
      ? paddingX + interior.ancho / 2
      : paddingX + (i * interior.ancho) / (puntos.length - 1);
  const yEn = (v: number) => paddingY + interior.alto - (v / max) * interior.alto;

  const polyline = puntos.map((p, i) => `${xEn(i).toFixed(2)},${yEn(p.valor).toFixed(2)}`).join(' ');
  const yBase = paddingY + interior.alto;
  const area = `M${xEn(0).toFixed(2)},${yBase} ${puntos
    .map((p, i) => `L${xEn(i).toFixed(2)},${yEn(p.valor).toFixed(2)}`)
    .join(' ')} L${xEn(puntos.length - 1).toFixed(2)},${yBase} Z`;
  const circulos = puntos.map((p, i) => ({ cx: xEn(i), cy: yEn(p.valor) }));

  return { puntosPolyline: polyline, puntosArea: area, puntosCirculo: circulos, ejeY: { min, max } };
}

/**
 * Encuentra el mejor día (mayor valor) y devuelve su índice y valor.
 */
export function mejorPunto(puntos: PuntoLinea[]): { indice: number; valor: number; fecha: string } | null {
  if (puntos.length === 0) return null;
  let mejorIdx = 0;
  for (let i = 1; i < puntos.length; i++) {
    if (puntos[i].valor > puntos[mejorIdx].valor) mejorIdx = i;
  }
  const mejor = puntos[mejorIdx];
  return { indice: mejorIdx, valor: mejor.valor, fecha: mejor.fecha };
}
