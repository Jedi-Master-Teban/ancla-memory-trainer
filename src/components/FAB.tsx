import { useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router, usePathname } from 'expo-router';
import type { Categoria } from '../db/tipos';
import { useTema } from '../stores/tema';
import { categoriaDeRuta } from './fab-logic';

/**
 * FAB polimórfico global. Detecta la categoría activa por la ruta actual:
 *   /colgadero     → tap: crear colgadero / long: menú radial
 *   /naipes        → tap: crear naipe / long: menú radial
 *   /listas        → tap: crear lista / long: menú radial
 *   /numeros       → tap: crear número / long: menú radial
 *   /              → long: menú radial (no hay categoría implícita)
 *
 * Menú radial muestra 4 chips: Colgadero / Naipes / Listas / Números.
 * El usuario mantiene el dedo y elige; al soltar sin elegir se cierra.
 */

const RUTA_CATEGORIA: Record<Categoria, '/colgadero' | '/naipes' | '/listas' | '/numeros'> = {
  colgadero: '/colgadero',
  naipe: '/naipes',
  lista_item: '/listas',
  numero: '/numeros',
};

const OPCIONES_RADIAL: Array<{ id: Categoria; etiqueta: string; icono: string; ruta: string }> = [
  { id: 'colgadero', etiqueta: 'Colgadero', icono: '🪢', ruta: '/colgadero' },
  { id: 'naipe', etiqueta: 'Naipes', icono: '🃏', ruta: '/naipes' },
  { id: 'lista_item', etiqueta: 'Listas', icono: '📋', ruta: '/listas' },
  { id: 'numero', etiqueta: 'Números', icono: '🔢', ruta: '/numeros' },
];

export function FAB() {
  const { colores: t } = useTema();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const escala = useSharedValue(1);

  const categoriaActual = categoriaDeRuta(pathname);

  const onPressIn = useCallback(() => {
    escala.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  }, [escala]);
  const onPressOut = useCallback(() => {
    escala.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [escala]);

  const estiloFab = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const irACrear = useCallback(() => {
    if (!categoriaActual) return;
    router.push(RUTA_CATEGORIA[categoriaActual]);
    setMenuAbierto(false);
  }, [categoriaActual]);

  const abrirMenu = useCallback(() => {
    setMenuAbierto(true);
  }, []);
  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
  }, []);

  const elegirCategoria = useCallback((ruta: string) => {
    router.push(ruta as never);
    setMenuAbierto(false);
  }, []);

  return (
    <>
      {menuAbierto && (
        <View style={estilos.overlay} pointerEvents="box-none">
          <Pressable style={estilos.overlayToque} onPress={cerrarMenu} />
          <View style={[estilos.menuRadial, { backgroundColor: t.card, borderColor: t.borderMuted ?? t.inkMuted }]}>
            <Text style={[estilos.menuTitulo, { color: t.inkMuted }]}>Crear en…</Text>
            {OPCIONES_RADIAL.map((op) => (
              <Pressable
                key={op.id}
                onPress={() => elegirCategoria(op.ruta)}
                style={({ pressed }) => [
                  estilos.opcionMenu,
                  pressed && { backgroundColor: `${t.accent1}1A` },
                ]}
              >
                <Text style={estilos.opcionIcono}>{op.icono}</Text>
                <Text style={[estilos.opcionEtiqueta, { color: t.ink }]}>{op.etiqueta}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <Animated.View
        style={[
          estilos.fabContenedor,
          estiloFab,
          { backgroundColor: t.accent1, shadowColor: t.accent1 },
        ]}
      >
        <Pressable
          onPress={categoriaActual ? irACrear : abrirMenu}
          onLongPress={abrirMenu}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          delayLongPress={350}
          accessibilityLabel="Crear nuevo elemento"
          style={estilos.fabToque}
        >
          <Text style={[estilos.fabIcono, { color: t.inkOnAccent }]}>+</Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const estilos = StyleSheet.create({
  fabContenedor: {
    position: 'absolute',
    right: 18,
    bottom: 96, // encima del tab bar
    width: 56,
    height: 56,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fabToque: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcono: { fontSize: 28, fontWeight: '300' },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  overlayToque: { flex: 1 },
  menuRadial: {
    position: 'absolute',
    right: 18,
    bottom: 168,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  menuTitulo: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 6,
  },
  opcionMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  opcionIcono: { fontSize: 18 },
  opcionEtiqueta: { fontSize: 14, fontWeight: '600' },
});
