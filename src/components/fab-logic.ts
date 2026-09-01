import type { Categoria } from '../db/tipos';

/**
 * Detecta la categoría activa desde la ruta de expo-router. Pura, sin
 * dependencias de runtime, testeable. Devuelve `null` si la ruta no
 * pertenece a ninguna categoría (ej: Inicio, Editar, Stats, Ajustes).
 */
export function categoriaDeRuta(pathname: string | undefined): Categoria | null {
  if (!pathname) return null;
  if (pathname.startsWith('/colgadero')) return 'colgadero';
  if (pathname.startsWith('/naipes')) return 'naipe';
  if (pathname.startsWith('/listas')) return 'lista_item';
  if (pathname.startsWith('/numeros')) return 'numero';
  return null;
}
