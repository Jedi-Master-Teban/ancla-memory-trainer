/**
 * Tipos y lógica del SegmentedControl (puro, testeable sin runtime de
 * react-native). El componente visual vive en SegmentedControl.tsx.
 */

export interface Segmento<T extends string> {
  id: T;
  etiqueta: string;
}

export interface PropsSegmentado<T extends string> {
  segmentos: Segmento<T>[];
  activo: T;
  onChange: (id: T) => void;
}

/**
 * Estado del control: el índice del segmento activo. Helpers para mover
 * siguiente/anterior sin salirse del rango.
 */
export function moverSegmento<T extends string>(
  segmentos: Segmento<T>[],
  activo: T,
  direccion: 1 | -1,
): T {
  const idx = segmentos.findIndex((s) => s.id === activo);
  if (idx < 0) return segmentos[0]?.id ?? activo;
  const nuevo = (idx + direccion + segmentos.length) % segmentos.length;
  return segmentos[nuevo].id;
}
