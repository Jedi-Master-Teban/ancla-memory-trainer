import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MorphIcon } from 'morphicons/react-native';
import { useTema } from '../stores/tema';

interface Props {
  titulo: string;
  /** Si se omite, no muestra botón de volver. Si se pasa, navega a esa ruta específica. */
  volverA?: string;
  /** Acciones a la derecha (ej. botón ayuda / ajustes). */
  derecha?: React.ReactNode;
  /** Mostrar el botón de volver. Por defecto true, pero false en pantalla de inicio. */
  mostrarVolver?: boolean;
}

/**
 * Header flotante estilo iOS: pill arriba con flecha back + título. Se
 * usa en lugar del Stack.Screen header nativo cuando la pantalla
 * quiere un look unificado con el TabBar flotante (mismo blur, mismas
 * esquinas redondeadas). Compatible con `headerShown: false` en el
 * Stack.
 *
 * La flecha back NO usa router.back() porque eso actuaría como el
 * "regresar" del navegador web (saltando entre pestañas visitadas).
 * En su lugar, recibe una ruta explícita `volverA` que define a dónde
 * ir: típicamente la pantalla padre (categoría) o '/' (inicio).
 * En la pantalla de inicio se oculta con `mostrarVolver={false}`.
 */
export function HeaderFlotante({ titulo, volverA, derecha, mostrarVolver = true }: Props) {
  const { colores: t } = useTema();
  const handleVolver = () => {
    if (volverA) {
      router.push(volverA as never);
    }
  };
  return (
    <View style={estilos.contenedor}>
      {mostrarVolver && volverA && (
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
      )}
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
