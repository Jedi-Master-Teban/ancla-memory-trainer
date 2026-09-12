import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../stores/tema';
import { recetaForma } from '../tema/colores';
import type { PropsSegmentado } from './segmented-logic';

/**
 * SegmentedControl estilo iOS — píldora hundida (`cardAlt`) con el segmento
 * activo elevado (`card`).
 *
 * Reescrito en Fase 9: la versión anterior tenía los tres colores escritos a
 * mano (`rgba(0,0,0,0.06)`, `#FFFFFF`, `#7A756C`), así que en Arcade y en
 * Papel se veía como un parche de Soft UI. Ahora sale de tokens, y el radio de
 * la receta de forma (en Papel queda cuadrado, sin sombra).
 *
 * Soporta 3 segmentos sin cambios: Repasar · Hojear · Editar.
 */
export function SegmentedControl<T extends string>({ segmentos, activo, onChange }: PropsSegmentado<T>) {
  const { colores: t, tema } = useTema();
  const forma = recetaForma(tema);

  return (
    <View style={[estilos.contenedor, { backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]}>
      {segmentos.map((seg) => {
        const esActivo = seg.id === activo;
        return (
          <Pressable
            key={seg.id}
            onPress={() => onChange(seg.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: esActivo }}
            style={[
              estilos.segmento,
              { borderRadius: Math.max(forma.rIcon - 3, 2) },
              esActivo && { backgroundColor: t.card },
              esActivo && tema === 'soft' && estilos.elevacionSoft,
              esActivo && tema === 'arcade' && { backgroundColor: t.pill },
            ]}
          >
            <Text
              style={[
                estilos.etiqueta,
                { color: esActivo ? (tema === 'arcade' ? t.accent1 : t.ink) : t.inkMuted },
              ]}
            >
              {seg.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', padding: 3, gap: 3 },
  segmento: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center' },
  elevacionSoft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  etiqueta: { fontSize: 13, fontWeight: '700' },
});
