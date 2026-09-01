/**
 * Definición de las 4 tabs globales (pura, sin RN imports — testeable sin
 * el runtime de react-native-reanimated). El componente visual vive en
 * TabBarInferior.tsx y reutiliza este array.
 */

export type TabId = 'inicio' | 'editar' | 'stats' | 'ajustes';

export interface TabItem {
  id: TabId;
  etiqueta: string;
  icono: string; // emoji por ahora; SF Symbols en Fase futura
}

export const TABS: TabItem[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: '🏠' },
  { id: 'editar', etiqueta: 'Editar', icono: '📝' },
  { id: 'stats', etiqueta: 'Stats', icono: '📊' },
  { id: 'ajustes', etiqueta: 'Ajustes', icono: '⚙️' },
];
