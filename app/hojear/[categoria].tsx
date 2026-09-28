import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { BotonRedondo, DIAMETRO_BOTON_REDONDO } from '../../src/components/BotonRedondo';
import { ALTO_MAX_TARJETA, EscenaRepaso } from '../../src/components/EscenaRepaso';
import { TarjetaHojear } from '../../src/components/TarjetaHojear';
import {
  etiquetaDeTarjeta,
  extremosDeRiel,
  indiceDeDesplazamiento,
  indiceInicial,
  indicesDePalo,
  ORDEN_PALOS,
  ordenarParaHojear,
  progresoDeRiel,
} from '../../src/components/hojear-logic';
import { obtenerBD } from '../../src/db/client';
import { listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { Categoria, FilaTarjeta } from '../../src/db/tipos';
import { esCategoriaValida, REGISTRO } from '../../src/domain/categorias/registro';
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
 * Usa el mismo escenario que el repaso (`EscenaRepaso`): la tarjeta queda a la
 * misma altura y con el mismo alto que al repasar, y el pie ocupa el sitio de
 * los botones de calificar. Antes todo iba apilado arriba y sobraba media
 * pantalla vacía debajo.
 *
 * Geometría horizontal (mockup 2a, medida sobre 250 px de ancho y escalada por
 * ancho de pantalla): asomo de vecino 26 px, hueco 10 px, así que la tarjeta
 * mide `ancho - 72` y el paso del snap es `ancho - 62`.
 */

const ASOMO = 26;
const HUECO = 10;

/**
 * Snap en la PWA. react-native-web no implementa `snapToInterval` ni
 * `disableIntervalMomentum`: el carrusel se detenía donde soltaras el dedo,
 * con una tarjeta a medias. CSS Scroll Snap hace lo mismo que el snap nativo:
 * centrar cada tarjeta cae justo en los múltiplos de `PASO`, y `always` impide
 * saltarse tarjetas de un solo gesto. Estas propiedades no existen en los
 * tipos de React Native, de ahí el cast; en nativo no se aplican.
 */
const SNAP_WEB =
  Platform.OS === 'web'
    ? {
        lista: { scrollSnapType: 'x mandatory' } as unknown as ViewStyle,
        marca: { scrollSnapAlign: 'center', scrollSnapStop: 'always' } as unknown as ViewStyle,
      }
    : null;

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
  // Arranca en el máximo, que es el alto final en la mayoría de iPhones, y el
  // escenario lo corrige en cuanto mide su zona. No se espera a la medida para
  // montar el carrusel: si `onLayout` tardara, la tarjeta no aparecería.
  const [altoTarjeta, setAltoTarjeta] = useState(ALTO_MAX_TARJETA);

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

  // La fila «Continuar» del panel sale de aquí: se guarda cada tarjeta a la
  // que llegas, no solo la última en la que soltaste el dedo.
  useEffect(() => {
    if (!cargando) setPosicion(categoria, indice);
  }, [cargando, categoria, indice, setPosicion]);

  const extremos = useMemo(() => extremosDeRiel(tarjetas, categoria), [tarjetas, categoria]);
  const porPalo = useMemo(() => (categoria === 'naipe' ? indicesDePalo(tarjetas) : null), [tarjetas, categoria]);

  // El índice sale de CADA evento de scroll. Antes salía de
  // `onMomentumScrollEnd`, que react-native-web nunca emite: en la PWA el
  // contador, el riel y la etiqueta se quedaban en la primera tarjeta.
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
          setIndice(indiceDeDesplazamiento(e.nativeEvent.contentOffset.x, PASO, tarjetas.length)),
      }),
    [scrollX, PASO, tarjetas.length],
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

  // Web: una marca de snap por tarjeta, siempre montada. Las celdas del
  // FlatList se virtualizan (solo existen las cercanas a la vista) y CSS Scroll
  // Snap solo se detiene en cajas que existen: sin las marcas, un salto largo
  // —la fila de palos, «Continuar» en la 37— caía en la última celda montada.
  // Son cajas vacías de 1 px, sin animación, dentro de una cabecera de ancho 0
  // que no desplaza ninguna tarjeta.
  const marcasDeSnap = SNAP_WEB ? (
    <View style={estilos.marcas}>
      {tarjetas.map((item, i) => (
        <View key={item.id} style={[estilos.marca, { left: i * PASO, width: ANCHO }, SNAP_WEB.marca]} />
      ))}
    </View>
  ) : null;

  const carrusel = (
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
      style={[estilos.lista, SNAP_WEB?.lista]}
      ListHeaderComponent={marcasDeSnap}
      onScroll={onScroll}
      scrollEventThrottle={16}
      renderItem={({ item, index }) => {
        const rango = [(index - 1) * PASO, index * PASO, (index + 1) * PASO];
        const opacidad = sinMovimiento
          ? 1
          : scrollX.interpolate({ inputRange: rango, outputRange: [0.45, 1, 0.45], extrapolate: 'clamp' });
        const escala = sinMovimiento
          ? 1
          : scrollX.interpolate({ inputRange: rango, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' });
        return (
          <Animated.View
            style={{ width: ANCHO, marginRight: HUECO, opacity: opacidad, transform: [{ scale: escala }] }}
          >
            <Pressable
              onPress={() => setOcultos((o) => ({ ...o, [item.id]: !o[item.id] }))}
              accessibilityLabel="Ocultar o mostrar el reverso"
            >
              <TarjetaHojear tarjeta={item} categoria={categoria} oculto={!!ocultos[item.id]} alto={altoTarjeta} />
            </Pressable>
          </Animated.View>
        );
      }}
    />
  );

  const pie = (
    <View style={estilos.pie}>
      <Text style={[estilos.pista, { color: t.inkMuted }]}>Desliza para pasar · toca para ocultar el reverso</Text>
      <View
        style={[estilos.riel, { backgroundColor: t.track }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: tarjetas.length, now: indice + 1 }}
      >
        <View
          style={[
            estilos.rielRelleno,
            { backgroundColor: t.accent1, width: `${progresoDeRiel(indice, tarjetas.length) * 100}%` },
          ]}
        />
      </View>
      <View style={estilos.extremos}>
        {/* A la izquierda, la tarjeta que estás viendo; a la derecha, la última. */}
        <Text style={[estilos.extremo, estilos.actual, { color: t.ink, fontFamily: tipografia.display }]}>
          {etiquetaDeTarjeta(tarjetas[indice], categoria, indice)}
        </Text>
        <Text style={[estilos.extremo, { color: t.inkMuted, fontFamily: tipografia.display }]}>{extremos.fin}</Text>
      </View>
    </View>
  );

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
        <BotonRedondo icono={X} etiqueta="Cerrar" onPress={() => router.back()} />
        <View style={estilos.zonaTitulo}>
          <Text style={[estilos.titulo, { color: t.inkMuted }]}>{REGISTRO[categoria].etiquetaPlural.toUpperCase()}</Text>
        </View>
        <View style={estilos.derecha}>
          <Text
            style={[estilos.contador, { color: t.inkMuted }]}
            accessibilityLabel={`Tarjeta ${indice + 1} de ${tarjetas.length}`}
          >
            {indice + 1}/{tarjetas.length}
          </Text>
        </View>
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

      <EscenaRepaso aLoAncho onAltoTarjeta={setAltoTarjeta} tarjeta={carrusel} accion={pie} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Mismas medidas que `HeaderFlotante`, para que la ✕ caiga donde cae la
  // flecha de volver en el resto de pantallas.
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  zonaTitulo: {
    flex: 1,
    height: DIAMETRO_BOTON_REDONDO,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titulo: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  derecha: { minWidth: DIAMETRO_BOTON_REDONDO, alignItems: 'flex-end' },
  contador: { fontSize: 12, fontWeight: '600' },
  palos: { flexDirection: 'row', gap: 3, padding: 3, marginHorizontal: 16, marginBottom: 10 },
  palo: { flex: 1, paddingVertical: 6, alignItems: 'center' },
  paloTexto: { fontSize: 14, fontWeight: '800' },
  lista: { flexGrow: 0 },
  marcas: { width: 0, height: 0 },
  marca: { position: 'absolute', top: 0, height: 1, pointerEvents: 'none' },
  pie: { paddingHorizontal: 16, gap: 14, alignItems: 'center' },
  pista: { fontSize: 11.5 },
  riel: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  rielRelleno: { height: 4, borderRadius: 2 },
  extremos: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  extremo: { fontSize: 12 },
  actual: { fontWeight: '700' },
});
