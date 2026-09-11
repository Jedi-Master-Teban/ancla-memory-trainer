import { BarChart3, Home, Pencil, Settings } from 'lucide';
import type { IconNode } from 'morphicons/react-native';

/**
 * Definición de las 4 tabs globales (pura, sin RN imports — testeable sin
 * el runtime de react-native-reanimated; `lucide` es un paquete de datos
 * puro, sin dependencia de React ni de RN, y el import de `IconNode` es
 * solo de tipo — se borra al compilar).
 *
 * Los iconos son datos reales de Lucide (`IconNode`, un array de
 * `[tag, attrs]`), no nombres con string. `MorphIcon` NO trae un registro
 * de iconos por nombre — un string como `"lucide-house"` se interpretaría
 * como un atributo `d` de SVG literal, no como una búsqueda por nombre
 * (confirmado en node_modules/morphicons/README.md: "Icons come from a
 * data package, not a component package"). Esa confusión dejaba casi toda
 * la app en blanco: FAB.tsx se renderiza en cada pantalla salvo Inicio, y
 * su `<MorphIcon icon="lucide-plus" .../>` fallaba en cada una.
 */

export type TabId = 'inicio' | 'editar' | 'stats' | 'ajustes';

export interface Tab {
  id: TabId;
  ruta: '/editar' | '/' | '/estadisticas' | '/ajustes';
  etiqueta: string;
  icono: IconNode;
}

export const TABS: Tab[] = [
  { id: 'inicio', ruta: '/', etiqueta: 'Inicio', icono: Home },
  { id: 'editar', ruta: '/editar', etiqueta: 'Editar', icono: Pencil },
  { id: 'stats', ruta: '/estadisticas', etiqueta: 'Stats', icono: BarChart3 },
  { id: 'ajustes', ruta: '/ajustes', etiqueta: 'Ajustes', icono: Settings },
];

export const RUTA_POR_TAB: Record<TabId, Tab['ruta']> = {
  inicio: '/',
  editar: '/editar',
  stats: '/estadisticas',
  ajustes: '/ajustes',
};

/**
 * Pantallas que NO son pestañas pero cuelgan de una (DESIGN.md §7.4).
 *
 * Sin esto, `/racha` no coincidía con ninguna pestaña, la isla se quedaba sin
 * ninguna activa, las cuatro se encogían a la vez al ancho de ícono y el
 * resultado parecía un glitch: íconos corridos y una pastilla sin etiqueta.
 * Racha y las pantallas de categoría se abren desde Inicio, así que Inicio es
 * su pestaña padre y se queda encendida mientras estás dentro.
 *
 * `null` sigue siendo un valor válido: significa "esconde la isla" (sesión de
 * repaso, resumen, formularios de creación).
 */
const PESTANA_PADRE: Record<string, TabId> = {
  '/racha': 'inicio',
  '/colgadero': 'inicio',
  '/naipes': 'inicio',
  '/listas': 'inicio',
  '/numeros': 'inicio',
  '/historial-sesiones': 'stats',
};

/** Rutas de pestaña exactas, resueltas primero. */
const RUTA_EXACTA: Record<string, TabId> = {
  '/': 'inicio',
  '/index': 'inicio',
  '/editar': 'editar',
  '/estadisticas': 'stats',
  '/ajustes': 'ajustes',
};

/**
 * Resuelve qué pestaña debe verse activa para una ruta cualquiera.
 * Devuelve `null` cuando la isla no debe mostrarse.
 *
 * Solo los índices de categoría (`/naipes`) cuelgan de Inicio; sus modos de
 * práctica (`/naipes/flash`) devuelven `null` porque son sesiones, y durante
 * una sesión la isla estorba.
 */
export function pestanaActiva(pathname: string): TabId | null {
  const exacta = RUTA_EXACTA[pathname];
  if (exacta) return exacta;
  const padre = PESTANA_PADRE[pathname];
  if (padre) return padre;
  return null;
}
