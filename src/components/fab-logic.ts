import type { Categoria } from '../db/tipos';

/**
 * Detecta la categoría activa desde la ruta de expo-router. Pura, sin
 * dependencias de runtime, testeable. Devuelve `null` si la ruta no
 * pertenece a ninguna categoría (ej: Inicio, Editar, Stats, Ajustes).
 *
 * Considera que `/crear/[categoria]` también es una ruta de categoría
 * (el FAB debe poder mostrar el menú desde ahí para cambiar de
 * categoría sin tener que volver atrás).
 */
export function categoriaDeRuta(pathname: string | undefined): Categoria | null {
  if (!pathname) return null;
  if (pathname.startsWith('/colgadero') || pathname.startsWith('/crear/colgadero')) return 'colgadero';
  if (pathname.startsWith('/naipes') || pathname.startsWith('/crear/naipe')) return 'naipe';
  if (pathname.startsWith('/listas') || pathname.startsWith('/crear/lista_item')) return 'lista_item';
  if (pathname.startsWith('/numeros') || pathname.startsWith('/crear/numero')) return 'numero';
  return null;
}

/**
 * Ruta de creación para una categoría. Las pantallas de creación viven
 * en `/crear/[categoria]` (ver §8.6). `naipe` no se crea (se edita
 * siempre dentro de un mazo — ADR-025) pero igualmente navega para
 * coherencia visual.
 */
export function rutaCrear(categoria: Categoria): string {
  return `/crear/${categoria}`;
}

/**
 * Últimos segmentos de ruta que identifican un modo de estudio. Se comparan por
 * sufijo y no con una lista de rutas completas a propósito: así una categoría
 * nueva con su `/flash` entra sola, sin que haya que acordarse de esta lista.
 */
const MODOS_DE_ESTUDIO = [
  '/flash',
  '/reverso',
  '/velocidad',
  '/estudiar',
  '/repasar',
  '/baraja-completa',
];

/** Sesiones que no cuelgan de ninguna categoría. */
const SESIONES_SUELTAS = ['/practicar', '/practica-libre', '/resumen-sesion'];

/** Pantallas de consulta: se miran, no se editan. */
const SOLO_LECTURA = ['/estadisticas', '/ajustes', '/racha', '/historial-sesiones'];

/** ¿Esta ruta es una sesión de estudio en curso? */
export function esRutaDeSesion(pathname: string | undefined): boolean {
  if (!pathname) return false;
  const ruta = pathname.split('?')[0];
  return SESIONES_SUELTAS.includes(ruta) || MODOS_DE_ESTUDIO.some((m) => ruta.endsWith(m));
}

/**
 * ¿Debe verse el FAB de crear en esta ruta?
 *
 * El FAB solo tiene sentido donde de verdad se puede añadir algo. Se esconde en:
 *
 *   - Inicio, que ya es un menú de accesos directos.
 *   - Las pantallas de consulta (Stats, Ajustes, Racha, Historial): ahí no se
 *     crea nada, y el botón tapaba parte del heatmap y de las gráficas.
 *   - Cualquier sesión de estudio, donde competía por el pulgar con los botones
 *     de calificar y tapaba la esquina de la tarjeta.
 *
 * Antes solo se escondía en Inicio, así que aparecía flotando sobre las
 * estadísticas y en mitad de un repaso.
 */
export function debeMostrarFab(pathname: string | undefined): boolean {
  if (!pathname) return false;
  const ruta = pathname.split('?')[0];
  if (ruta === '/' || ruta === '/index') return false;
  if (SOLO_LECTURA.includes(ruta)) return false;
  return !esRutaDeSesion(ruta);
}
