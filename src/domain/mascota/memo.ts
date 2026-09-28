import type { ColorSprite } from './sprites';

/**
 * Memo, la mascota de Ancla (ADR-033): cuándo duerme, cuándo celebra y cómo
 * se dibuja. Lógica pura — el componente (src/components/Memo.tsx) solo anima
 * lo que esto decide.
 *
 * La regla de fondo es una sola: Memo está despierto mientras haya racha. Así
 * su estado nunca contradice a la llama ni al número de días, y celebrar
 * significa algo: solo lo hace la sesión que cumplió la meta del día, que es
 * la que empieza o alarga la racha.
 */

export type EstadoMemo = 'despierto' | 'dormido';
export type ReaccionMemo = EstadoMemo | 'empieza-racha' | 'extiende-racha';

/** Inicio: despierto con cualquier racha, aunque hoy aún falte la meta. */
export function estadoDeMemo(diasConsecutivos: number): EstadoMemo {
  return diasConsecutivos > 0 ? 'despierto' : 'dormido';
}

/**
 * Al cerrar una sesión. `racha` es la ya actualizada con hoy; `tarjetasHoy`,
 * las calificadas hoy contando esta sesión (`dia_practica`), y
 * `calificadasEnSesion`, las de esta sesión. Si faltan los datos de la meta,
 * Memo solo refleja la racha.
 */
export function reaccionAlTerminar(s: {
  racha: number;
  tarjetasHoy: number | null;
  meta: number | null;
  calificadasEnSesion: number;
}): ReaccionMemo {
  const { racha, tarjetasHoy, meta, calificadasEnSesion } = s;
  const cruzoLaMeta =
    tarjetasHoy !== null &&
    meta !== null &&
    calificadasEnSesion > 0 &&
    tarjetasHoy >= meta &&
    tarjetasHoy - calificadasEnSesion < meta;
  if (cruzoLaMeta && racha >= 2) return 'extiende-racha';
  if (cruzoLaMeta && racha === 1) return 'empieza-racha';
  return estadoDeMemo(racha);
}

const ETIQUETAS: Record<ReaccionMemo, string> = {
  dormido: 'Memo está dormido. Despierta cuando cumples la meta del día.',
  despierto: 'Memo está despierto.',
  'empieza-racha': 'Memo despierta y celebra: empezaste una racha.',
  'extiende-racha': 'Memo celebra: tu racha sigue creciendo.',
};

/** Lo que anuncia un lector de pantalla: Memo es una imagen con significado. */
export function etiquetaDeMemo(reaccion: ReaccionMemo): string {
  return ETIQUETAS[reaccion];
}

export interface TramoSprite {
  x: number;
  y: number;
  ancho: number;
  color: ColorSprite;
}

/**
 * Los píxeles seguidos del mismo color de una fila, unidos en un solo tramo:
 * un <Rect> por tramo y no por píxel (unos 70 nodos por cuadro en vez de 300).
 */
export function rectsDeSprite(filas: readonly string[]): TramoSprite[] {
  const tramos: TramoSprite[] = [];
  filas.forEach((fila, y) => {
    let x = 0;
    while (x < fila.length) {
      const color = fila[x];
      let fin = x;
      while (fin + 1 < fila.length && fila[fin + 1] === color) fin += 1;
      if (color !== '.') tramos.push({ x, y, ancho: fin - x + 1, color: color as ColorSprite });
      x = fin + 1;
    }
  });
  return tramos;
}
