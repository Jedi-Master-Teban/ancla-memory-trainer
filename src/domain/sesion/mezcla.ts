import { State } from 'ts-fsrs';
import type { Categoria, FilaTarjeta } from '../../db/tipos';
import { filaTarjetaACardInput, retrievability } from '../fsrs/scheduler';
import { TOPE_POR_DEFECTO } from './motor';

export interface OpcionesMezcla {
  ahora: Date;
  metaDiaria: number;
  /** Por defecto: min(metaDiaria, TOPE_POR_DEFECTO) — ver 09-dashboard.md §2 paso 5. */
  topeSesion?: number;
}

export const TOPE_CONSECUTIVAS_MISMA_CATEGORIA = 4;

const ORDEN_CATEGORIAS: Categoria[] = ['colgadero', 'naipe', 'lista_item', 'numero'];

function seleccionarNuevas(nuevasPorCategoria: Map<Categoria, FilaTarjeta[]>, cupo: number): FilaTarjeta[] {
  const colas = ORDEN_CATEGORIAS.map((cat) => [...(nuevasPorCategoria.get(cat) ?? [])]).filter(
    (cola) => cola.length > 0
  );

  const seleccionadas: FilaTarjeta[] = [];
  let i = 0;
  while (seleccionadas.length < cupo && colas.some((cola) => cola.length > 0)) {
    const cola = colas[i % colas.length];
    const siguiente = cola.shift();
    if (siguiente) seleccionadas.push(siguiente);
    i += 1;
  }
  return seleccionadas;
}

/**
 * Ninguna categoría puede aportar más de su "cupo justo" (tope / número de
 * categorías con vencidas, redondeado hacia arriba) — un backlog grande en
 * una sola categoría (p. ej. muchos `fsrs_lapses` reprogramando la misma
 * tarjeta una y otra vez) ya no puede copar el tope entero y dejar a las
 * demás en cero. Dentro de ese límite se respeta el orden de urgencia
 * recibido tal cual; lo que sobra porque alguna categoría no llegó a su
 * cupo se rellena con las tarjetas diferidas, también en orden de urgencia
 * — por eso una categoría muy sobrecargada sigue absorbiendo más que un
 * cupo justo cuando de verdad no hay nadie más a quien darle esos huecos.
 */
function limitarVencidasPorCategoria(ordenadasPorUrgencia: FilaTarjeta[], cupo: number): FilaTarjeta[] {
  const categorias = new Set(ordenadasPorUrgencia.map((t) => t.categoria));
  if (categorias.size === 0) return [];
  const cupoPorCategoria = Math.ceil(cupo / categorias.size);

  const seleccionadas: FilaTarjeta[] = [];
  const diferidas: FilaTarjeta[] = [];
  const usadasPorCategoria = new Map<Categoria, number>();

  for (const t of ordenadasPorUrgencia) {
    const usadas = usadasPorCategoria.get(t.categoria) ?? 0;
    if (seleccionadas.length < cupo && usadas < cupoPorCategoria) {
      seleccionadas.push(t);
      usadasPorCategoria.set(t.categoria, usadas + 1);
    } else {
      diferidas.push(t);
    }
  }
  for (const t of diferidas) {
    if (seleccionadas.length >= cupo) break;
    seleccionadas.push(t);
  }
  return seleccionadas;
}

/**
 * Evita más de `TOPE_CONSECUTIVAS_MISMA_CATEGORIA` tarjetas seguidas de la
 * misma categoría, intercambiando con la más cercana de categoría distinta
 * MÁS ADELANTE en el mismo array — nunca fuera de él. `mezclarSesion` la
 * llama por separado sobre vencidas y sobre nuevas para que un intercambio
 * jamás adelante una nueva por delante de una vencida.
 */
function intercalar(tarjetas: FilaTarjeta[]): FilaTarjeta[] {
  const resultado = [...tarjetas];
  for (let i = TOPE_CONSECUTIVAS_MISMA_CATEGORIA; i < resultado.length; i++) {
    const categoriaActual = resultado[i].categoria;
    const rachaPrevia = resultado
      .slice(i - TOPE_CONSECUTIVAS_MISMA_CATEGORIA, i)
      .every((t) => t.categoria === categoriaActual);
    if (!rachaPrevia) continue;

    const indiceDistinto = resultado.findIndex((t, j) => j > i && t.categoria !== categoriaActual);
    if (indiceDistinto === -1) continue;

    [resultado[i], resultado[indiceDistinto]] = [resultado[indiceDistinto], resultado[i]];
  }
  return resultado;
}

/**
 * Sesión mixta priorizada entre TODAS las categorías activas (§8.9,
 * agent_docs/modulos/09-dashboard.md §2). Vencidas primero (mayor retraso,
 * empate por menor retrievability), pero sin que una categoría con backlog
 * grande monopolice todo el tope y deje a las demás en cero — hallazgo real
 * en dispositivo (Fase 6): un lote grande de naipes con muchos lapses
 * llenaba las 20 tarjetas de la sesión y "mixta" dejaba de serlo. Nuevas
 * repartidas por el mismo motivo. Tope duro, sin rachas largas de una sola
 * categoría, y nunca cruza nuevas por delante de vencidas.
 */
export function mezclarSesion(tarjetas: FilaTarjeta[], opciones: OpcionesMezcla): FilaTarjeta[] {
  const { ahora, metaDiaria } = opciones;
  const ahoraMs = ahora.getTime();
  const topeSesion = opciones.topeSesion ?? Math.min(metaDiaria, TOPE_POR_DEFECTO);

  const activas = tarjetas.filter((t) => t.archivada === 0);

  const vencidasOrdenadas = activas
    .filter((t) => t.fsrs_state !== State.New && new Date(t.fecha_proxima_revision).getTime() <= ahoraMs)
    .sort((a, b) => {
      const diferenciaFecha =
        new Date(a.fecha_proxima_revision).getTime() - new Date(b.fecha_proxima_revision).getTime();
      if (diferenciaFecha !== 0) return diferenciaFecha;
      return (
        retrievability(filaTarjetaACardInput(a), ahora) - retrievability(filaTarjetaACardInput(b), ahora)
      );
    });
  const vencidas = limitarVencidasPorCategoria(vencidasOrdenadas, topeSesion);

  const nuevasPorCategoria = new Map<Categoria, FilaTarjeta[]>();
  for (const t of activas) {
    if (t.fsrs_state !== State.New) continue;
    const lista = nuevasPorCategoria.get(t.categoria) ?? [];
    lista.push(t);
    nuevasPorCategoria.set(t.categoria, lista);
  }
  for (const lista of nuevasPorCategoria.values()) {
    lista.sort((a, b) => a.contenido_frente.localeCompare(b.contenido_frente, undefined, { numeric: true }));
  }

  const cupoNuevas = Math.max(0, topeSesion - vencidas.length);
  const nuevasSeleccionadas = seleccionarNuevas(nuevasPorCategoria, cupoNuevas);

  return [...intercalar(vencidas), ...intercalar(nuevasSeleccionadas)];
}
