import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Nunito_400Regular, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { Lora_600SemiBold } from '@expo-google-fonts/lora/600SemiBold';
import { Karla_400Regular } from '@expo-google-fonts/karla/400Regular';
import { obtenerBD } from '../src/db/client';
import { obtenerNacimientoBase, obtenerPreferencias, obtenerResumenDatos } from '../src/db/repository';
import { listarCopiasAutomaticas, recuperacionDescartadaHasta } from '../src/db/respaldo';
import { copiaParaRecuperar, type MetaCopia } from '../src/domain/respaldo/copias';
import { senalarArranque, senalarErrorDeArranque } from '../src/arranque/senales';
import { mensajeDeErrorDeDatos, type MensajeDeError } from '../src/arranque/mensajes';
import { BordeSuperior, RESERVA_SUPERIOR } from '../src/components/BordeSuperior';
import { DialogoHost } from '../src/components/DialogoHost';
import { PantallaRecuperacion } from '../src/components/PantallaRecuperacion';
import { useTema, useTemaStore } from '../src/stores/tema';
import { TabBarInferior } from '../src/components/TabBarInferior';
import { pestanaActiva, RUTA_POR_TAB, type TabId } from '../src/components/tabs';
import { FAB } from '../src/components/FAB';
import { useUIStore } from '../src/stores/ui';

SplashScreen.preventAutoHideAsync();

/**
 * Stack (no Slot) — da la pila de navegación y el gesto de deslizar para
 * volver. Antes se usaba <Slot/>, que no trae ninguna de las dos cosas: bug
 * real reportado por el operador, que se quedaba sin forma de salir a mitad
 * de sesión ni de volver desde Colgadero al menú principal.
 *
 * `headerShown: false` es global (ver screenOptions). El `title` de cada
 * Stack.Screen se conserva porque sigue alimentando el título del documento
 * en web y la accesibilidad, aunque ya no pinte ninguna barra.
 *
 * No se envuelve en SafeAreaView. SafeAreaProvider se deja como contexto
 * disponible por si alguna pantalla necesita useSafeAreaInsets().
 *
 * ── Fase 8 v2 ──────────────────────────────────────────────────────────────
 *
 * 1. La pestaña activa la resuelve `pestanaActiva()` en `components/tabs.ts`,
 *    que además mapea las pantallas HIJAS a su pestaña padre (`/racha` →
 *    Inicio). Antes ese mapeo vivía aquí como una cadena de ifs y `/racha`
 *    caía en `null`: la isla se quedaba sin ninguna pestaña activa y las
 *    cuatro se encogían al ancho de ícono a la vez, lo que parecía un glitch.
 *
 * 2. `animation: 'fade'` en el Stack — es la mitad del eje compartido en Z
 *    de DESIGN.md §6. La otra mitad (la escala) la pone cada pantalla en su
 *    contenedor: acercarse al entrar a la sesión, alejarse al volver.
 *
 * 3. La isla lleva el acceso a repaso, así que se pasa `onRepaso`. Sigue
 *    yendo a `/practicar`, que ya decide entre sesión pendiente y libre.
 */
export default function RootLayout() {
  const [fontsListas, errorFuentes] = useFonts({
    Fredoka_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Lora_600SemiBold,
    Karla_400Regular,
  });
  const [estado, setEstado] = useState<'cargando' | 'recuperar' | 'lista' | 'error'>('cargando');
  const [copiaARecuperar, setCopiaARecuperar] = useState<MetaCopia | null>(null);
  const [errorDatos, setErrorDatos] = useState<MensajeDeError | null>(null);
  const { colores: t } = useTema();
  const router = useRouter();
  const pathname = usePathname();
  const tabBarOculta = useUIStore((s) => s.tabBarOculta);

  const tabActiva: TabId | null = pestanaActiva(pathname);

  const cambiarTab = useCallback(
    (tab: TabId) => {
      router.push(RUTA_POR_TAB[tab]);
    },
    [router],
  );

  const irARepaso = useCallback(() => {
    router.push('/practicar');
  }, [router]);

  /**
   * Arranque (ADR-029, ADR-030): abre la base, aplica el tema y comprueba si
   * hay que ofrecer recuperar datos. Cada paso se le cuenta a la pantalla de
   * arranque de la PWA, que mueve su barra y se retira con `lista`.
   *
   * Si la base no abre, la app no finge que funciona: antes arrancaba con el
   * tema por defecto y todas las pantallas aparecían vacías, lo que parecía una
   * pérdida de datos aunque los datos siguieran ahí. Ahora se muestra el error
   * con un botón para reintentar (`obtenerBD` ya no memoiza el fallo).
   */
  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      senalarArranque('datos');
      const db = await obtenerBD();
      const prefs = await obtenerPreferencias(db);
      useTemaStore.getState().establecer(prefs);
      const [resumen, idBase, copias, descartada] = await Promise.all([
        obtenerResumenDatos(db),
        obtenerNacimientoBase(db),
        listarCopiasAutomaticas(),
        recuperacionDescartadaHasta(),
      ]);
      const candidata = copiaParaRecuperar(resumen, idBase, copias, descartada);
      setCopiaARecuperar(candidata);
      setEstado(candidata ? 'recuperar' : 'lista');
    } catch (e) {
      console.error('No se pudo abrir la base de datos:', e);
      const mensaje = mensajeDeErrorDeDatos(String(e));
      setErrorDatos(mensaje);
      senalarErrorDeArranque(mensaje.titulo, mensaje.texto, String(e));
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    senalarArranque('app');
    cargar();
  }, [cargar]);

  const fuentesListas = Boolean(fontsListas || errorFuentes);

  useEffect(() => {
    if (fuentesListas && (estado === 'lista' || estado === 'recuperar')) {
      SplashScreen.hideAsync();
      senalarArranque('lista');
    }
  }, [fuentesListas, estado]);

  // En la PWA, el fondo del documento es lo que iOS pinta fuera del área
  // segura (la franja del indicador de inicio) y `theme-color` tiñe la barra
  // del sistema. El build los fija al fondo de Soft UI (pwa/patch_dist.py);
  // aquí se sincronizan con el tema activo para que Arcade y Papel no queden
  // con una franja crema debajo. El estilo del reloj (`status-bar-style`) no
  // se puede cambiar en vivo: iOS solo lo lee al abrir la app.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.background = t.bg;
    document.body.style.background = t.bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  }, [t.bg]);

  if (!fuentesListas || estado === 'cargando') {
    return null;
  }

  // En la PWA este error lo tapa la pantalla de arranque (con su propio
  // «Reintentar»); en nativo, que no la tiene, es lo único que se ve.
  if (estado === 'error') {
    return (
      <View style={[estilos.error, { backgroundColor: t.bg }]}>
        <Text style={[estilos.errorTitulo, { color: t.ink }]}>{errorDatos?.titulo}</Text>
        <Text style={[estilos.errorDetalle, { color: t.inkMuted }]}>{errorDatos?.texto}</Text>
        <Pressable onPress={cargar} style={[estilos.errorBoton, { backgroundColor: t.accent1 }]} accessibilityRole="button">
          <Text style={{ color: t.inkOnAccent, fontWeight: '800' }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (estado === 'recuperar' && copiaARecuperar) {
    return (
      <SafeAreaProvider>
        <PantallaRecuperacion copia={copiaARecuperar} onContinuar={() => setEstado('lista')} />
        <DialogoHost />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          // Sin cabecera nativa en NINGUNA pantalla. Convivía con el
          // HeaderFlotante del diseño y el resultado eran dos barras apiladas:
          // una franja clara con flecha de "atrás" encima del contenido de la
          // app, que hacía parecer que estabas dentro de un navegador. En
          // Inicio no tenía ni sentido — ya estás en el inicio, no hay atrás.
          // La navegación hacia arriba la da HeaderFlotante con su `volverA`
          // explícito; la lateral, la isla.
          headerShown: false,
          // En la app instalada, el contenido empieza bajo la franja que le
          // quita a iOS el difuminado de arriba (src/components/BordeSuperior).
          contentStyle: { backgroundColor: t.bg, paddingTop: RESERVA_SUPERIOR },
          // Eje Z: nada se desliza lateralmente. El repaso no es "la página
          // siguiente", es un lugar al que entras y del que sales.
          animation: 'fade',
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Ancla' }} />
        <Stack.Screen name="editar" options={{ title: 'Editar categorías' }} />
        <Stack.Screen name="colgadero/index" options={{ title: 'Colgadero' }} />
        <Stack.Screen name="colgadero/flash" options={{ title: 'Fonética Flash' }} />
        <Stack.Screen name="colgadero/reverso" options={{ title: 'Reverso' }} />
        <Stack.Screen name="colgadero/velocidad" options={{ title: 'Velocidad' }} />
        <Stack.Screen name="naipes/index" options={{ title: 'Naipes' }} />
        <Stack.Screen name="naipes/flash" options={{ title: 'Fonética Flash' }} />
        <Stack.Screen name="naipes/reverso" options={{ title: 'Reverso' }} />
        <Stack.Screen name="naipes/velocidad" options={{ title: 'Velocidad' }} />
        <Stack.Screen name="naipes/baraja-completa" options={{ title: 'Baraja Completa' }} />
        <Stack.Screen name="listas/index" options={{ title: 'Listas' }} />
        <Stack.Screen name="listas/[id]" options={{ title: 'Lista' }} />
        <Stack.Screen name="listas/estudiar" options={{ title: 'Estudiar' }} />
        <Stack.Screen name="numeros/index" options={{ title: 'Números' }} />
        <Stack.Screen name="numeros/nuevo" options={{ title: 'Número nuevo' }} />
        <Stack.Screen name="numeros/repasar" options={{ title: 'Repasar' }} />
        <Stack.Screen name="racha" options={{ title: 'Tu racha' }} />
        <Stack.Screen name="practicar" options={{ title: 'Practicar' }} />
        <Stack.Screen name="practica-libre" options={{ title: 'Práctica libre' }} />
        <Stack.Screen name="estadisticas" options={{ title: 'Estadísticas' }} />
        <Stack.Screen name="historial-sesiones" options={{ title: 'Historial de sesiones' }} />
        <Stack.Screen name="crear/[categoria]" options={{ title: 'Crear' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
        <Stack.Screen name="resumen-sesion" options={{ title: 'Resumen' }} />
        <Stack.Screen name="hojear/[categoria]" options={{ title: 'Hojear' }} />
        <Stack.Screen name="guia/index" options={{ title: 'Guía' }} />
        <Stack.Screen name="guia/[capitulo]" options={{ title: 'Guía' }} />
      </Stack>
      <BordeSuperior />
      {!tabBarOculta && tabActiva !== null && (
        <TabBarInferior activa={tabActiva} onChange={cambiarTab} onRepaso={irARepaso} />
      )}
      {!tabBarOculta && <FAB />}
      <DialogoHost />
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorTitulo: { fontSize: 20, fontWeight: '700' },
  errorDetalle: { fontSize: 13, textAlign: 'center' },
  errorBoton: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
});
