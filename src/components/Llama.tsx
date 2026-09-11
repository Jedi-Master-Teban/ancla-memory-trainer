import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTema } from '../stores/tema';
import { PATH_LLAMA_NUCLEO, PATH_LLAMA_SILUETA } from './iconos';

/**
 * La llama de la racha — Fase 8 v2 (DESIGN.md §5.9).
 *
 * El error de la versión anterior no era el dibujo: era el movimiento. Escalar
 * la llama entera de forma uniforme (`scale: 1 → 1.12`) late como un corazón,
 * no ondea como una llama. Una llama real hace tres cosas a la vez, y a ritmos
 * distintos:
 *
 *   - la SILUETA ondea desde su base — escala asimétrica (se estira a lo alto
 *     y adelgaza) más una inclinación mínima, con el origen en el 88 % de la
 *     altura, que es donde la llama se agarra a su mecha;
 *   - el NÚCLEO parpadea al doble de velocidad y cambia de opacidad;
 *   - el HALO respira a su propio ritmo, más lento que las dos.
 *
 * Los tres periodos son distintos y no múltiplos entre sí (2.9 / 1.25 / 2.4 s),
 * así que el bucle no vuelve a alinearse en la práctica y no se siente
 * repetitivo. Eso — la desincronización — es lo que la hace ver viva.
 *
 * La silueta lleva degradado vertical (`flameOuterStart` arriba →
 * `flameOuterEnd` abajo). En Papel los dos tokens son el mismo color y el
 * degradado se resuelve como plano, que es justo lo que ese tema quiere.
 */

type EstadoLlama = 'activa' | 'en_riesgo' | 'rota';

interface Props {
  tamano?: number;
  /** 'en_riesgo' baja la opacidad; 'rota' apaga el movimiento y el halo. */
  estado?: EstadoLlama;
  /** Halo detrás. Apágalo cuando la llama va dentro de una píldora pequeña. */
  conHalo?: boolean;
}

const PERIODO_SILUETA = 2900;
const PERIODO_NUCLEO = 1250;
const PERIODO_HALO = 2400;

/** Un bucle 0→1→0 sobre `valor`, con la duración dada. */
function bucle(valor: Animated.Value, duracion: number) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(valor, {
        toValue: 1,
        duration: duracion,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(valor, {
        toValue: 0,
        duration: duracion,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  );
}

export function Llama({ tamano = 64, estado = 'activa', conHalo = true }: Props) {
  const { colores: t } = useTema();
  const silueta = useRef(new Animated.Value(0)).current;
  const nucleo = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const reducirRef = useRef(false);

  useEffect(() => {
    let vivo = true;
    const animaciones: Animated.CompositeAnimation[] = [];

    // Reducir Movimiento: la llama se queda quieta. Sigue siendo la misma
    // forma y el mismo color, solo sin bucles — mismo criterio que ya usa
    // IndicadorRacha con reducedMotion="user".
    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (!vivo) return;
      reducirRef.current = reducir;
      if (reducir || estado === 'rota') {
        silueta.setValue(0);
        nucleo.setValue(0);
        halo.setValue(0);
        return;
      }
      animaciones.push(bucle(silueta, PERIODO_SILUETA / 2));
      animaciones.push(bucle(nucleo, PERIODO_NUCLEO / 2));
      animaciones.push(bucle(halo, PERIODO_HALO / 2));
      animaciones.forEach((a) => a.start());
    });

    return () => {
      vivo = false;
      animaciones.forEach((a) => a.stop());
    };
  }, [estado, silueta, nucleo, halo]);

  const estiloSilueta = {
    transform: [
      { scaleX: silueta.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.97, 1.03] }) },
      { scaleY: silueta.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 0.97] }) },
      {
        rotate: silueta.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ['0deg', '-1.4deg', '1deg'],
        }),
      },
    ],
  };

  const estiloNucleo = {
    opacity:
      estado === 'rota'
        ? 0.5
        : nucleo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.95, 1, 0.82] }),
    transform: [
      { scaleX: nucleo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.9, 1.06] }) },
      { scaleY: nucleo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 0.94] }) },
    ],
  };

  const estiloHalo = {
    opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] }),
    transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }],
  };

  const colorArriba = estado === 'rota' ? t.inkMuted : t.flameOuterStart;
  const colorAbajo = estado === 'rota' ? t.inkMuted : t.flameOuterEnd;
  const ladoHalo = Math.round(tamano * 1.65);
  // `id` único por instancia para no colisionar cuando hay dos llamas montadas
  // (dashboard + resumen conviven durante la transición de pantalla).
  const idGradiente = useRef(`llama-${Math.random().toString(36).slice(2, 8)}`).current;

  return (
    <View
      style={[estilos.contenedor, { width: ladoHalo, height: ladoHalo }]}
      accessibilityRole="image"
      accessibilityLabel={estado === 'rota' ? 'racha rota' : 'llama de racha activa'}
    >
      {conHalo && estado !== 'rota' && (
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.halo,
            estiloHalo,
            { width: ladoHalo, height: ladoHalo, backgroundColor: t.flameSoft },
          ]}
        />
      )}
      <Animated.View
        style={[
          estiloSilueta,
          // La base de la llama, no su centro: es lo que convierte el
          // estiramiento en un ondeo.
          { transformOrigin: '50% 88%' },
          estado === 'en_riesgo' && { opacity: 0.8 },
        ]}
      >
        <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id={idGradiente} x1="12" y1="2" x2="12" y2="21" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={colorArriba} />
              <Stop offset="1" stopColor={colorAbajo} />
            </LinearGradient>
          </Defs>
          <Path d={PATH_LLAMA_SILUETA} fill={`url(#${idGradiente})`} />
        </Svg>
        <Animated.View
          style={[estilos.nucleo, estiloNucleo, { transformOrigin: '50% 95%' }]}
          pointerEvents="none"
        >
          <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
            <Path d={PATH_LLAMA_NUCLEO} fill={estado === 'rota' ? t.inkMuted : t.flameInner} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', borderRadius: 999 },
  nucleo: { position: 'absolute', left: 0, top: 0 },
});
