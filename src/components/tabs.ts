/**
 * Definición de las 4 tabs globales (pura, sin RN imports — testeable sin
 * el runtime de react-native-reanimated). El componente visual vive en
 * TabBarInferior.tsx y reutiliza este array.
 *
 * Los iconos usan el nombre canónico de MorphIcons (estilo lucide). El
 * componente visual los pasa como `icon` prop al MorphIcon.
 */

export type TabId = 'inicio' | 'editar' | 'stats' | 'ajustes';

export interface Tab {
  id: TabId;
  ruta: '/editar' | '/' | '/estadisticas' | '/ajustes';
  etiqueta: string;
  icono: string;
}

export const TABS: Tab[] = [
  { id: 'inicio', ruta: '/', etiqueta: 'Inicio', icono: 'lucide-house' },
  { id: 'editar', ruta: '/editar', etiqueta: 'Editar', icono: 'lucide-pencil' },
  { id: 'stats', ruta: '/estadisticas', etiqueta: 'Stats', icono: 'lucide-bar-chart-3' },
  { id: 'ajustes', ruta: '/ajustes', etiqueta: 'Ajustes', icono: 'lucide-settings' },
];
