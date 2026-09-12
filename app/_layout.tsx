import { useCallback, useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Nunito_400Regular, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { Lora_600SemiBold } from '@expo-google-fonts/lora/600SemiBold';
import { Karla_400Regular } from '@expo-google-fonts/karla/400Regular';
import { obtenerBD } from '../src/db/client';
import { obtenerPreferencias } from '../src/db/repository';
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
  const [temaListo, setTemaListo] = useState(false);
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
   * Un fallo de BD debe degradar, no matar la app.
   *
   * `setTemaListo(true)` va en `finally` a propósito: sin eso, cualquier rechazo
   * dejaba `temaListo` en false para siempre y el `return null` de abajo
   * producía una pantalla en blanco permanente, sin error visible ni forma de
   * recuperarse (src/db/client.ts memoiza la promesa rechazada, así que ni
   * siquiera reintenta).
   *
   * En la PWA esa superficie de fallo es mucho mayor que en nativo: OPFS
   * bloqueado por una segunda pestaña abierta, `wa-sqlite.wasm` que no descarga,
   * el worker que no carga. Si el tema no se puede leer, se arranca con el
   * tema por defecto del store y la app sigue siendo usable.
   */
  const cargarTema = useCallback(async () => {
    try {
      const db = await obtenerBD();
      const prefs = await obtenerPreferencias(db);
      useTemaStore.getState().establecer(prefs);
    } catch (e) {
      console.error('No se pudieron cargar las preferencias de tema:', e);
    } finally {
      setTemaListo(true);
    }
  }, []);

  useEffect(() => {
    cargarTema();
  }, [cargarTema]);

  useEffect(() => {
    if ((fontsListas || errorFuentes) && temaListo) {
      SplashScreen.hideAsync();
    }
  }, [fontsListas, errorFuentes, temaListo]);

  if (!(fontsListas || errorFuentes) || !temaListo) {
    return null;
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
          contentStyle: { backgroundColor: t.bg },
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
      </Stack>
      {!tabBarOculta && tabActiva !== null && (
        <TabBarInferior activa={tabActiva} onChange={cambiarTab} onRepaso={irARepaso} />
      )}
      {!tabBarOculta && <FAB />}
    </SafeAreaProvider>
  );
}
