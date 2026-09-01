import { useState, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router, usePathname } from 'expo-router';
import { MorphIcon } from 'morphicons/react-native';
import type { Categoria } from '../db/tipos';
import { useTema } from '../stores/tema';
import { categoriaDeRuta, rutaCrear } from './fab-logic';

/**
 * FAB polimórfico global (estilo iOS 17+):
 *   - Tap corto: si hay categoría activa → ir a crear de esa categoría.
 *                si NO hay categoría (Inicio/Editar/Stats/Ajustes) → abrir menú.
 *   - Long press: siempre abre el menú radial de 4 categorías.
 *   - Menú: muestra 4 chips (Colgadero/Naipes/Listas/Números) con MorphIcon
 *           + etiqueta. Tap en un chip → ir a `/crear/<categoria>`.
 *
 * UX:
 *   - Spring feedback en tap (escala 0.92 → 1).
 *   - Menú aparece con fade + slide-up (250ms).
 *   - Backdrop táctil cierra el menú sin navegar.
 *   - Detecta categoría también en `/crear/<cat>` para coherencia.
 */

const OPCIONES_RADIAL: Array<{
  id: Categoria;
  etiqueta: string;
  icono: string;
  ruta: string;
}> = [
  { id: 'colgadero', etiqueta: 'Colgadero', icono: 'lucide-link', ruta: rutaCrear('colgadero') },
  { id: 'naipe', etiqueta: 'Naipes', icono: 'lucide-spade', ruta: rutaCrear('naipe') },
  { id: 'lista_item', etiqueta: 'Listas', icono: 'lucide-list', ruta: rutaCrear('lista_item') },
  { id: 'numero', etiqueta: 'Números', icono: 'lucide-hash', ruta: rutaCrear('numero') },
];

export function FAB() {
  const { colores: t } = useTema();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const escalaFab = useSharedValue(1);
  const opacidadMenu = useSharedValue(0);
  const translateMenu = useSharedValue(20);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressDisparadoRef = useRef(false);

  const categoriaActual = categoriaDeRuta(pathname);

  const onPressIn = useCallback(() => {
    escalaFab.value = withSpring(0.9, { damping: 18, stiffness: 280 });
  }, [escalaFab]);
  const onPressOut = useCallback(() => {
    escalaFab.value = withSpring(1, { damping: 18, stiffness: 280 });
  }, [escalaFab]);

  const estiloFab = useAnimatedStyle(() => ({
    transform: [{ scale: escalaFab.value }],
  }));

  const estiloMenu = useAnimatedStyle(() => ({
    opacity: opacidadMenu.value,
    transform: [{ translateY: translateMenu.value }],
  }));

  const abrirMenu = useCallback(() => {
    setMenuAbierto(true);
    opacidadMenu.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    translateMenu.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [opacidadMenu, translateMenu]);

  const cerrarMenu = useCallback(() => {
    opacidadMenu.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) });
    translateMenu.value = withTiming(
      20,
      { duration: 150, easing: Easing.in(Easing.cubic) },
      () => {
        setMenuAbierto(false);
      },
    );
  }, [opacidadMenu, translateMenu]);

  const irACrear = useCallback(() => {
    if (!categoriaActual) return;
    // /numeros/nuevo tiene preview en tiempo real (no se puede
    // reemplazar por /crear/numero genérico sin perder UX).
    if (categoriaActual === 'numero') {
      router.push('/numeros/nuevo' as never);
      return;
    }
    router.push(rutaCrear(categoriaActual) as never);
  }, [categoriaActual]);

  /**
   * Estrategia para distinguir tap de long-press sin race conditions:
   * 1. En `onLongPress`: marcamos `longPressDisparadoRef = true` y abrimos menú.
   * 2. En `onPress`: si NO se disparó long-press → es tap → ir a crear o mostrar menú.
   * El Pressable de RN NO llama `onPress` cuando se dispara `onLongPress`,
   * así que este guard es redundante pero defensivo.
   */
  const onPressHandler = useCallback(() => {
    if (longPressDisparadoRef.current) {
      longPressDisparadoRef.current = false;
      return;
    }
    if (categoriaActual) {
      irACrear();
    } else {
      abrirMenu();
    }
  }, [categoriaActual, irACrear, abrirMenu]);

  const onLongPressHandler = useCallback(() => {
    longPressDisparadoRef.current = true;
    abrirMenu();
  }, [abrirMenu]);

  const elegirCategoria = useCallback((ruta: string) => {
    cerrarMenu();
    router.push(ruta as never);
  }, [cerrarMenu]);

  return (
    <>
      {menuAbierto && (
        <View style={estilos.overlay} pointerEvents="box-none">
          <Pressable style={estilos.overlayToque} onPress={cerrarMenu} />
          <Animated.View
            style={[
              estilos.menuRadial,
              estiloMenu,
              { backgroundColor: t.card, borderColor: t.borderMuted ?? t.inkMuted },
            ]}
          >
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
                <View style={[estilos.iconoWrap, { borderColor: t.borderMuted ?? t.inkMuted }]}>
                  <MorphIcon icon={op.icono} size={18} color={t.ink} />
                </View>
                <Text style={[estilos.opcionEtiqueta, { color: t.ink }]}>{op.etiqueta}</Text>
              </Pressable>
            ))}
          </Animated.View>
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
          onPress={onPressHandler}
          onLongPress={onLongPressHandler}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          delayLongPress={350}
          accessibilityLabel="Crear nuevo elemento"
          accessibilityHint={
            categoriaActual
              ? `Abre creación de ${categoriaActual}. Mantén presionado para elegir otra categoría.`
              : 'Mantén presionado para elegir categoría.'
          }
          hitSlop={8}
          style={estilos.fabToque}
        >
          <MorphIcon icon="lucide-plus" size={28} color={t.inkOnAccent} />
        </Pressable>
      </Animated.View>
    </>
  );
}

const estilos = StyleSheet.create({
  fabContenedor: {
    position: 'absolute',
    right: 18,
    bottom: 110, // encima del tab bar flotante
    width: 56,
    height: 56,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  fabToque: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 90,
  },
  overlayToque: { flex: 1 },
  menuRadial: {
    position: 'absolute',
    right: 18,
    bottom: 178,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  menuTitulo: {
    fontSize: 11,
    fontWeight: '700',
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
  iconoWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionEtiqueta: { fontSize: 14, fontWeight: '600' },
});
