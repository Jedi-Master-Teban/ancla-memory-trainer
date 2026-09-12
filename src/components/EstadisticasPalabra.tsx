import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ResumenTarjeta } from '../db/repository';
import { useTema } from '../stores/tema';
import type { TokensColor } from '../tema/colores';

const ETIQUETA_ESTADO: Record<ResumenTarjeta['estadoVisual'], string> = {
  nueva: 'Nueva',
  aprendiendo: 'Aprendiendo',
  madura: 'Madura',
  en_riesgo: 'En riesgo',
};

export function EstadisticasPalabra({ vecesRevisada, tasaAciertos, proximaFecha, estadoVisual }: ResumenTarjeta) {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.linea}>Veces revisada: {vecesRevisada}</Text>
      <Text style={estilos.linea}>
        Tasa de aciertos: {tasaAciertos === null ? '—' : `${Math.round(tasaAciertos * 100)}%`}
      </Text>
      <Text style={estilos.linea}>Próxima revisión: {new Date(proximaFecha).toLocaleDateString()}</Text>
      <Text style={estilos.linea}>Estado: {ETIQUETA_ESTADO[estadoVisual]}</Text>
    </View>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { gap: 4, padding: 12 },
  linea: { color: t.inkMuted, fontSize: 13 },
});
