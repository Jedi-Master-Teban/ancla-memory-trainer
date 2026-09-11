import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../stores/tema';
import { recetaForma } from '../tema/colores';
import { Llama } from './Llama';
import type { EstadoRacha } from '../domain/racha/calculo';

/**
 * Píldora de racha del encabezado del dashboard (DESIGN.md §7.1).
 *
 * ES UN BOTÓN, y eso era un bug de v1: la racha solo se podía ver al terminar
 * una sesión. Es el número que más motiva de la app; tiene que estar a un tap
 * desde el inicio, siempre.
 */

interface Props {
  dias: number;
  estado: EstadoRacha;
  onPress: () => void;
}

export function StreakPill({ dias, estado, onPress }: Props) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Racha de ${dias} días. Ver mi racha.`}
      style={({ pressed }) => [
        estilos.pildora,
        {
          borderRadius: forma.rPill,
          backgroundColor: t.flameSoft,
          borderColor: t.flameSoft,
        },
        pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
      ]}
    >
      <Llama tamano={16} estado={estado} conHalo={false} />
      <Text style={[estilos.dias, { color: t.flameOuterEnd, fontFamily: tipografia.display }]}>{dias}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  dias: { fontSize: 14, fontWeight: '800' },
});
