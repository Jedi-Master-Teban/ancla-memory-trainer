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
import { useTema } from '../stores/tema';
import { TABS, type TabId } from './tabs';

export type { TabId };

/**
 * TabBar inferior estilo iOS 17+: pill flotante centrada, no abarca
 * todo el ancho. BlurView con tinte del tema. Íconos MorphIcons
 * vectoriales (no emojis). Animación slide-up al montar y slide-down
 * al ocultar.
 *
 * - position: absolute, centrado horizontal con margen
 * - borderRadius grande (estilo pill)
 * - sombra suave
 * - ícono + etiqueta cambian color según activa
 */
interface Props {
  activa: TabId;
  onChange: (tab: TabId) => void;
  /** Z-index para casos donde hay elementos superpuestos (FAB). */
  zIndex?: number;
}

export function TabBarInferior({ activa, onChange, zIndex = 80 }: Props) {
  const { colores: t } = useTema();
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

  return (
    <Animated.View
      style={[estilos.contenedor, estiloContenedor, { zIndex }]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={80}
        tint={t.bg.startsWith('#1') || t.bg.startsWith('#0') ? 'dark' : 'light'}
        style={[
          estilos.pill,
          {
            backgroundColor: `${t.card}E6`, // 90% opacity
            borderColor: t.borderMuted ?? 'rgba(127,127,127,0.2)',
          },
        ]}
      >
        {TABS.map((tab) => {
          const esActiva = tab.id === activa;
          const color = esActiva ? t.accent1 : t.inkMuted;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              hitSlop={6}
              accessibilityRole="tab"
              accessibilityState={{ selected: esActiva }}
              accessibilityLabel={tab.etiqueta}
              style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
            >
              <MorphIcon icon={tab.icono} size={24} color={color} />
              <Text style={[estilos.etiqueta, { color }]}>{tab.etiqueta}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 280,
    maxWidth: 380,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 2,
  },
  botonPresionado: {
    opacity: 0.6,
  },
  etiqueta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
