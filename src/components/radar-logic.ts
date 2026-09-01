/**
 * Geometría pura del RadarChart. Devuelve coordenadas SVG para vértices
 * de polígonos concéntricos, ejes y datos. Testeable sin runtime de RN.
 */

export interface PuntoRadar {
  x: number;
  y: number;
}

/**
 * Calcula la posición de un vértice del radar.
 * @param indice Índice del eje (0-based, desde la parte superior y en sentido horario).
 * @param total Ejes totales (típicamente 4 = 4 categorías).
 * @param radio Distancia desde el centro.
 * @param cx Centro X.
 * @param cy Centro Y.
 */
export function puntoVertice(
  indice: number,
  total: number,
  radio: number,
  cx: number,
  cy: number,
): PuntoRadar {
  // Empezamos desde arriba (-π/2) y vamos en sentido horario
  const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / total;
  return {
    x: cx + Math.cos(angulo) * radio,
    y: cy + Math.sin(angulo) * radio,
  };
}

/**
 * Genera los puntos del polígono de datos (valores de retención).
 * `valores` debe tener la misma longitud que `etiquetas` y estar normalizado [0..1].
 */
export function poligonoDatos(
  valores: number[],
  cx: number,
  cy: number,
  radio: number,
): string {
  return valores
    .map((valor, i) => {
      const p = puntoVertice(i, valores.length, radio * Math.max(0, Math.min(1, valor)), cx, cy);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Genera el polígono de un anillo de referencia (25/50/75/100%).
 */
export function poligonoAnillo(
  total: number,
  fraccion: number,
  cx: number,
  cy: number,
  radio: number,
): string {
  return Array.from({ length: total }, (_, i) => {
    const p = puntoVertice(i, total, radio * fraccion, cx, cy);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(' ');
}

/**
 * Posición para etiquetar un eje (un poco más afuera del último anillo).
 */
export function puntoEtiqueta(
  indice: number,
  total: number,
  cx: number,
  cy: number,
  radio: number,
  margen = 14,
): PuntoRadar {
  return puntoVertice(indice, total, radio + margen, cx, cy);
}
