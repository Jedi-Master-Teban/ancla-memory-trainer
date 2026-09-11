import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

/**
 * Íconos de la app (Fase 8, ADR-027). Los trazos de las 4 categorías y el de
 * ajustes están copiados literalmente del objeto `ICONOS` y del botón de
 * cabecera de `agent_docs/prototipos/pantallas/dashboard.html` — no son
 * aproximaciones. `react-native-svg` viene incluido en Expo Go SDK 54, así que
 * esto no requiere development build.
 *
 * Fase 8 v2: `trazo` es configurable. La isla de navegación usa 1.9 y el ancla
 * del botón de repaso 2.3; el resto de la app sigue en 2.
 */
interface PropsIcono {
  color: string;
  tamano?: number;
  trazo?: number;
}

const TRAZO = 2;

export function IconoColgadero({ color, tamano = 18, trazo = TRAZO }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v11a3 3 0 1 0 3-3" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
    </Svg>
  );
}

export function IconoNaipe({ color, tamano = 18, trazo = TRAZO }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={3} width={14} height={18} rx={3} stroke={color} strokeWidth={trazo} />
      <Circle cx={12} cy={12} r={2.4} fill={color} />
    </Svg>
  );
}

export function IconoLista({ color, tamano = 18, trazo = TRAZO }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={8} width={10} height={8} rx={4} stroke={color} strokeWidth={trazo} />
      <Rect x={11} y={8} width={10} height={8} rx={4} stroke={color} strokeWidth={trazo} />
    </Svg>
  );
}

export function IconoNumero({ color, tamano = 18, trazo = TRAZO }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={9} rx={3} stroke={color} strokeWidth={trazo} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
    </Svg>
  );
}

/** Deslizadores — el ícono de Ajustes del mockup. NO es un engranaje. */
export function IconoAjustes({ color, tamano = 18, trazo = TRAZO }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Line x1={4} y1={7} x2={20} y2={7} stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Circle cx={15} cy={7} r={2} fill={color} />
      <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Circle cx={9} cy={12} r={2} fill={color} />
      <Line x1={4} y1={17} x2={20} y2={17} stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Circle cx={17} cy={17} r={2} fill={color} />
    </Svg>
  );
}

/** Flecha entre la carta y la palabra (naipes.html:126). */
export function IconoChevron({ color, tamano = 20, trazo = TRAZO }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={trazo} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Ancla — identidad de la app. Cabecera, ícono de la app y botón de repaso. */
export function IconoAncla({ color, tamano = 24, trazo = TRAZO }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={4.5} r={2.5} stroke={color} strokeWidth={trazo} />
      <Path d="M12 7v14" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Path d="M8 11h8" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Path d="M12 21c-4 0-7-3-7-7" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Path d="M12 21c4 0 7-3 7-7" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
    </Svg>
  );
}

/** Barras horizontales — conmutador de Stats cuando está el radar. */
export function IconoBarras({ color, tamano = 19, trazo = 2.1 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h14" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Path d="M4 12h9" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Path d="M4 18h12" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
    </Svg>
  );
}

/** Radar en miniatura — conmutador de Stats cuando están las barras. */
export function IconoRadar({ color, tamano = 19, trazo = 1.7 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3 21 9.5 17.6 20H6.4L3 9.5z" stroke={color} strokeWidth={trazo} strokeLinejoin="round" />
      <Path
        d="M12 8.5 16.6 12l-1.7 5.3H9.1L7.4 12z"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
        opacity={0.55}
      />
    </Svg>
  );
}

/** Copo — los congeladores de racha. */
export function IconoCongelador({ color, tamano = 21, trazo = 2 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Path d="M4.5 7.5l15 9" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
      <Path d="M19.5 7.5l-15 9" stroke={color} strokeWidth={trazo} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Llama estática. Para la versión animada usa `<Llama />` (Llama.tsx), que es
 * la que se usa en el dashboard, en Racha y en el resumen de sesión.
 *
 * Los dos paths están documentados en DESIGN.md §5.9: la silueta tiene la
 * punta inclinada y un rizo interior — eso es lo que la distingue de una gota,
 * que era el problema de la versión anterior.
 */
export const PATH_LLAMA_SILUETA =
  'M12.6 2c3.7 4.3 5.6 7.4 5.6 10.4a6.2 6.2 0 1 1-12.4 0c0-2.2 1.1-4.4 3.1-6.7-.3 1.7.2 2.8 1.2 3.3 1.1.5 2.2-.2 2.4-1.6.2-1.5-.1-3.2-.9-5.4z';
export const PATH_LLAMA_NUCLEO =
  'M12 12.4c1.9 2 2.9 3.6 2.9 4.9a2.9 2.9 0 1 1-5.8 0c0-1.3 1-2.9 2.9-4.9z';

export function IconoLlama({
  colorExterior,
  colorInterior,
  tamano = 56,
}: {
  colorExterior: string;
  colorInterior: string;
  tamano?: number;
}) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d={PATH_LLAMA_SILUETA} fill={colorExterior} />
      <Path d={PATH_LLAMA_NUCLEO} fill={colorInterior} />
    </Svg>
  );
}
