import { StyleSheet, View } from 'react-native';
import { useTema } from '../stores/tema';

/**
 * Tramos de progreso de sesión (DESIGN.md §5.3).
 *
 * Sustituye a «3 / 18» como indicador principal — el texto se queda arriba a
 * la derecha, en pequeño. Un contador obliga a hacer una resta para saber
 * cuánto falta; una fila de tramos lo muestra sin leer, y de paso muestra
 * cómo va yendo: cada tramo pasado queda verde, el actual en acento, los que
 * faltan en el riel.
 *
 * No refleja la calificación de cada tarjeta a propósito (verde/ámbar/rojo por
 * tramo): a mitad de sesión eso invita a juzgarse, y la sesión es para
 * repasar, no para llevar la cuenta de los fallos. El desglose va en el
 * resumen, cuando ya no puede cambiar nada.
 */

interface Props {
  /** Total de tarjetas de la sesión. */
  total: number;
  /** Índice 0-based de la tarjeta actual. */
  indice: number;
}

export function TramosProgreso({ total, indice }: Props) {
  const { colores: t } = useTema();

  return (
    <View style={estilos.fila} accessibilityRole="progressbar" accessibilityLabel={`Tarjeta ${indice + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            estilos.tramo,
            { backgroundColor: i < indice ? t.bien : i === indice ? t.accent1 : t.track },
          ]}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 4 },
  tramo: { flex: 1, height: 4, borderRadius: 2 },
});
