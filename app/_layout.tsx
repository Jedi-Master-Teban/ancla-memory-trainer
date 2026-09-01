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
import { TabBarInferior, type TabId } from '../src/components/TabBarInferior';
import { FAB } from '../src/components/FAB';
import { useUIStore } from '../src/stores/ui';

SplashScreen.preventAutoHideAsync();

/**
 * Stack (no Slot) — da gesto nativo de deslizar para volver y botón de
 * back en la cabecera en TODAS las pantallas, incluidas las futuras de
 * Fases 4+, sin tener que añadir un botón "Volver" a mano en cada una.
 * Antes se usaba <Slot/>, que no trae ninguna de las dos cosas — bug real
 * reportado por el operador: sin forma de salir a mitad de sesión ni de
 * volver desde Colgadero al menú principal.
 *
 * No se envuelve además en SafeAreaView: la cabecera nativa ya respeta el
 * área segura superior por sí sola: envolver aquí también duplicaría el
 * espacio vacío arriba. SafeAreaProvider se deja como contexto disponible
 * por si alguna pantalla futura necesita useSafeAreaInsets() para el borde
 * inferior (isla de inicio).
 *
 * `headerBackTitle` va en la pantalla DE DESTINO, no en `index`: React
 * Navigation resuelve el texto del botón "atrás" como
 * `headerBackTitle ?? tituloDeLaPantallaAnterior` (fuente:
 * @react-navigation/native-stack/.../useHeaderConfigProps.js, `label:
 * headerBackTitle ?? headerBack?.title`) — es una propiedad de quien
 * MUESTRA el botón, no de quien lo hereda. Puesto en `index` nunca hacía
 * nada (index es la primera pantalla, no tiene botón de atrás propio); por
 * eso el botón seguía diciendo "memory-trainer" pese a reiniciar la app.
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

  /**
   * Mapeo ruta actual → tab activa. Las rutas que NO son top-level (drill-down
   * como /colgadero/flash o /numeros/nuevo) caen en `null` y la tab bar se
   * oculta automáticamente. Las 4 rutas globales son:
   *   - '/'               → inicio
   *   - '/editar'         → listar categorías y entrar a editar
   *   - '/estadisticas'   → stats
   *   - '/ajustes'        → ajustes
   */
  const tabActiva: TabId | null = (() => {
    if (pathname === '/' || pathname === '/index') return 'inicio';
    if (pathname === '/editar') return 'editar';
    if (pathname === '/estadisticas') return 'stats';
    if (pathname === '/ajustes') return 'ajustes';
    return null;
  })();

  const cambiarTab = useCallback((tab: TabId) => {
    const ruta: Record<TabId, '/editar' | '/' | '/estadisticas' | '/ajustes'> = {
      inicio: '/',
      editar: '/editar',
      stats: '/estadisticas',
      ajustes: '/ajustes',
    };
    router.push(ruta[tab]);
  }, [router]);

  const cargarTema = useCallback(async () => {
    const db = await obtenerBD();
    const prefs = await obtenerPreferencias(db);
    useTemaStore.getState().establecer(prefs);
    setTemaListo(true);
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
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Ancla' }} />
        <Stack.Screen name="editar" options={{ title: 'Editar categorías', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="colgadero/index" options={{ title: 'Colgadero', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="colgadero/flash" options={{ title: 'Fonética Flash' }} />
        <Stack.Screen name="colgadero/reverso" options={{ title: 'Reverso' }} />
        <Stack.Screen name="colgadero/velocidad" options={{ title: 'Velocidad' }} />
        <Stack.Screen name="naipes/index" options={{ title: 'Naipes', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="naipes/flash" options={{ title: 'Fonética Flash' }} />
        <Stack.Screen name="naipes/reverso" options={{ title: 'Reverso' }} />
        <Stack.Screen name="naipes/velocidad" options={{ title: 'Velocidad' }} />
        <Stack.Screen name="naipes/baraja-completa" options={{ title: 'Baraja Completa' }} />
        <Stack.Screen name="listas/index" options={{ title: 'Listas', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="listas/[id]" options={{ title: 'Lista' }} />
        <Stack.Screen name="listas/estudiar" options={{ title: 'Estudiar' }} />
        <Stack.Screen name="numeros/index" options={{ title: 'Números', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="numeros/nuevo" options={{ title: 'Número nuevo' }} />
        <Stack.Screen name="numeros/repasar" options={{ title: 'Repasar' }} />
        <Stack.Screen name="racha" options={{ title: 'Tu racha', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="practicar" options={{ title: 'Practicar', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="practica-libre" options={{ title: 'Práctica libre', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="estadisticas" options={{ title: 'Estadísticas', headerBackTitle: 'Inicio' }} />
        <Stack.Screen name="historial-sesiones" options={{ title: 'Historial de sesiones' }} />
        <Stack.Screen name="crear/[categoria]" options={{ title: 'Crear' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes', headerBackTitle: 'Inicio' }} />
      </Stack>
      {!tabBarOculta && tabActiva !== null && (
        <TabBarInferior activa={tabActiva} onChange={cambiarTab} />
      )}
      {!tabBarOculta && <FAB />}
    </SafeAreaProvider>
  );
}
