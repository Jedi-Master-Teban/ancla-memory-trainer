import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../stores/tema';

const DURACION_MS = 3000;

interface Props {
  /** Cambia por tarjeta (p. ej. el id) — reinicia la pausa. */
  clave: string | number;
  /** Duración de la pausa. Configurable en Ajustes; default 3 s. */
  duracionMs?: number;
  children: ReactNode;
}

/**
 * Pausa deliberada de visualización mental (§10, modulos/02-colgadero.md §2):
 * oculta los hijos (el botón "Ver respuesta") hasta pasada la pausa desde que
 * cambió `clave`. No es decoración: fuerza el recuerdo activo.
 *
 * Durante la pausa se mantienen montados pero invisibles (`opacity: 0` +
 * `pointerEvents="none"`) en vez de devolver `null`. Devolver `null` no creaba
 * vista alguna, así que el `gap` del contenedor centrado también desaparecía y
 * la columna daba dos saltos por tarjeta: uno al avanzar y otro al aparecer el
 * botón. Ocupar el espacio desde el principio lo elimina, sin debilitar la
 * pausa: el botón sigue sin poder tocarse antes de tiempo.
 *
 * ── Fase 8 v2 (DESIGN.md §5.4) ─────────────────────────────────────────────
 *
 * La pausa v1 era invisible: dos segundos en los que la pantalla no hacía
 * nada. Un usuario no distingue «espera a propósito» de «se colgó», y el
 * ejercicio de visualización se perdía. Ahora la pausa tiene cuerpo: un anillo
 * que respira, la cuenta 3·2·1 y la instrucción escrita. Es un beat, no una
 * espera — y de paso el conteo le da al usuario una referencia de cuánto
 * tiempo se espera que dedique a visualizar.
 *
 * El anillo respira a 2.2 s, distinto del segundero (1 s), a propósito: si
 * ambos latieran al mismo ritmo la pausa se sentiría como un cronómetro, que
 * es exactamente el registro contrario al que se busca.
 */
export function PausaVisualizacion({ clave, duracionMs = DURACION_MS, children }: Props) {
  const { colores: t, tipografia } = useTema();
  const [lista, setLista] = useState(false);
  const [restante, setRestante] = useState(Math.ceil(duracionMs / 1000));
  const respiracion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLista(false);
    setRestante(Math.ceil(duracionMs / 1000));

    const fin = setTimeout(() => setLista(true), duracionMs);
    const tic = setInterval(() => {
      setRestante((r) => Math.max(0, r - 1));
    }, 1000);

    return () => {
      clearTimeout(fin);
      clearInterval(tic);
    };
  }, [clave, duracionMs]);

  useEffect(() => {
    let vivo = true;
    let bucle: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (!vivo || reducir) return;
      bucle = Animated.loop(
        Animated.sequence([
          Animated.timing(respiracion, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(respiracion, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      bucle.start();
    });

    return () => {
      vivo = false;
      bucle?.stop();
    };
  }, [respiracion]);

  const estiloHalo = {
    opacity: respiracion.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] }),
    transform: [{ scale: respiracion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }],
  };

  return (
    <View style={estilos.contenedor}>
      {!lista && (
        <View style={estilos.pausa} accessibilityLiveRegion="polite">
          <View style={estilos.anillo}>
            <Animated.View
              pointerEvents="none"
              style={[estilos.halo, estiloHalo, { backgroundColor: t.flameSoft }]}
            />
            <View style={[estilos.aro, { borderColor: t.accent1 }]} />
            <Text style={[estilos.cuenta, { color: t.accent1, fontFamily: tipografia.display }]}>
              {Math.max(1, restante)}
            </Text>
          </View>
          <Text style={[estilos.instruccion, { color: t.inkMuted, fontFamily: tipografia.body }]}>
            Visualiza la imagen antes de mirar
          </Text>
        </View>
      )}

      <View style={{ opacity: lista ? 1 : 0 }} pointerEvents={lista ? 'auto' : 'none'}>
        {children}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'stretch' },
  pausa: { alignItems: 'center', gap: 16, paddingBottom: 16 },
  anillo: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 58, height: 58, borderRadius: 999 },
  aro: { position: 'absolute', width: 40, height: 40, borderRadius: 999, borderWidth: 1.5, opacity: 0.45 },
  cuenta: { fontSize: 19, fontWeight: '800' },
  instruccion: { fontSize: 12.5, letterSpacing: 0.2 },
});
