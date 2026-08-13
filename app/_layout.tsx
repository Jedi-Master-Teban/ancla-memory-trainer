import { Slot } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

/**
 * SafeAreaView aquí, una sola vez, en vez de en cada pantalla: sin esto el
 * contenido que empieza pegado arriba (p. ej. app/naipes/index.tsx) choca
 * con el notch/reloj/isla dinámica — bug real reportado por el operador.
 * Las pantallas que ya se veían bien (centradas con justifyContent) lo eran
 * por casualidad, no por manejar el área segura correctamente.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1e1e2e' }}>
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
