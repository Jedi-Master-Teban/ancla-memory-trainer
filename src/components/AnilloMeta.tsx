import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTema } from '../stores/tema';

/**
 * Anillo de meta diaria (DESIGN.md §5.2).
 *
 * Reemplaza la barra de progreso del dashboard v1. Una barra dice "vas por
 * aquí"; un anillo con el número dentro dice "12 de 20" de un vistazo y sin
 * leer, que es la única pregunta que el dashboard tiene que responder.
 *
 * `strokeDasharray` = 2πr = 257.6 para r=41. El offset va de 257.6 (vacío) a 0
 * (completo). `useNativeDriver: false` es obligatorio: se anima una prop de
 * SVG, no una transformación de la vista.
 */

const R = 41;
const LADO = 96;
const GROSOR = 9;
const CIRCUNFERENCIA = 2 * Math.PI * R; // 257.6

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

interface Props {
  hoy: number;
  meta: number;
}

export function AnilloMeta({ hoy, meta }: Props) {
  const { colores: t, tipografia } = useTema();
  const progreso = useRef(new Animated.Value(0)).current;
  const fraccion = meta > 0 ? Math.min(1, hoy / meta) : 0;

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: fraccion,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [fraccion, progreso]);

  const offset = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUNFERENCIA, 0],
  });

  return (
    <View
      style={estilos.contenedor}
      accessibilityRole="progressbar"
      accessibilityLabel={`${hoy} de ${meta} tarjetas hoy`}
      accessibilityValue={{ min: 0, max: meta, now: hoy }}
    >
      <Svg width={LADO} height={LADO} viewBox={`0 0 ${LADO} ${LADO}`}>
        <Circle cx={LADO / 2} cy={LADO / 2} r={R} fill="none" stroke={t.track} strokeWidth={GROSOR} />
        <CirculoAnimado
          cx={LADO / 2}
          cy={LADO / 2}
          r={R}
          fill="none"
          stroke={t.accent1}
          strokeWidth={GROSOR}
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={offset}
          // El anillo arranca arriba, no a las 3 en punto.
          transform={`rotate(-90 ${LADO / 2} ${LADO / 2})`}
        />
      </Svg>
      <View style={estilos.centro} pointerEvents="none">
        <Text style={[estilos.hoy, { color: t.ink, fontFamily: tipografia.display }]}>{hoy}</Text>
        <Text style={[estilos.meta, { color: t.inkMuted, fontFamily: tipografia.body }]}>de {meta}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { width: LADO, height: LADO },
  centro: { position: 'absolute', width: LADO, height: LADO, alignItems: 'center', justifyContent: 'center' },
  hoy: { fontSize: 27, fontWeight: '800', lineHeight: 30 },
  meta: { fontSize: 11, fontWeight: '600' },
});
