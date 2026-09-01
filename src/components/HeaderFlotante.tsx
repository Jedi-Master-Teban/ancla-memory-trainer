import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MorphIcon } from 'morphicons/react-native';
import { useTema } from '../stores/tema';

interface Props {
  titulo: string;
  /** Si se omite, usa router.back(). Si se pasa, navega a esa ruta. */
  volverA?: string;
  /** Acciones a la derecha (ej. botón ayuda / ajustes). */
  derecha?: React.ReactNode;
}

/**
 * Header flotante estilo iOS: pill arriba con flecha back + título. Se
 * usa en lugar del Stack.Screen header nativo cuando la pantalla
 * quiere un look unificado con el TabBar flotante (mismo blur, mismas
 * esquinas redondeadas). Compatible con `headerShown: false` en el
 * Stack.
 *
 * La flecha back siempre funciona porque `router.back()` cierra la
 * pantalla actual sin importar el stack state — antes fallaba porque
 * el header nativo no estaba montado (headerShown false) y el botón
 * que se renderizaba en su lugar no estaba cableado.
 */
export function HeaderFlotante({ titulo, volverA, derecha }: Props) {
  const { colores: t } = useTema();
  const handleVolver = () => {
    if (volverA) {
      router.push(volverA as never);
    } else {
      router.back();
    }
  };
  return (
    <View style={estilos.contenedor}>
      <Pressable
        onPress={handleVolver}
        hitSlop={10}
        accessibilityLabel="Volver"
        style={({ pressed }) => [
          estilos.botonVolver,
          { backgroundColor: t.card, borderColor: t.borderMuted ?? 'transparent' },
          pressed && { opacity: 0.6 },
        ]}
      >
        <MorphIcon icon="lucide-arrow-left" size={20} color={t.ink} />
      </Pressable>
      <View style={[estilos.pillTitulo, { backgroundColor: t.card, borderColor: t.borderMuted ?? 'transparent' }]}>
        <Text style={[estilos.titulo, { color: t.ink }]} numberOfLines={1}>
          {titulo}
        </Text>
      </View>
      <View style={estilos.derecha}>{derecha}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  botonVolver: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pillTitulo: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  derecha: {
    minWidth: 38,
    alignItems: 'flex-end',
  },
});
