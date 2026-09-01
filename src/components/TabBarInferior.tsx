import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTema } from '../stores/tema';
import { TABS, type TabId, type TabItem } from './tabs';

/**
 * Tab bar inferior con estética liquid glass. Las 4 vistas globales son:
 * Inicio (Repasar), Editar (categorías), Estadísticas, Ajustes.
 *
 * - BlurView al fondo simula el efecto liquid glass de iOS (intensity=80).
 * - Tab activa: pill con fondo accent @ 14% opacity + glow.
 * - Animación de escala 1.0 → 1.08 → 1.0 al activarse.
 *
 * El render se hace en app/_layout.tsx como overlay absoluto (no rompe el
 * Stack actual, solo flota encima del contenido). Las pantallas que NO
 * quieran tab bar (ej. estudiar/flash/reverso en drill-down) deben usar
 * `useOcultarTabBar(true)` desde `src/stores/ui` — implementado en Fase
 * 2.1.b (futuro).
 */
export type { TabId } from './tabs';
export { TABS } from './tabs';

interface Props {
  activa: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBarInferior({ activa, onChange }: Props) {
  const { colores: t } = useTema();

  return (
    <View pointerEvents="box-none" style={estilos.contenedor}>
      <BlurView
        intensity={80}
        tint={t.bg === '#1f160f' || t.bg === '#141433' ? 'dark' : 'light'}
        style={[
          estilos.barra,
          {
            backgroundColor: t.bg === '#1f160f' || t.bg === '#141433'
              ? 'rgba(12,13,20,0.72)'
              : 'rgba(250,249,247,0.75)',
            borderTopColor: t.bg === '#1f160f' || t.bg === '#141433'
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {TABS.map((tab) => (
          <TabBoton key={tab.id} tab={tab} activa={activa === tab.id} onPress={() => onChange(tab.id)} />
        ))}
      </BlurView>
    </View>
  );
}

interface TabBotonProps {
  tab: TabItem;
  activa: boolean;
  onPress: () => void;
}

function TabBoton({ tab, activa, onPress }: TabBotonProps) {
  const { colores: t } = useTema();
  const escala = useSharedValue(1);

  useEffect(() => {
    if (activa) {
      escala.value = withTiming(1.08, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else {
      escala.value = withTiming(1, { duration: 180 });
    }
  }, [activa, escala]);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <Pressable onPress={onPress} style={estilos.boton}>
      <Animated.View
        style={[
          estilos.botonInterior,
          activa && { backgroundColor: `${t.accent1}24` },
          estiloAnimado,
        ]}
      >
        <Text style={[estilos.icono, { color: activa ? t.accent1 : t.inkMuted }]}>{tab.icono}</Text>
        <Text style={[estilos.etiqueta, { color: activa ? t.accent1 : t.inkMuted }]}>
          {tab.etiqueta}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  barra: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  boton: {
    flex: 1,
    alignItems: 'center',
  },
  botonInterior: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  icono: { fontSize: 22 },
  etiqueta: { fontSize: 11, fontWeight: '600' },
});
