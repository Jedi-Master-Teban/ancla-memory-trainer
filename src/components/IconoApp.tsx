import Svg, { G, Rect } from 'react-native-svg';

interface Props {
  /** Lado en px. 24, 44, 76 y 168 son los tamaños del mockup 2b. */
  size?: number;
  /** Color del fondo del cuadro. Por defecto el naranja de marca. */
  fondo?: string;
  /** Color del glifo. */
  glifo?: string;
  /** false = solo el glifo, sin cuadro (encabezados, marcas de agua). */
  conFondo?: boolean;
  /** Radio del cuadro. Por defecto 22 % del lado (squircle de iOS). */
  radio?: number;
}

/** Naranja de marca. El ícono NO cambia con el tema (DESIGN.md §10). */
export const NARANJA_MARCA = '#FF6B35';

/**
 * Ícono de Ancla: dos eslabones enlazados en diagonal (DESIGN.md §10).
 *
 * Geometría exacta, en un lienzo de 100×100 girado −45° sobre su centro. Los
 * dos eslabones son el MISMO rectángulo redondeado (46×30, r15), desplazado
 * 38 en x; de ahí la simetría del glifo:
 *
 *   1. eslabón B   x=46 y=35 w=46 h=30 r=15   trazo = `trazo`      (queda debajo)
 *   2. corte       x=8  y=35 w=46 h=30 r=15   trazo = `trazo + 7`  (color del FONDO)
 *   3. eslabón A   x=8  y=35 w=46 h=30 r=15   trazo = `trazo`      (queda encima)
 *
 * El paso 2 es lo que hace el enlace: borra B justo donde A lo cruza. Por eso
 * el orden de los tres nodos no se puede cambiar, y por eso el ícono necesita
 * saber su color de fondo.
 *
 * El grosor del trazo NO escala proporcionalmente: crece al reducir, o a 24 px
 * el hueco interior se cierra y los dos eslabones se ven como una pastilla.
 */
export function IconoApp({ size = 76, fondo = NARANJA_MARCA, glifo = '#FFFFFF', conFondo = true, radio }: Props) {
  const trazo = grosorDeTrazo(size);
  const corte = trazo + 7;
  const r = radio ?? Math.round(size * 0.22);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {conFondo ? <Rect x={0} y={0} width={100} height={100} rx={(r / size) * 100} fill={fondo} /> : null}
      <G rotation={-45} origin="50, 50">
        <Rect x={46} y={35} width={46} height={30} rx={15} stroke={glifo} strokeWidth={trazo} fill="none" />
        <Rect x={8} y={35} width={46} height={30} rx={15} stroke={conFondo ? fondo : 'transparent'} strokeWidth={corte} fill="none" />
        <Rect x={8} y={35} width={46} height={30} rx={15} stroke={glifo} strokeWidth={trazo} fill="none" />
      </G>
    </Svg>
  );
}

/** 168→8 · 76→8 · 44→9 · 24→11, los cuatro valores del mockup 2b. */
export function grosorDeTrazo(size: number): number {
  if (size >= 64) return 8;
  if (size >= 36) return 9;
  return 11;
}
