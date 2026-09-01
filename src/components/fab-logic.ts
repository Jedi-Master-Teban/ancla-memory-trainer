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
