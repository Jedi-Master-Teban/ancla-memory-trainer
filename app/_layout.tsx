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
      </Stack>
    </SafeAreaProvider>
  );
}
