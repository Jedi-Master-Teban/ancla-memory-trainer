import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide';
import { useTema } from '../stores/tema';
import { BotonRedondo, DIAMETRO_BOTON_REDONDO } from './BotonRedondo';

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
      {mostrarVolver && volverA && <BotonRedondo icono={ArrowLeft} etiqueta="Volver" onPress={handleVolver} />}
      <View style={estilos.zonaTitulo}>
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
  // El título va suelto sobre el fondo, sin pastilla ni borde: enmarcarlo
  // creaba una segunda barra por encima del contenido y la pantalla parecía
  // un navegador, no una app.
  zonaTitulo: {
    flex: 1,
    height: DIAMETRO_BOTON_REDONDO,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
  },
  derecha: {
    minWidth: DIAMETRO_BOTON_REDONDO,
    alignItems: 'flex-end',
  },
});
