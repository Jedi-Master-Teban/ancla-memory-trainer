import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1e1e2e' },
          headerTintColor: '#ffffff',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#1e1e2e' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'memory-trainer' }} />
        <Stack.Screen name="colgadero/index" options={{ title: 'Colgadero' }} />
        <Stack.Screen name="colgadero/flash" options={{ title: 'Fonética Flash' }} />
        <Stack.Screen name="colgadero/reverso" options={{ title: 'Reverso' }} />
        <Stack.Screen name="colgadero/velocidad" options={{ title: 'Velocidad' }} />
        <Stack.Screen name="naipes/index" options={{ title: 'Naipes' }} />
        <Stack.Screen name="naipes/flash" options={{ title: 'Fonética Flash' }} />
        <Stack.Screen name="naipes/reverso" options={{ title: 'Reverso' }} />
        <Stack.Screen name="naipes/velocidad" options={{ title: 'Velocidad' }} />
        <Stack.Screen name="naipes/baraja-completa" options={{ title: 'Baraja Completa' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
