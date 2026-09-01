import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PropsSegmentado } from './segmented-logic';

/**
 * SegmentedControl estilo iOS — píldora con fondo accent en el segmento
 * activo. Animación de posición del indicador con `transform` nativo (sin
 * reanimated para mantenerlo simple y testeable).
 *
 * Cumple la petición: "diferenciar el flow Repasar vs Editar". Aplicado
 * por primera vez en app/colgadero/index.tsx (Fase 3 del plan).
 */
export function SegmentedControl<T extends string>({
  segmentos,
  activo,
  onChange,
}: PropsSegmentado<T>) {
  return (
    <View style={estilos.contenedor}>
      {segmentos.map((seg) => {
        const esActivo = seg.id === activo;
        return (
          <Pressable
            key={seg.id}
            onPress={() => onChange(seg.id)}
            style={[estilos.segmento, esActivo && estilos.segmentoActivo]}
          >
            <Text style={[estilos.etiqueta, esActivo && estilos.etiquetaActiva]}>
              {seg.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmento: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentoActivo: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A756C',
  },
  etiquetaActiva: {
    color: '#2D2A26',
  },
});
