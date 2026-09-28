import { MorphIcon, type IconInput } from 'morphicons/react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useTema } from '../stores/tema';

interface Props {
  icono: IconInput;
  /** Lo que lee VoiceOver: «Volver», «Cerrar». */
  etiqueta: string;
  onPress: () => void;
}

/** Diámetro del botón. `HeaderFlotante` alinea el título con este alto. */
export const DIAMETRO_BOTON_REDONDO = 38;

/**
 * Botón redondo de las cabeceras: círculo de superficie clara con el ícono en
 * tinta. Es la flecha de volver de `HeaderFlotante` y la ✕ de cerrar de
 * Hojear, que antes era un «✕» de texto de 18 px sin contenedor y costaba
 * verlo y acertarle. Un solo componente para que los dos no se separen.
 */
export function BotonRedondo({ icono, etiqueta, onPress }: Props) {
  const { colores: t } = useTema();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: t.card, borderColor: t.borderMuted ?? 'transparent' },
        pressed && { opacity: 0.6 },
      ]}
    >
      <MorphIcon icon={icono} size={20} color={t.ink} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: DIAMETRO_BOTON_REDONDO,
    height: DIAMETRO_BOTON_REDONDO,
    borderRadius: DIAMETRO_BOTON_REDONDO / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
