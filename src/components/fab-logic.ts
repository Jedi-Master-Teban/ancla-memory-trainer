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

/**
 * Prefijos de rutas inmersivas a pantalla completa (Fase 9): Hojear ocupa todo
 * el alto, oculta la isla y se cierra con la ✕ de su encabezado. Un FAB
 * flotando ahí taparía el riel de posición.
 */
const INMERSIVAS = ['/hojear'];

/** Pantallas de consulta: se miran, no se editan. */
const SOLO_LECTURA = ['/estadisticas', '/ajustes', '/racha', '/historial-sesiones'];

/** Secciones de lectura con subpáginas: la Guía y sus capítulos (ADR-031). */
const LECTURA_CON_SUBPAGINAS = ['/guia'];

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
 *   - Hojear, que es lectura a pantalla completa.
 *
 * Antes solo se escondía en Inicio, así que aparecía flotando sobre las
 * estadísticas y en mitad de un repaso.
 */
export function debeMostrarFab(pathname: string | undefined): boolean {
  if (!pathname) return false;
  const ruta = pathname.split('?')[0];
  if (ruta === '/' || ruta === '/index') return false;
  // Naipes: 52 cartas fijas (ADR-025), no hay nada que crear. Antes el «+»
  // llevaba a un formulario que respondía «Error: Naipe no admite creación».
  if (categoriaDeRuta(ruta) === 'naipe') return false;
  // Sobre un formulario de creación, un «+» no crea nada: es el formulario.
  if (ruta.startsWith('/crear/')) return false;
  if (SOLO_LECTURA.includes(ruta)) return false;
  if (LECTURA_CON_SUBPAGINAS.some((p) => ruta === p || ruta.startsWith(`${p}/`))) return false;
  if (INMERSIVAS.some((p) => ruta.startsWith(p))) return false;
  return !esRutaDeSesion(ruta);
}

/** Categorías que el «+» puede crear. Naipes no: son 52 cartas fijas. */
export const CATEGORIAS_CREABLES: Categoria[] = ['colgadero', 'lista_item', 'numero'];

export type DestinoFab = { tipo: 'ruta'; ruta: string } | { tipo: 'nueva-lista' } | null;

/**
 * Qué hace el «+» según la categoría y el sitio. En Listas no hay «crear un
 * objeto» a secas: un objeto siempre es de una lista. Dentro de una lista
 * añade a ESA lista (`/crear/lista_item?listaId=…`); en cualquier otro sitio,
 * lo que se puede crear es una lista nueva. Antes mandaba siempre a
 * `/crear/lista_item` sin lista y fallaba con «Falta listaId».
 */
export function destinoDelFab(categoria: Categoria, pathname: string | undefined): DestinoFab {
  switch (categoria) {
    case 'colgadero':
      return { tipo: 'ruta', ruta: rutaCrear('colgadero') };
    case 'numero':
      // /numeros/nuevo tiene vista previa en tiempo real; no se reemplaza por el formulario genérico.
      return { tipo: 'ruta', ruta: '/numeros/nuevo' };
    case 'lista_item': {
      const ruta = (pathname ?? '').split('?')[0];
      const dentro = /^\/listas\/([^/]+)$/.exec(ruta);
      if (dentro && dentro[1] !== 'estudiar') {
        return { tipo: 'ruta', ruta: `${rutaCrear('lista_item')}?listaId=${dentro[1]}` };
      }
      return { tipo: 'nueva-lista' };
    }
    default:
      return null;
  }
}
