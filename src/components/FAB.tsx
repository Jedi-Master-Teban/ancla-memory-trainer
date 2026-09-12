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
import type { IconNode } from 'morphicons/react-native';
import { Hash, Link, List, Plus, Spade } from 'lucide';
import type { Categoria } from '../db/tipos';
import { useTema } from '../stores/tema';
import { recetaForma, type TemaId, type TokensColor } from '../tema/colores';
import { categoriaDeRuta, debeMostrarFab, rutaCrear } from './fab-logic';

/**
 * FAB polimórfico global.
 *   - Tap corto: con categoría activa → crear en esa categoría.
 *                sin categoría (Editar/…) → abrir el menú.
 *   - Long press: siempre abre el menú de 4 categorías.
 *
 * Fase 9 (DESIGN.md §11) — el comportamiento no cambia; cambia la forma, que
 * antes era la misma en los tres temas (radio 18 y sombra naranja siempre) y
 * en Papel y Tinta se veía como un botón de otra app:
 *
 *   soft   → cuadrado redondeado r19, sombra del color del acento
 *   arcade → círculo (r999) con halo `ctaGlow`, sin sombra proyectada
 *   papel  → cuadrado casi recto r3, plano, con filete de 1 px
 *
 * Y añade lo que faltaba para que el menú se entienda: el «+» gira 45° hasta
 * volverse «✕» mientras el menú está abierto, y el fondo se atenúa.
 */

const OPCIONES_RADIAL: Array<{ id: Categoria; etiqueta: string; icono: IconNode; ruta: string }> = [
  { id: 'colgadero', etiqueta: 'Colgadero', icono: Link, ruta: rutaCrear('colgadero') },
  { id: 'naipe', etiqueta: 'Naipes', icono: Spade, ruta: rutaCrear('naipe') },
  { id: 'lista_item', etiqueta: 'Listas', icono: List, ruta: rutaCrear('lista_item') },
  { id: 'numero', etiqueta: 'Números', icono: Hash, ruta: rutaCrear('numero') },
];

const LADO = 56;

/** Forma del botón por tema — DESIGN.md §11, tabla 1. */
function formaFab(tema: TemaId, t: TokensColor) {
  if (tema === 'arcade') {
    return {
      borderRadius: 999,
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: t.ctaGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 26,
      elevation: 0,
    } as const;
  }
  if (tema === 'papel') {
    return {
      borderRadius: 3,
      borderWidth: 1,
      borderColor: t.ink,
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    } as const;
  }
  return {
    borderRadius: 19,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: t.accent1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  } as const;
}

export function FAB() {
  const { colores: t, tema } = useTema();
  const forma = recetaForma(tema);
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const escalaFab = useSharedValue(1);
  const giro = useSharedValue(0);
  const opacidadMenu = useSharedValue(0);
  const translateMenu = useSharedValue(20);
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

  const estiloGiro = useAnimatedStyle(() => ({
    transform: [{ rotate: `${giro.value}deg` }],
  }));

  const estiloMenu = useAnimatedStyle(() => ({
    opacity: opacidadMenu.value,
    transform: [{ translateY: translateMenu.value }],
  }));

  const estiloVelo = useAnimatedStyle(() => ({
    opacity: opacidadMenu.value * 0.28,
  }));

  const abrirMenu = useCallback(() => {
    setMenuAbierto(true);
    opacidadMenu.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    translateMenu.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
    giro.value = withTiming(45, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [opacidadMenu, translateMenu, giro]);

  const cerrarMenu = useCallback(() => {
    giro.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
    opacidadMenu.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) });
    translateMenu.value = withTiming(20, { duration: 150, easing: Easing.in(Easing.cubic) }, () => {
      setMenuAbierto(false);
    });
  }, [opacidadMenu, translateMenu, giro]);

  const irACrear = useCallback(() => {
    if (!categoriaActual) return;
    // /numeros/nuevo tiene preview en tiempo real (no se puede reemplazar por
    // /crear/numero genérico sin perder UX).
    if (categoriaActual === 'numero') {
      router.push('/numeros/nuevo' as never);
      return;
    }
    router.push(rutaCrear(categoriaActual) as never);
  }, [categoriaActual]);

  const onPressHandler = useCallback(() => {
    if (longPressDisparadoRef.current) {
      longPressDisparadoRef.current = false;
      return;
    }
    if (menuAbierto) {
      cerrarMenu();
      return;
    }
    if (categoriaActual) irACrear();
    else abrirMenu();
  }, [menuAbierto, cerrarMenu, categoriaActual, irACrear, abrirMenu]);

  const onLongPressHandler = useCallback(() => {
    longPressDisparadoRef.current = true;
    abrirMenu();
  }, [abrirMenu]);

  const elegirCategoria = useCallback(
    (ruta: string) => {
      cerrarMenu();
      router.push(ruta as never);
    },
    [cerrarMenu],
  );

  // Este return va DESPUÉS de todos los hooks: el FAB se monta en
  // app/_layout.tsx, fuera del <Stack>, y un return temprano cambiaba el
  // conteo de hooks en cada navegación (error #310, pantallas en blanco).
  if (!debeMostrarFab(pathname)) {
    return null;
  }

  const f = formaFab(tema, t);

  return (
    <>
      {menuAbierto && (
        <View style={estilos.overlay} pointerEvents="box-none">
          <Animated.View style={[estilos.velo, estiloVelo, { backgroundColor: t.ink }]} pointerEvents="none" />
          <Pressable style={estilos.overlayToque} onPress={cerrarMenu} />
          <Animated.View
            style={[
              estilos.menuRadial,
              estiloMenu,
              forma.sombraCard,
              { backgroundColor: t.card, borderColor: t.borderMuted ?? t.inkMuted, borderRadius: forma.rCard },
            ]}
          >
            <Text style={[estilos.menuTitulo, { color: t.inkMuted }]}>Crear en…</Text>
            {OPCIONES_RADIAL.map((op) => (
              <Pressable
                key={op.id}
                onPress={() => elegirCategoria(op.ruta)}
                style={({ pressed }) => [
                  estilos.opcionMenu,
                  { borderRadius: forma.rRow },
                  pressed && { backgroundColor: `${t.accent1}1A` },
                ]}
              >
                <View
                  style={[
                    estilos.iconoWrap,
                    { borderColor: t.borderMuted ?? t.inkMuted, borderRadius: forma.rIcon },
                  ]}
                >
                  <MorphIcon icon={op.icono} size={18} color={t.ink} />
                </View>
                <Text style={[estilos.opcionEtiqueta, { color: t.ink }]}>{op.etiqueta}</Text>
              </Pressable>
            ))}
          </Animated.View>
        </View>
      )}
      <Animated.View style={[estilos.fabContenedor, estiloFab, { backgroundColor: t.accent1 }, f]}>
        <Pressable
          onPress={onPressHandler}
          onLongPress={onLongPressHandler}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          delayLongPress={350}
          accessibilityLabel={menuAbierto ? 'Cerrar el menú de crear' : 'Crear nuevo elemento'}
          accessibilityHint={
            categoriaActual
              ? `Abre creación de ${categoriaActual}. Mantén presionado para elegir otra categoría.`
              : 'Mantén presionado para elegir categoría.'
          }
          hitSlop={8}
          style={estilos.fabToque}
        >
          <Animated.View style={estiloGiro}>
            <MorphIcon icon={Plus} size={26} color={t.inkOnAccent} />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </>
  );
}

const estilos = StyleSheet.create({
  fabContenedor: {
    position: 'absolute',
    right: 18,
    bottom: 110, // encima de la isla flotante
    width: LADO,
    height: LADO,
    zIndex: 100,
  },
  fabToque: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 90 },
  velo: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  overlayToque: { flex: 1 },
  menuRadial: {
    position: 'absolute',
    right: 18,
    bottom: 178,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minWidth: 220,
  },
  menuTitulo: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.09,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 6,
  },
  opcionMenu: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 10 },
  iconoWrap: { width: 32, height: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  opcionEtiqueta: { fontSize: 14, fontWeight: '700' },
});
