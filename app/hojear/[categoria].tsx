import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { TarjetaHojear } from '../../src/components/TarjetaHojear';
import {
  extremosDeRiel,
  indiceInicial,
  indicesDePalo,
  ordenarParaHojear,
  progresoDeRiel,
} from '../../src/components/hojear-logic';
import { obtenerBD } from '../../src/db/client';
import { listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { Categoria, FilaTarjeta } from '../../src/db/tipos';
import { esCategoriaValida, REGISTRO } from '../../src/domain/categorias/registro';
import { ORDEN_PALOS } from '../../src/components/hojear-logic';
import { simboloDePalo } from '../../src/domain/fonetica/naipes';
import { useHojearStore } from '../../src/stores/hojear';
import { useTema } from '../../src/stores/tema';
import { useUIStore } from '../../src/stores/ui';
import { recetaForma } from '../../src/tema/colores';

/**
 * Modo Hojear (DESIGN.md §9.2) — carrusel a pantalla completa de todos los
 * elementos de una categoría, en orden natural.
 *
 * Lo que NO hace, a propósito: no crea sesión, no llama a `calificarTarjeta`,
 * no toca FSRS, no cuenta para la racha y no escribe nada en BD. Es una vista
 * de lectura; el repaso con calificación sigue siendo «Repasar».
 *
 * Geometría (mockup 2a, medida sobre 250 px de ancho y escalada por ancho de
 * pantalla): asomo de vecino 26 px, hueco 10 px, así que la tarjeta mide
 * `ancho - 72` y el paso del snap es `ancho - 62`.
 */

const ASOMO = 26;
const HUECO = 10;

export default function Hojear() {
  const params = useLocalSearchParams<{ categoria?: string; desde?: string }>();
  const categoria = (esCategoriaValida(params.categoria) ? params.categoria : 'colgadero') as Categoria;
  const { width } = useWindowDimensions();
  const { colores: t, tipografia, tema } = useTema();
  const forma = recetaForma(tema);

  const ANCHO = width - (ASOMO + HUECO) * 2;
  const PASO = ANCHO + HUECO;

  const [cargando, setCargando] = useState(true);
  const [tarjetas, setTarjetas] = useState<FilaTarjeta[]>([]);
  const [indice, setIndice] = useState(0);
  const [ocultos, setOcultos] = useState<Record<string, boolean>>({});
  const [sinMovimiento, setSinMovimiento] = useState(false);

  const listaRef = useRef<Animated.FlatList<FilaTarjeta>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const entrada = useRef(new Animated.Value(0)).current;

  const setPosicion = useHojearStore((s) => s.setPosicion);
  const guardado = useHojearStore((s) => s.posiciones[categoria]);
  const ocultarTabBar = useUIStore((s) => s.ocultarTabBar);
  const mostrarTabBar = useUIStore((s) => s.mostrarTabBar);

  const desde = params.desde ? Number(params.desde) : guardado;

  useEffect(() => {
    ocultarTabBar();
    return mostrarTabBar;
  }, [ocultarTabBar, mostrarTabBar]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSinMovimiento);
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const db = await obtenerBD();
      const mazo = await obtenerMazoPorCategoria(db, categoria);
      const filas = mazo ? await listarTarjetasPorMazo(db, mazo.id) : [];
      if (cancelado) return;
      const ordenadas = ordenarParaHojear(filas, categoria);
      setTarjetas(ordenadas);
      setIndice(indiceInicial(desde, ordenadas.length));
      setCargando(false);
      // Eje compartido en Z (DESIGN.md §6): la vista se acerca al entrar.
      Animated.timing(entrada, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  const extremos = useMemo(() => extremosDeRiel(tarjetas, categoria), [tarjetas, categoria]);
  const porPalo = useMemo(() => (categoria === 'naipe' ? indicesDePalo(tarjetas) : null), [tarjetas, categoria]);

  const onFinDeArrastre = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / PASO);
      setIndice(i);
      setPosicion(categoria, i);
    },
    [PASO, categoria, setPosicion],
  );

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({ length: PASO, offset: PASO * i, index: i }),
    [PASO],
  );

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (tarjetas.length === 0) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={{ color: t.inkMuted }}>No hay nada que hojear todavía.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: t.accent1, marginTop: 12 }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        estilos.raiz,
        { backgroundColor: t.bg },
        sinMovimiento
          ? null
          : { opacity: entrada, transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
      ]}
    >
      <View style={estilos.encabezado}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar">
          <Text style={[estilos.cerrar, { color: t.inkMuted }]}>✕</Text>
        </Pressable>
        <Text style={[estilos.titulo, { color: t.inkMuted }]}>
          {REGISTRO[categoria].etiquetaPlural.toUpperCase()}
        </Text>
        <Text style={[estilos.contador, { color: t.inkMuted }]}>
          {indice + 1}/{tarjetas.length}
        </Text>
      </View>

      {porPalo ? (
        <View style={[estilos.palos, { backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]}>
          {ORDEN_PALOS.map((palo) => {
            const desdeIndice = porPalo[palo];
            const activo = desdeIndice >= 0 && indice >= desdeIndice && (ORDEN_PALOS.indexOf(palo) === 3 || indice < (porPalo[ORDEN_PALOS[ORDEN_PALOS.indexOf(palo) + 1]] ?? tarjetas.length));
            const rojo = palo === 'diamantes' || palo === 'corazones';
            return (
              <Pressable
                key={palo}
                disabled={desdeIndice < 0}
                onPress={() => {
                  listaRef.current?.scrollToIndex({ index: desdeIndice, animated: true });
                  setIndice(desdeIndice);
                  setPosicion(categoria, desdeIndice);
                }}
                style={[
                  estilos.palo,
                  { borderRadius: Math.max(forma.rIcon - 3, 2) },
                  activo && { backgroundColor: t.card },
                ]}
              >
                <Text style={[estilos.paloTexto, { color: activo ? (rojo ? '#c0392b' : t.ink) : t.inkMuted }]}>
                  {simboloDePalo(palo)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Animated.FlatList
        ref={listaRef}
        data={tarjetas}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={PASO}
        decelerationRate="fast"
        disableIntervalMomentum
        initialScrollIndex={indiceInicial(desde, tarjetas.length)}
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: ASOMO + HUECO, alignItems: 'center' }}
        style={estilos.lista}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onFinDeArrastre}
        renderItem={({ item, index }) => {
          const rango = [(index - 1) * PASO, index * PASO, (index + 1) * PASO];
          const opacidad = sinMovimiento
            ? 1
            : scrollX.interpolate({ inputRange: rango, outputRange: [0.45, 1, 0.45], extrapolate: 'clamp' });
          const escala = sinMovimiento
            ? 1
            : scrollX.interpolate({ inputRange: rango, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' });
          return (
            <Animated.View style={{ width: ANCHO, marginRight: HUECO, opacity: opacidad, transform: [{ scale: escala }] }}>
              <Pressable
                onPress={() => setOcultos((o) => ({ ...o, [item.id]: !o[item.id] }))}
                accessibilityLabel="Ocultar o mostrar el reverso"
              >
                <TarjetaHojear tarjeta={item} categoria={categoria} oculto={!!ocultos[item.id]} />
              </Pressable>
            </Animated.View>
          );
        }}
      />

      <View style={estilos.pie}>
        <Text style={[estilos.pista, { color: t.inkMuted }]}>
          Desliza para pasar · toca para ocultar el reverso
        </Text>
        <View style={[estilos.riel, { backgroundColor: t.track }]}>
          <View
            style={[
              estilos.rielRelleno,
              { backgroundColor: t.accent1, width: `${progresoDeRiel(indice, tarjetas.length) * 100}%` },
            ]}
          />
        </View>
        <View style={estilos.extremos}>
          <Text style={[estilos.extremo, { color: t.inkMuted, fontFamily: tipografia.display }]}>{extremos.inicio}</Text>
          <Text style={[estilos.extremo, { color: t.inkMuted, fontFamily: tipografia.display }]}>{extremos.fin}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, paddingTop: 8 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  cerrar: { fontSize: 18, fontWeight: '600' },
  titulo: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  contador: { fontSize: 11, fontWeight: '700' },
  palos: { flexDirection: 'row', gap: 3, padding: 3, marginHorizontal: 18, marginBottom: 14 },
  palo: { flex: 1, paddingVertical: 6, alignItems: 'center' },
  paloTexto: { fontSize: 14, fontWeight: '800' },
  lista: { flexGrow: 0 },
  pie: { paddingHorizontal: 18, paddingTop: 22, gap: 14, alignItems: 'center' },
  pista: { fontSize: 11.5 },
  riel: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  rielRelleno: { height: 4, borderRadius: 2 },
  extremos: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  extremo: { fontSize: 10 },
});
