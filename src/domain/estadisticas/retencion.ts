import { Rating } from 'ts-fsrs';
import type { Categoria, FilaRevision, FilaTarjeta } from '../../db/tipos';
import { estadoVisual, type EstadoVisual } from '../fsrs/estado';
import { filaTarjetaACardInput } from '../fsrs/scheduler';

export type Ventana = '7d' | '30d' | 'todo';

/**
 * "Retenida" = calificación ≥ Bien (agent_docs/modulos/08-panel-retencion.md §2)
 * — umbral propio de este módulo, deliberadamente distinto de
 * `resumenDeTarjeta`/`stores/sesion.ts` (calificación !== Otra vez, donde
 * Difícil sí cuenta). Uno responde "¿seguiste adelante en la sesión?", este
 * responde "¿de verdad lo recuerdas bien?" — no se mezclan.
 */
function esRevisionRetenida(calificacion: number): boolean {
  return calificacion >= Rating.Good;
}

export const UMBRAL_LAPSES_PROBLEMATICA = 3;
export const UMBRAL_TASA_RETENCION_PROBLEMATICA = 0.5;
export const MINIMO_REVISIONES_PROBLEMATICA = 5;

const CATEGORIAS: Categoria[] = ['colgadero', 'naipe', 'lista_item', 'numero'];

export type ConteoPorEstado = Record<EstadoVisual, number>;

export interface MetricasCategoria {
  categoria: Categoria;
  porcentajeRetencion: number | null;
  estados: ConteoPorEstado;
}

export interface TarjetaProblematica {
  tarjeta: FilaTarjeta;
  vecesRevisada: number;
  tasaRetencion: number | null;
}

export interface PanelRetencion {
  porCategoria: MetricasCategoria[];
  tarjetasProblematicas: TarjetaProblematica[];
}

function tasaDeRevisionesRetenidas(revisiones: FilaRevision[]): number | null {
  if (revisiones.length === 0) return null;
  const retenidas = revisiones.filter((r) => esRevisionRetenida(r.calificacion)).length;
  return retenidas / revisiones.length;
}

function inicioDeVentana(ventana: Ventana, ahora: Date): Date | null {
  if (ventana === 'todo') return null;
  const dias = ventana === '7d' ? 7 : 30;
  return new Date(ahora.getTime() - dias * 86_400_000);
}

/** Ventana solo acota esta métrica (§2: "los conteos por estado son siempre del momento actual"). */
export function porcentajeRetencion(revisiones: FilaRevision[], ventana: Ventana, ahora: Date): number | null {
  const desde = inicioDeVentana(ventana, ahora);
  const enVentana =
    desde === null ? revisiones : revisiones.filter((r) => new Date(r.fecha).getTime() >= desde.getTime());
  return tasaDeRevisionesRetenidas(enVentana);
}

/** Delega 100% en estadoVisual() — "no se recalculan a mano aquí" (§2). */
export function contarPorEstado(tarjetas: FilaTarjeta[], ahora: Date): ConteoPorEstado {
  const conteo: ConteoPorEstado = { nueva: 0, aprendiendo: 0, madura: 0, en_riesgo: 0 };
  for (const t of tarjetas) {
    conteo[estadoVisual(filaTarjetaACardInput(t), ahora)] += 1;
  }
  return conteo;
}

/**
 * §4: lapses≥3 es una rama independiente (nunca exige mínimo de revisiones);
 * la rama de tasa exige al menos 5 revisiones. `fsrs_lapses` es el contador
 * de por vida de ts-fsrs — nunca se acota por ventana, a propósito: el
 * módulo solo menciona ventana para el % de retención de §2.
 */
export function esTarjetaProblematica(
  tarjeta: FilaTarjeta,
  vecesRevisada: number,
  tasaRetencion: number | null
): boolean {
  if (tarjeta.fsrs_lapses >= UMBRAL_LAPSES_PROBLEMATICA) return true;
  return (
    vecesRevisada >= MINIMO_REVISIONES_PROBLEMATICA &&
    tasaRetencion !== null &&
    tasaRetencion < UMBRAL_TASA_RETENCION_PROBLEMATICA
  );
}

/**
 * Peor primero: tasa de retención ascendente (sin dato mide "menos urgente",
 * al final), empate por lapses descendente, empate final por id. La tasa
 * (normalizada) es la clave primaria, no el conteo crudo de lapses, para no
 * sesgar hacia tarjetas viejas muy repasadas.
 */
function compararPeorPrimero(a: TarjetaProblematica, b: TarjetaProblematica): number {
  const rango = (t: TarjetaProblematica) => t.tasaRetencion ?? Infinity;
  const diferenciaTasa = rango(a) - rango(b);
  if (diferenciaTasa !== 0) return diferenciaTasa;
  const diferenciaLapses = b.tarjeta.fsrs_lapses - a.tarjeta.fsrs_lapses;
  if (diferenciaLapses !== 0) return diferenciaLapses;
  return a.tarjeta.id.localeCompare(b.tarjeta.id);
}

/**
 * Composición de nivel superior (agent_docs/modulos/08-panel-retencion.md).
 * §2 cuenta revisiones de tarjetas archivadas también — `revision` nunca se
 * borra, es el histórico crudo (MODELO-DATOS.md §2.3). §4 (problemáticas)
 * solo considera tarjetas activas: una archivada no tiene qué editar.
 */
export function calcularPanelRetencion(
  tarjetas: FilaTarjeta[],
  revisiones: FilaRevision[],
  ventana: Ventana,
  ahora: Date
): PanelRetencion {
  const categoriaPorTarjetaId = new Map(tarjetas.map((t) => [t.id, t.categoria]));
  const activas = tarjetas.filter((t) => t.archivada === 0);

  const porCategoria: MetricasCategoria[] = CATEGORIAS.map((categoria) => {
    const revisionesDeCategoria = revisiones.filter((r) => categoriaPorTarjetaId.get(r.tarjeta_id) === categoria);
    const tarjetasActivasDeCategoria = activas.filter((t) => t.categoria === categoria);
    return {
      categoria,
      porcentajeRetencion: porcentajeRetencion(revisionesDeCategoria, ventana, ahora),
      estados: contarPorEstado(tarjetasActivasDeCategoria, ahora),
    };
  });

  const revisionesPorTarjetaId = new Map<string, FilaRevision[]>();
  for (const r of revisiones) {
    const lista = revisionesPorTarjetaId.get(r.tarjeta_id) ?? [];
    lista.push(r);
    revisionesPorTarjetaId.set(r.tarjeta_id, lista);
  }

  const tarjetasProblematicas: TarjetaProblematica[] = activas
    .map((tarjeta) => {
      const revisionesDeTarjeta = revisionesPorTarjetaId.get(tarjeta.id) ?? [];
      return {
        tarjeta,
        vecesRevisada: revisionesDeTarjeta.length,
        tasaRetencion: tasaDeRevisionesRetenidas(revisionesDeTarjeta),
      };
    })
    .filter((p) => esTarjetaProblematica(p.tarjeta, p.vecesRevisada, p.tasaRetencion))
    .sort(compararPeorPrimero);

  return { porCategoria, tarjetasProblematicas };
}
