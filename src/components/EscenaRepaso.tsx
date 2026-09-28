import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../stores/tema';
import { recetaForma } from '../tema/colores';

/**
 * El escenario de toda sesión de repaso: la tarjeta arriba, la acción abajo.
 *
 * Antes cada pantalla metía tarjeta y botones en un mismo contenedor centrado:
 * el conjunto quedaba a media altura y en el iPhone sobraban unos 230 px vacíos
 * debajo, lejos del pulgar. Ahora son dos zonas:
 *
 *   - La tarjeta ocupa todo el alto libre y se centra en él.
 *   - La acción va anclada al fondo, en la zona del pulgar.
 *
 * La zona de acción reserva el alto de su estado MÁS grande (la pausa de
 * visualización, con su anillo y su instrucción encima del botón) y alinea su
 * contenido al fondo. Sin esa reserva, la zona cambiaba de alto tres veces por
 * tarjeta (pausa → «Ver respuesta» → calificar) y la tarjeta saltaba con ella.
 * Así la tarjeta no se mueve, y «Ver respuesta» y los botones de calificar caen
 * en el mismo sitio: el pulgar no tiene que buscar.
 *
 * Hojear usa el mismo escenario aunque no califica: así su tarjeta queda a la
 * misma altura y con el mismo alto que al repasar, y cualquier ajuste de aquí
 * (como `MARGEN_INFERIOR`) le llega sin tocarlo.
 */
interface Props {
  tarjeta: ReactNode;
  accion: ReactNode;
  /**
   * La zona de la tarjeta sin margen lateral. Para el carrusel de Hojear, que
   * necesita todo el ancho de la pantalla para que se asomen las vecinas.
   */
  aLoAncho?: boolean;
  /**
   * Alto que le corresponde a la tarjeta, ya acotado igual que `Flashcard`.
   * Para quien no puede crecer con flex: las tarjetas de un carrusel
   * horizontal necesitan un alto explícito.
   */
  onAltoTarjeta?: (alto: number) => void;
}

/**
 * Límites del alto de la tarjeta: crece hasta llenar la zona, pero en un
 * teléfono alto no pasa de 460 (un rectángulo gigante con un número pequeño)
 * ni baja de 260 en uno bajo. Los usan `Flashcard` y el carrusel de Hojear,
 * para que la misma tarjeta tenga el mismo tamaño al repasar y al hojear.
 */
export const ALTO_MIN_TARJETA = 260;
export const ALTO_MAX_TARJETA = 460;
const RELLENO_VERTICAL = 12;

/**
 * Alto del estado más grande de la acción: la pausa de visualización (anillo 58
 * + separación 16 + instrucción ~17 + margen 16) encima del botón de 58.
 */
const ALTO_CONTENIDO_ACCION = 166;
/**
 * Margen bajo la acción, antes del indicador de inicio.
 *
 * 100 y no 20, ajustado por el operador probándolo en su iPhone (primero +30,
 * luego +50): pegados al borde, el botón del lado opuesto a la mano dominante
 * quedaba al final del arco del pulgar. A esta altura cae dentro de su radio
 * natural y se alcanza sin estirar el dedo.
 */
const MARGEN_INFERIOR = 100;

export function EscenaRepaso({ tarjeta, accion, aLoAncho = false, onAltoTarjeta }: Props) {
  // En la PWA vale 0: iOS ya deja la app por encima del indicador de inicio.
  // En nativo es el margen real del indicador.
  const insets = useSafeAreaInsets();
  return (
    <View style={estilos.escena}>
      <View
        style={[estilos.zonaTarjeta, aLoAncho && estilos.zonaALoAncho]}
        onLayout={
          onAltoTarjeta
            ? (e) => {
                const libre = e.nativeEvent.layout.height - RELLENO_VERTICAL * 2;
                onAltoTarjeta(Math.min(ALTO_MAX_TARJETA, Math.max(ALTO_MIN_TARJETA, libre)));
              }
            : undefined
        }
      >
        {tarjeta}
      </View>
      {/* minHeight incluye el relleno (el alto es de caja completa), así que la
          reserva lleva el margen sumado: sin eso la zona crecía durante la pausa
          y la tarjeta subía unos píxeles al terminar. */}
      <View
        style={[
          estilos.zonaAccion,
          {
            paddingBottom: MARGEN_INFERIOR + insets.bottom,
            minHeight: ALTO_CONTENIDO_ACCION + MARGEN_INFERIOR + insets.bottom,
          },
        ]}
      >
        {accion}
      </View>
    </View>
  );
}

/**
 * «Ver respuesta» a todo el ancho y con el alto de un botón de calificar, para
 * que ocupe el mismo lugar que los cuatro botones que aparecen al pulsarlo.
 * Mismo color de acento que antes: solo cambian forma y posición.
 */
export function BotonRevelar({ onPress }: { onPress: () => void }) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ver respuesta"
      style={({ pressed }) => [
        estilos.revelar,
        forma.sombraCta(t),
        { backgroundColor: t.accent1, borderRadius: forma.rBtn },
        pressed && estilos.presionado,
      ]}
    >
      <Text style={[estilos.textoRevelar, { color: t.inkOnAccent, fontFamily: tipografia.display }]}>
        Ver respuesta
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  escena: { flex: 1 },
  zonaTarjeta: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: RELLENO_VERTICAL,
  },
  zonaALoAncho: { paddingHorizontal: 0, alignItems: 'stretch' },
  zonaAccion: { justifyContent: 'flex-end' },
  revelar: {
    marginHorizontal: 16,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  textoRevelar: { fontSize: 16, fontWeight: '800' },
});
