import { State } from 'ts-fsrs';
import type { FilaTarjeta } from '../../db/tipos';

export interface OpcionesSesion {
  ahora: Date;
  tope?: number;
  /**
   * Inyectable para tests deterministas (mismo patrón que el reloj — I-6).
   * Por defecto: barajado real (Fisher-Yates), para que la presentación no
   * sea predecible. Pasar `(arr) => arr` para desactivarlo.
   */
  aleatorizar?: <T>(arr: T[]) => T[];
}

const TOPE_POR_DEFECTO = 20;

function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Selecciona y baraja las tarjetas de una sesión (modulos/02-colgadero.md §3):
 * la SELECCIÓN prioriza vencidas (más urgente = más atrasada) y luego nuevas
 * en orden de número (cobertura sistemática del corpus, no huecos). La
 * PRESENTACIÓN final se baraja: sin esto, en el modo Reverso la posición en
 * la sesión delata el número (si vas por la tarjeta 25, la palabra ronda la
 * 21-40) y adivinar deja de requerir memoria — hallazgo real del operador
 * probando la app, no estaba contemplado en ningún doc. Lógica pura,
 * reusable por cualquier categoría (la Fase 3 reusa esto para naipes).
 */
export function armarSesion(tarjetas: FilaTarjeta[], opciones: OpcionesSesion): FilaTarjeta[] {
  const ahoraMs = opciones.ahora.getTime();
  const tope = opciones.tope ?? TOPE_POR_DEFECTO;
  const aleatorizar = opciones.aleatorizar ?? barajar;

  const activas = tarjetas.filter((t) => t.archivada === 0);

  const vencidas = activas
    .filter((t) => t.fsrs_state !== State.New && new Date(t.fecha_proxima_revision).getTime() <= ahoraMs)
    .sort((a, b) => new Date(a.fecha_proxima_revision).getTime() - new Date(b.fecha_proxima_revision).getTime());

  const nuevas = activas
    .filter((t) => t.fsrs_state === State.New)
    .sort((a, b) => a.contenido_frente.localeCompare(b.contenido_frente, undefined, { numeric: true }));

  const seleccionadas = [...vencidas, ...nuevas].slice(0, tope);
  return aleatorizar(seleccionadas);
}
