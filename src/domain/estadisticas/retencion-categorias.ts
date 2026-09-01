import type { ConexionBD } from '../../db/tipos';
import { listarTodasLasRevisiones, listarTodasLasTarjetas } from '../../db/repository';
import { calcularPanelRetencion, type Ventana } from './retencion';
import type { Categoria } from '../../db/tipos';

export type RetencionPorCategoria = Record<Categoria, number>;

/**
 * Retención agregada por categoría para alimentar el RadarChart. Toma
 * los datos de `porCategoria` del panel existente (no recalcula) y los
 * mapea a las 4 categorías de mazo.
 *
 * - Devuelve 0 cuando la categoría no tiene datos (para que el radar
 *   siempre tenga 4 vértices renderizados, aunque algunos en el centro).
 * - Las claves siempre presentes: colgadero, naipe, lista_item, numero.
 */
export async function retencionPorCategoria(
  db: ConexionBD,
  ventana: Ventana = '30d',
  ahora: Date = new Date(),
): Promise<RetencionPorCategoria> {
  const [tarjetas, revisiones] = await Promise.all([
    listarTodasLasTarjetas(db),
    listarTodasLasRevisiones(db),
  ]);
  const panel = await Promise.resolve(
    calcularPanelRetencion(tarjetas, revisiones, ventana, ahora),
  );
  const mapa: Partial<RetencionPorCategoria> = {};
  for (const metrica of panel.porCategoria) {
    mapa[metrica.categoria] = metrica.porcentajeRetencion ?? 0;
  }
  return {
    colgadero: mapa.colgadero ?? 0,
    naipe: mapa.naipe ?? 0,
    lista_item: mapa.lista_item ?? 0,
    numero: mapa.numero ?? 0,
  };
}
