import { StyleSheet, Text, View } from 'react-native';
import type { EstadoRacha } from '../domain/racha/calculo';

interface Props {
  diasConsecutivos: number;
  estado: EstadoRacha;
}

const ESTILO_POR_ESTADO: Record<EstadoRacha, { color: string; opacidad: number }> = {
  activa: { color: '#fab387', opacidad: 1 },
  en_riesgo: { color: '#fab387', opacidad: 0.45 },
  rota: { color: '#6c7086', opacidad: 1 },
};

/** Llama + contador (07-racha.md §5) — intensidad cambia según `estado`, sin librería de animación (§6 del brief). */
export function IndicadorRacha({ diasConsecutivos, estado }: Props) {
  const { color, opacidad } = ESTILO_POR_ESTADO[estado];
  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.llama, { color, opacity: opacidad }]}>🔥</Text>
      <Text style={estilos.dias}>{diasConsecutivos}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  llama: { fontSize: 32 },
  dias: { fontSize: 28, color: '#ffffff', fontWeight: '700' },
});
