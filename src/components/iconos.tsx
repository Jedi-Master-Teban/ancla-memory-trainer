import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

/**
 * Íconos de la app (Fase 8, ADR-027). Los trazos de las 4 categorías y el de
 * ajustes están copiados literalmente del objeto `ICONOS` y del botón de
 * cabecera de `agent_docs/prototipos/pantallas/dashboard.html` — no son
 * aproximaciones. `react-native-svg` viene incluido en Expo Go SDK 54, así que
 * esto no requiere development build.
 */
interface PropsIcono {
  color: string;
  tamano?: number;
}

const TRAZO = 2;

export function IconoColgadero({ color, tamano = 18 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v11a3 3 0 1 0 3-3" stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
    </Svg>
  );
}

export function IconoNaipe({ color, tamano = 18 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={3} width={14} height={18} rx={3} stroke={color} strokeWidth={TRAZO} />
      <Circle cx={12} cy={12} r={2.4} fill={color} />
    </Svg>
  );
}

export function IconoLista({ color, tamano = 18 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={8} width={10} height={8} rx={4} stroke={color} strokeWidth={TRAZO} />
      <Rect x={11} y={8} width={10} height={8} rx={4} stroke={color} strokeWidth={TRAZO} />
    </Svg>
  );
}

export function IconoNumero({ color, tamano = 18 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={9} rx={3} stroke={color} strokeWidth={TRAZO} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
    </Svg>
  );
}

/** Deslizadores — el ícono de Ajustes del mockup. NO es un engranaje. */
export function IconoAjustes({ color, tamano = 18 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Line x1={4} y1={7} x2={20} y2={7} stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
      <Circle cx={15} cy={7} r={2} fill={color} />
      <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
      <Circle cx={9} cy={12} r={2} fill={color} />
      <Line x1={4} y1={17} x2={20} y2={17} stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
      <Circle cx={17} cy={17} r={2} fill={color} />
    </Svg>
  );
}

/** Flecha entre la carta y la palabra (naipes.html:126). */
export function IconoChevron({ color, tamano = 20 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={TRAZO} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Llama de la racha — dos formas superpuestas, como en racha.html:137-138
 * (exterior cálida + interior clara). Reemplaza el emoji 🔥.
 */
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
      <Path d="M12 2c0 0 6.5 5.8 6.5 10.5a6.5 6.5 0 0 1-13 0C5.5 7.8 12 2 12 2z" fill={colorExterior} />
      <Path d="M12 12.5c0 0 3.2 2.8 3.2 5a3.2 3.2 0 0 1-6.4 0c0-2.2 3.2-5 3.2-5z" fill={colorInterior} />
    </Svg>
  );
}

/** Ancla — identidad de la app. Se usa en la cabecera y como base del ícono. */
export function IconoAncla({ color, tamano = 24 }: PropsIcono) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={4.5} r={2.5} stroke={color} strokeWidth={TRAZO} />
      <Path d="M12 7v14" stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
      <Path d="M8 11h8" stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
      <Path d="M12 21c-4 0-7-3-7-7" stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
      <Path d="M12 21c4 0 7-3 7-7" stroke={color} strokeWidth={TRAZO} strokeLinecap="round" />
    </Svg>
  );
}
