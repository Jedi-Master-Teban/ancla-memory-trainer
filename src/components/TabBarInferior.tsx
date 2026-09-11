import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MorphIcon } from 'morphicons/react-native';
import type { IconNode } from 'morphicons/react-native';
import { useTema } from '../stores/tema';
import { esTemaOscuro, recetaForma } from '../tema/colores';
import { IconoAncla } from './iconos';
import { TABS, type TabId } from './tabs';

export type { TabId };

/**
 * Isla de navegación — Fase 8 v2 (DESIGN.md §5.1).
 *
 * Cambia respecto a v1 en tres cosas, y las tres eran quejas reales:
 *
 * 1. ESTILO B (iOS 26): solo la pestaña ACTIVA lleva etiqueta y se expande a
 *    104 px; las otras tres quedan en 48 px, solo ícono. Antes las cuatro
 *    llevaban etiqueta de 10 px, que a ese tamaño no se lee y llenaba la isla
 *    de ruido.
 * 2. REPASO RÁPIDO EN LÍNEA: el acceso a la sesión es el tercer elemento de la
 *    misma fila, 46×46, al mismo alto que las pestañas. Antes era un botón
 *    elevado que rompía la línea de la isla y le sumaba 54 px de alto. Resalta
 *    por color y sombra, no por sobresalir: la pastilla activa es un relleno
 *    translúcido y este es sólido, así que son dos niveles de énfasis distintos
 *    y no compiten.
 * 3. VIDRIO DE VERDAD: `glass` + `glassBorder` como hairline superior. El
 *    `${t.card}E6` de v1 era casi opaco y por eso se veía "mal hecha".
 *
 * `justifyContent: 'center'` en la fila es obligatorio: el ancho total cambia
 * al cambiar de pestaña, y sin centrar, el conjunto se desplaza a un lado.
 */

const ANCHO_ACTIVA = 104;
const ANCHO_INACTIVA = 48;
const LADO_REPASO = 46;
const DURACION_ANCHO = 380;
/** La misma curva de todo el rediseño (DESIGN.md §6). */
const CURVA = Easing.bezier(0.2, 0.9, 0.25, 1);

interface Props {
  activa: TabId;
  onChange: (tab: TabId) => void;
  /** Tap en el cuadro naranja: abre la sesión de repaso. */
  onRepaso: () => void;
  /** Cuántas tarjetas vencidas hay — solo para el `accessibilityHint`. */
  pendientes?: number;
  zIndex?: number;
}

function Pestana({
  etiqueta,
  icono,
  activa,
  onPress,
}: {
  etiqueta: string;
  icono: IconNode;
  activa: boolean;
  onPress: () => void;
}) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const ancho = useSharedValue(activa ? ANCHO_ACTIVA : ANCHO_INACTIVA);

  useEffect(() => {
    ancho.value = withTiming(activa ? ANCHO_ACTIVA : ANCHO_INACTIVA, {
      duration: DURACION_ANCHO,
      easing: CURVA,
    });
  }, [activa, ancho]);

  const estiloAncho = useAnimatedStyle(() => ({ width: ancho.value }));
  const color = activa ? t.accent1 : t.inkMuted;

  return (
    <Animated.View style={estiloAncho}>
      <Pressable
        onPress={onPress}
        hitSlop={6}
        accessibilityRole="tab"
        accessibilityState={{ selected: activa }}
        accessibilityLabel={etiqueta}
        style={({ pressed }) => [
          estilos.pestana,
          {
            borderRadius: forma.rIslaPestana,
            backgroundColor: activa ? t.pill : 'transparent',
          },
          pressed && estilos.presionado,
        ]}
      >
        <MorphIcon icon={icono} size={21} color={color} strokeWidth={1.9} reducedMotion="user" />
        {/* La etiqueta solo se monta en la activa: así no hay que animar
            opacidad ni recortar texto mientras el ancho interpola. */}
        {activa && (
          <Text
            numberOfLines={1}
            style={[estilos.etiqueta, { color, fontFamily: tipografia.display }]}
          >
            {etiqueta}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function TabBarInferior({ activa, onChange, onRepaso, pendientes, zIndex = 80 }: Props) {
  const { colores: t, tema } = useTema();
  const forma = recetaForma(tema);
  const translateY = useSharedValue(0);
  const opacidad = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    opacidad.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [translateY, opacidad]);

  const estiloContenedor = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacidad.value,
  }));

  // Inicio · Editar · [repaso] · Stats · Ajustes
  const izquierda = TABS.slice(0, 2);
  const derecha = TABS.slice(2);

  return (
    <Animated.View
      style={[estilos.contenedor, estiloContenedor, { zIndex }]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={26}
        tint={esTemaOscuro(tema) ? 'dark' : 'light'}
        style={[
          estilos.isla,
          forma.sombraCard,
          {
            borderRadius: forma.rIsla,
            // El color de vidrio NO va aquí: lo pinta `capaVidrio` más abajo.
            // En web, expo-blur aplica sus estilos DESPUÉS de los nuestros
            // (BlurView.web.tsx: `style={[style, blurStyle]}`, al revés que en
            // nativo), así que su backgroundColor calculado pisaba `t.glass` y
            // la isla se veía como un gris casi transparente en vez del tono
            // del tema — 0.20 de alfa en lugar de 0.66–0.86.
            borderColor: t.glassBorder,
            // La isla siempre proyecta sombra, incluso en Papel, porque flota.
            shadowColor: '#141010',
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.28,
            shadowRadius: 34,
            elevation: 10,
          },
        ]}
      >
        {/* Capa de vidrio: encima del desenfoque, debajo del contenido. Como es
            un View normal, el token del tema manda igual en web y en nativo. */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: t.glass }]}
        />

        {izquierda.map((tab) => (
          <Pestana
            key={tab.id}
            etiqueta={tab.etiqueta}
            icono={tab.icono}
            activa={tab.id === activa}
            onPress={() => onChange(tab.id)}
          />
        ))}

        <Pressable
          onPress={onRepaso}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Repaso rápido"
          accessibilityHint={
            pendientes && pendientes > 0
              ? `Empieza una sesión con ${pendientes} tarjetas vencidas.`
              : 'Empieza una sesión de práctica libre.'
          }
          style={({ pressed }) => [
            estilos.repaso,
            {
              borderRadius: forma.rIslaPestana,
              backgroundColor: t.accent1,
              shadowColor: t.ctaGlow,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.55,
              shadowRadius: 14,
              elevation: 6,
            },
            pressed && estilos.repasoPresionado,
          ]}
        >
          <IconoAncla color={t.inkOnAccent} tamano={22} trazo={2.3} />
        </Pressable>

        {derecha.map((tab) => (
          <Pestana
            key={tab.id}
            etiqueta={tab.etiqueta}
            icono={tab.icono}
            activa={tab.id === activa}
            onPress={() => onChange(tab.id)}
          />
        ))}
      </BlurView>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 26,
    alignItems: 'center',
  },
  isla: {
    flexDirection: 'row',
    alignItems: 'stretch',
    // Crítico: el ancho total cambia al cambiar de pestaña. Sin centrar, el
    // conjunto se desplaza hacia un lado y parece roto.
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 7,
    gap: 2,
    height: 64,
    overflow: 'hidden',
  },
  pestana: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    overflow: 'hidden',
  },
  presionado: { opacity: 0.6 },
  etiqueta: { fontSize: 12.5, fontWeight: '800' },
  repaso: {
    width: LADO_REPASO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repasoPresionado: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
