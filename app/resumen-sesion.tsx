import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Llama } from '../src/components/Llama';
import { MemoReaccion } from '../src/components/Memo';
import { Odometro } from '../src/components/Odometro';
import { reaccionAlTerminar } from '../src/domain/mascota/memo';
import { useTema } from '../src/stores/tema';
import { useUIStore } from '../src/stores/ui';
import { recetaForma } from '../src/tema/colores';

/**
 * Resumen de sesión (DESIGN.md §5.6).
 *
 * v1 terminaba una sesión devolviendo al dashboard sin más. Ese es el momento
 * de máxima disposición del usuario —acaba de hacer el trabajo— y se estaba
 * desperdiciando. Esta pantalla es la recompensa: la racha nueva, tres
 * métricas y una razón para volver mañana.
 *
 * Deliberadamente NO lleva confeti, ni sonidos, ni medallas, ni XP con
 * niveles. La llama y el odómetro de la racha son la recompensa de la app, y
 * siguen sintiéndose valiosos justamente porque no compiten con nada.
 * Añadir capas de premio a un hábito que ya funciona lo abarata.
 *
 * Memo (ADR-033) acompaña a la llama sin competir con ella: se queda a su
 * lado, más pequeño, y solo CELEBRA cuando esta sesión cumplió la meta del
 * día — la que empieza o alarga la racha. En cualquier otra sesión se limita
 * a reflejar la racha (un saltito si la hay, dormido si no). Una celebración
 * que sale siempre dejaría de significar algo.
 *
 * ── Contrato de navegación ─────────────────────────────────────────────────
 *
 * Se llega con `router.replace` (no `push`) desde el final de la sesión, para
 * que el gesto de volver atrás no reabra la sesión ya terminada:
 *
 *   router.replace({
 *     pathname: '/resumen-sesion',
 *     params: {
 *       aciertos: '17',          // calificadas bien o fácil
 *       fallos: '3',             // calificadas otra vez
 *       minutos: '8',
 *       racha: '24',             // racha YA actualizada con el día de hoy
 *       metaCumplida: '1',
 *       tarjetasHoy: '24',       // calificadas hoy, contando esta sesión
 *       meta: '20',              // meta diaria vigente
 *       proximaCategoria: 'Naipes',
 *       proximaDetalle: '14 cartas vencen mañana. Es tu categoría con menor retención (74 %).',
 *     },
 *   });
 *
 * Todos los params son opcionales salvo `racha`: si falta alguno, su bloque
 * simplemente no se pinta. Registrar la sesión en BD es responsabilidad de
 * quien navega hasta aquí — esta pantalla no escribe nada.
 *
 * Se sale con `router.dismissTo` (ADR-035): vuelve a la pantalla que ya está
 * en la pila —Inicio sigue montado debajo— y quita el resumen; si no está,
 * reemplaza el resumen, como hacía `replace`. Con `router.replace('/')` cada
 * sesión apilaba un Inicio nuevo encima del de antes, y `navigate` tampoco
 * sirve: en expo-router 6 empuja si la ruta no es la actual. La sesión ya no
 * está en la pila, así que el gesto de volver tampoco la reabre.
 *
 * Recuerda poner `tabBarOculta` en true mientras está montada (useUIStore):
 * es el cierre de un flujo, no un destino de la navegación.
 */

/** Pop con rebote — DESIGN.md §6, 580 ms, bezier(.2, 1.3, .4, 1). */
function usePop(retraso = 0) {
  const valor = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (!vivo) return;
      if (reducir) {
        valor.setValue(1);
        return;
      }
      Animated.timing(valor, {
        toValue: 1,
        duration: 580,
        delay: retraso,
        easing: Easing.bezier(0.2, 1.3, 0.4, 1),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      vivo = false;
    };
  }, [valor, retraso]);
  return {
    opacity: valor.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
    transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
  };
}

function aNumero(v: string | string[] | undefined): number | null {
  if (typeof v !== 'string' || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function aTexto(v: string | string[] | undefined): string | null {
  return typeof v === 'string' && v !== '' ? v : null;
}

export default function ResumenSesion() {
  const params = useLocalSearchParams();
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const pop = usePop();
  // Memo aparece un instante después de la llama: ella es lo primero.
  const popMemo = usePop(140);

  // Cierre de un flujo, no un destino de navegación: la isla no aporta aquí.
  useEffect(() => {
    useUIStore.getState().ocultarTabBar();
    return () => useUIStore.getState().mostrarTabBar();
  }, []);

  const racha = aNumero(params.racha) ?? 0;
  const aciertos = aNumero(params.aciertos);
  const fallos = aNumero(params.fallos);
  const minutos = aNumero(params.minutos);
  const total = (aciertos ?? 0) + (fallos ?? 0);
  const metaCumplida = params.metaCumplida === '1';
  const proximaCategoria = aTexto(params.proximaCategoria);
  const proximaDetalle = aTexto(params.proximaDetalle);
  const reaccion = reaccionAlTerminar({
    racha,
    tarjetasHoy: aNumero(params.tarjetasHoy),
    meta: aNumero(params.meta),
    calificadasEnSesion: total,
  });

  const tarjetaMetrica = [
    estilos.metrica,
    { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder, borderRadius: forma.rCard },
  ];

  return (
    <View style={[estilos.pantalla, { backgroundColor: t.bg }]}>
      <View>
        <Animated.View style={pop}>
          <Llama tamano={80} estado="activa" />
        </Animated.View>
        {/* A la izquierda de la llama y fuera del flujo: la llama sigue centrada. */}
        <Animated.View style={[estilos.memo, popMemo]}>
          <MemoReaccion reaccion={reaccion} tamano={72} />
        </Animated.View>
      </View>

      <View style={estilos.cabecera}>
        <Text style={[estilos.kicker, { color: t.flameOuterEnd, fontFamily: tipografia.display }]}>
          Racha de {racha} {racha === 1 ? 'día' : 'días'}
        </Text>
        <Text style={[estilos.titular, { color: t.ink, fontFamily: tipografia.display }]}>
          {metaCumplida ? 'Meta de hoy cumplida' : 'Sesión terminada'}
        </Text>
        {total > 0 ? (
          <Text style={[estilos.subtitulo, { color: t.inkMuted, fontFamily: tipografia.body }]}>
            {total} {total === 1 ? 'tarjeta' : 'tarjetas'}
            {minutos !== null ? ` · ${minutos} min` : ''}
          </Text>
        ) : null}
      </View>

      {/* El odómetro es el mismo componente del dashboard: la racha se ve
          SUBIR aquí, no aparecer ya subida. Ese medio segundo es la razón por
          la que la pantalla existe. */}
      <View style={estilos.odometro}>
        <Odometro
          valor={racha}
          color={t.ink}
          fontFamily={tipografia.display}
          fontSize={44}
          fontWeight="800"
          anchoDigito={27}
          altoDigito={46}
        />
        <Text style={[estilos.odometroPie, { color: t.inkMuted, fontFamily: tipografia.body }]}>
          días consecutivos
        </Text>
      </View>

      {aciertos !== null || fallos !== null ? (
        <View style={estilos.filaMetricas}>
          {aciertos !== null ? (
            <View style={tarjetaMetrica}>
              <Text style={[estilos.metricaNumero, { color: t.bien, fontFamily: tipografia.display }]}>
                {aciertos}
              </Text>
              <Text style={[estilos.metricaPie, { color: t.inkMuted, fontFamily: tipografia.body }]}>
                recordadas
              </Text>
            </View>
          ) : null}
          {fallos !== null ? (
            <View style={tarjetaMetrica}>
              <Text style={[estilos.metricaNumero, { color: t.otraVez, fontFamily: tipografia.display }]}>
                {fallos}
              </Text>
              <Text style={[estilos.metricaPie, { color: t.inkMuted, fontFamily: tipografia.body }]}>
                vuelven hoy
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {proximaCategoria ? (
        <View
          style={[
            estilos.manana,
            { backgroundColor: t.cardAlt, borderColor: t.borderMuted ?? t.track, borderRadius: forma.rRow },
          ]}
        >
          <Text style={[estilos.mananaTitulo, { color: t.ink, fontFamily: tipografia.display }]}>
            Mañana te toca {proximaCategoria}
          </Text>
          {proximaDetalle ? (
            <Text style={[estilos.mananaDetalle, { color: t.inkMuted, fontFamily: tipografia.body }]}>
              {proximaDetalle}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={estilos.acciones}>
        <Pressable
          onPress={() => router.dismissTo('/racha')}
          style={({ pressed }) => [
            estilos.cta,
            forma.sombraCta(t),
            { backgroundColor: t.accent1, borderRadius: forma.rBtn },
            pressed && { transform: [{ translateY: 1 }], opacity: 0.92 },
          ]}
        >
          <Text style={[estilos.ctaTexto, { color: t.inkOnAccent, fontFamily: tipografia.display }]}>
            Ver mi racha
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.dismissTo('/')}
          style={({ pressed }) => [estilos.secundario, pressed && { opacity: 0.6 }]}
        >
          <Text style={[estilos.secundarioTexto, { color: t.inkMuted, fontFamily: tipografia.body }]}>
            Volver al inicio
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 22,
  },
  memo: { position: 'absolute', right: '100%', marginRight: -10, bottom: 18 },
  cabecera: { alignItems: 'center', gap: 7 },
  kicker: { fontSize: 15, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  titular: { fontSize: 30, fontWeight: '800', textAlign: 'center', lineHeight: 35 },
  subtitulo: { fontSize: 13.5 },
  odometro: { alignItems: 'center', gap: 2 },
  odometroPie: { fontSize: 12.5 },
  filaMetricas: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  metrica: { flex: 1, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 14, gap: 4 },
  metricaNumero: { fontSize: 24, fontWeight: '800' },
  metricaPie: { fontSize: 11.5 },
  manana: { alignSelf: 'stretch', borderWidth: 1, borderStyle: 'dashed', padding: 15, gap: 5 },
  mananaTitulo: { fontSize: 12.5, fontWeight: '700' },
  mananaDetalle: { fontSize: 11.5, lineHeight: 17 },
  acciones: { alignSelf: 'stretch', gap: 10, paddingTop: 4 },
  cta: { paddingVertical: 16, alignItems: 'center' },
  ctaTexto: { fontSize: 15.5, fontWeight: '800' },
  secundario: { paddingVertical: 13, alignItems: 'center' },
  secundarioTexto: { fontSize: 13.5, fontWeight: '700' },
});
