import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Rect, type SvgProps } from 'react-native-svg';
import { etiquetaDeMemo, rectsDeSprite, type ReaccionMemo } from '../domain/mascota/memo';
import { CUADROS_MEMO, EXTRAS_MEMO, LADO_SPRITE, PALETA_MEMO, type CuadroMemo } from '../domain/mascota/sprites';

/**
 * Memo, la mascota de Ancla (ADR-033). Aparece en dos sitios y en ninguno
 * más: junto al nombre de la app en Inicio y al terminar una sesión. Nunca
 * durante un repaso ni al hojear: ahí la atención es de la tarjeta.
 *
 * Qué hace lo decide src/domain/mascota/memo.ts; aquí solo se anima:
 *   - Inicio, despierto (hay racha): parpadea y da un brinco doble al llegar
 *     y luego cada 14 s — el paso de la pantalla de arranque, de a un píxel,
 *     mucho menos frecuente para no distraer.
 *   - Inicio, dormido (sin racha): ojos cerrados y zetas que aparecen por
 *     escalones.
 *   - Fin de sesión: si la sesión cumplió la meta, celebra (y si dormía,
 *     primero despierta); si no, refleja la racha con un saltito o dormido.
 *
 * Con «Reducir movimiento» se queda quieto en el cuadro que corresponde.
 * Fuera de foco (Inicio sigue montado bajo otras pantallas) no anima nada.
 */

const INTERVALO_BRINCO = 14_000;
const PERIODO_ZETAS = 3000;

/**
 * El driver nativo solo existe fuera de la web. Pedirlo en la web no es
 * inocuo: `Animated.loop` sobre un `timing` que lo pide cree que el bucle lo
 * hace el nativo (`_startNativeLoop`) y en la web corre UNA sola vuelta — las
 * zetas salían una vez y no volvían.
 */
const NATIVO = Platform.OS !== 'web';

/**
 * Bordes nítidos, sin suavizado. Con suavizado, cada fila del dibujo deja una
 * raya fina del fondo contra la siguiente en cuanto cae entre dos píxeles de
 * la pantalla (se veía al brincar). En la web `shape-rendering` lo resuelve
 * de raíz — la pantalla de arranque usa lo mismo —; react-native-svg no lo
 * declara en sus tipos, pero en la web pasa tal cual al <svg>.
 */
const NITIDO = { shapeRendering: 'crispEdges' } as unknown as SvgProps;
/** En nativo no hay `shape-rendering`: ahí cada tramo invade un pelo al vecino. */
const SOLAPE = Platform.OS === 'web' ? 0 : 0.04;

/** Un dibujo de pixel art a `px` puntos por píxel. */
function Pixeles({ filas, px }: { filas: readonly string[]; px: number }) {
  const tramos = useMemo(() => rectsDeSprite(filas), [filas]);
  const ancho = filas[0]?.length ?? 0;
  const alto = filas.length;
  return (
    <Svg {...NITIDO} width={ancho * px} height={alto * px} viewBox={`0 0 ${ancho} ${alto}`}>
      {tramos.map((t) => (
        <Rect
          key={`${t.x}-${t.y}`}
          x={t.x}
          y={t.y}
          width={t.ancho + SOLAPE}
          height={1 + SOLAPE}
          fill={PALETA_MEMO[t.color]}
        />
      ))}
    </Svg>
  );
}

/** `null` mientras no se sabe: así no arranca una animación que habría que cortar. */
function useReducirMovimiento(): boolean | null {
  const [reducir, setReducir] = useState<boolean | null>(null);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => vivo && setReducir(r))
      .catch(() => vivo && setReducir(false));
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducir);
    return () => {
      vivo = false;
      suscripcion.remove();
    };
  }, []);
  return reducir;
}

function useEnFoco(): boolean {
  const [enFoco, setEnFoco] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setEnFoco(true);
      return () => setEnFoco(false);
    }, []),
  );
  return enFoco;
}

/** Cierra los ojos 140 ms cada 3–6 s, a intervalos irregulares como los de verdad. */
function useParpadeo(activo: boolean): boolean {
  const [cerrado, setCerrado] = useState(false);
  useEffect(() => {
    setCerrado(false);
    if (!activo) return;
    let espera: ReturnType<typeof setTimeout>;
    const programar = () => {
      espera = setTimeout(
        () => {
          setCerrado(true);
          espera = setTimeout(() => {
            setCerrado(false);
            programar();
          }, 140);
        },
        3000 + Math.random() * 3000,
      );
    };
    programar();
    return () => clearTimeout(espera);
  }, [activo]);
  return cerrado;
}

/**
 * Brincos de a un píxel del dibujo, sin suavizado: sube y baja por escalones,
 * como el paso de la pantalla de arranque. Así además nunca queda a medio
 * píxel de la pantalla. `alto` va en píxeles del dibujo.
 */
function useBrincos(px: number) {
  const y = useRef(new Animated.Value(0)).current;
  const brincar = useCallback(
    (veces: number, alto: number) => {
      const ir = (altura: number) => Animated.timing(y, { toValue: -altura * px, duration: 0, useNativeDriver: NATIVO });
      const pasos: Animated.CompositeAnimation[] = [];
      for (let i = 0; i < veces; i++) {
        for (let a = 1; a <= alto; a++) pasos.push(ir(a), Animated.delay(a === alto ? 90 : 45));
        for (let a = alto - 1; a >= 0; a--) pasos.push(ir(a), Animated.delay(55));
      }
      Animated.sequence(pasos).start();
    },
    [y, px],
  );
  useEffect(
    () => () => {
      y.stopAnimation();
    },
    [y],
  );
  return { y, brincar };
}

/**
 * Las zetas del sueño, en escalones como el resto del pixel art: aparecen
 * una tras otra, cada una más grande y más arriba, y se apagan juntas. Sin
 * escalar ni deslizar: una z de 4 píxeles encogida se deforma. Con «Reducir
 * movimiento» se quedan las tres fijas.
 */
const ZETAS = [
  { x: 20, y: 2, escala: 1, aparece: 0.08 },
  { x: 23, y: -2, escala: 1.2, aparece: 0.32 },
  { x: 26, y: -7, escala: 1.4, aparece: 0.56 },
];
const SE_APAGAN = 0.86;

function Zetas({ px, animar }: { px: number; animar: boolean }) {
  const reloj = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animar) {
      reloj.stopAnimation();
      reloj.setValue(0);
      return;
    }
    const bucle = Animated.loop(
      Animated.timing(reloj, { toValue: 1, duration: PERIODO_ZETAS, easing: Easing.linear, useNativeDriver: NATIVO }),
    );
    bucle.start();
    return () => bucle.stop();
  }, [animar, reloj]);

  const opacidades = useMemo(
    () =>
      ZETAS.map((z) =>
        reloj.interpolate({
          inputRange: [0, z.aparece, z.aparece + 0.001, SE_APAGAN, SE_APAGAN + 0.001, 1],
          outputRange: [0, 0, 1, 1, 0, 0],
        }),
      ),
    [reloj],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ZETAS.map((z, i) => (
        <Animated.View
          key={i}
          style={[estilos.zeta, { left: z.x * px, top: z.y * px }, animar ? { opacity: opacidades[i] } : null]}
        >
          <Pixeles filas={EXTRAS_MEMO.z} px={px * z.escala} />
        </Animated.View>
      ))}
    </View>
  );
}

/** Los destellos verdes de la celebración, alrededor de la cabeza. */
const DESTELLOS = [
  { x: -4, y: 6 },
  { x: 25, y: 4 },
  { x: -2, y: 16 },
  { x: 24, y: 15 },
];

/** Cada destello se enciende un poco después del anterior, crece y se apaga. */
function Destellos({ px, brillo, quietos }: { px: number; brillo: Animated.Value; quietos: boolean }) {
  const animados = useMemo(
    () =>
      DESTELLOS.map((_, i) => {
        const inicio = i * 0.12;
        return {
          opacity: brillo.interpolate({
            inputRange: [0, inicio, inicio + 0.15, inicio + 0.5, inicio + 0.62, 1],
            outputRange: [0, 0, 1, 1, 0, 0],
          }),
          transform: [
            {
              scale: brillo.interpolate({
                inputRange: [0, inicio, inicio + 0.15, inicio + 0.62, 1],
                outputRange: [0.3, 0.3, 1.2, 0.5, 0.5],
              }),
            },
          ],
        };
      }),
    [brillo],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DESTELLOS.map((d, i) => (
        <Animated.View
          key={i}
          style={[estilos.destello, { left: d.x * px, top: d.y * px }, quietos ? null : animados[i]]}
        >
          <Pixeles filas={EXTRAS_MEMO.destello} px={px} />
        </Animated.View>
      ))}
    </View>
  );
}

/** Memo en miniatura junto al nombre de la app. */
export function MemoInicio({ despierto, tamano = 40 }: { despierto: boolean; tamano?: number }) {
  const px = tamano / LADO_SPRITE;
  const reducir = useReducirMovimiento();
  const enFoco = useEnFoco();
  const animar = enFoco && reducir === false;
  const cerrado = useParpadeo(animar && despierto);
  const { y, brincar } = useBrincos(px);

  useEffect(() => {
    if (!animar || !despierto) return;
    const llegada = setTimeout(() => brincar(2, 2), 700);
    const cada = setInterval(() => brincar(2, 2), INTERVALO_BRINCO);
    return () => {
      clearTimeout(llegada);
      clearInterval(cada);
    };
  }, [animar, despierto, brincar]);

  const cuadro: CuadroMemo = !despierto ? 'dormido' : cerrado ? 'parpadeo' : 'quieto';
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={etiquetaDeMemo(despierto ? 'despierto' : 'dormido')}
      style={{ width: tamano, height: tamano }}
    >
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        <Pixeles filas={CUADROS_MEMO[cuadro]} px={px} />
      </Animated.View>
      {despierto ? null : <Zetas px={px} animar={animar} />}
    </View>
  );
}

const CUADRO_INICIAL: Record<ReaccionMemo, CuadroMemo> = {
  'empieza-racha': 'dormido',
  'extiende-racha': 'quieto',
  despierto: 'quieto',
  dormido: 'dormido',
};

const CUADRO_QUIETO: Record<ReaccionMemo, CuadroMemo> = {
  'empieza-racha': 'feliz',
  'extiende-racha': 'feliz',
  despierto: 'quieto',
  dormido: 'dormido',
};

/** Memo al terminar una sesión: celebra la racha que empieza o crece. */
export function MemoReaccion({ reaccion, tamano = 72 }: { reaccion: ReaccionMemo; tamano?: number }) {
  const px = tamano / LADO_SPRITE;
  const reducir = useReducirMovimiento();
  const celebra = reaccion === 'empieza-racha' || reaccion === 'extiende-racha';
  const [cuadro, setCuadro] = useState<CuadroMemo>(CUADRO_INICIAL[reaccion]);
  const cerrado = useParpadeo(reducir === false && cuadro === 'quieto');
  const { y, brincar } = useBrincos(px);
  const brillo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducir === null) return;
    if (reducir) {
      setCuadro(CUADRO_QUIETO[reaccion]);
      return;
    }
    setCuadro(CUADRO_INICIAL[reaccion]);
    const esperas: ReturnType<typeof setTimeout>[] = [];
    const despues = (ms: number, hacer: () => void) => esperas.push(setTimeout(hacer, ms));
    const celebrar = () => {
      setCuadro('feliz');
      brincar(3, 3);
      brillo.setValue(0);
      Animated.timing(brillo, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: NATIVO }).start();
    };
    if (reaccion === 'empieza-racha') {
      // Dormía porque no había racha: se sobresalta, abre los ojos y celebra.
      despues(900, () => setCuadro('parpadeo'));
      despues(1080, () => setCuadro('quieto'));
      despues(1400, celebrar);
    } else if (reaccion === 'extiende-racha') {
      despues(650, celebrar);
    } else if (reaccion === 'despierto') {
      despues(700, () => brincar(1, 2));
    }
    return () => esperas.forEach(clearTimeout);
  }, [reducir, reaccion, brincar, brillo]);

  const visible: CuadroMemo = cuadro === 'quieto' && cerrado ? 'parpadeo' : cuadro;
  return (
    <View accessibilityRole="image" accessibilityLabel={etiquetaDeMemo(reaccion)} style={{ width: tamano, height: tamano }}>
      {celebra ? <Destellos px={px} brillo={brillo} quietos={reducir === true} /> : null}
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        <Pixeles filas={CUADROS_MEMO[visible]} px={px} />
      </Animated.View>
      {cuadro === 'dormido' ? <Zetas px={px} animar={reducir === false} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  zeta: { position: 'absolute' },
  destello: { position: 'absolute' },
});
