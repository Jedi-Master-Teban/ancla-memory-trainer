import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../stores/tema';
import type { TokensColor } from '../tema/colores';

interface Props {
  frente: string;
  reverso: string;
  revelada: boolean;
  explicacion?: string;
}

export function Flashcard({ frente, reverso, revelada, explicacion }: Props) {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.frente}>{frente}</Text>
      {revelada ? (
        <>
          <Text style={estilos.reverso}>{reverso}</Text>
          {explicacion ? <Text style={estilos.explicacion}>{explicacion}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  tarjeta: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, minHeight: 200 },
  frente: { fontSize: 48, color: t.ink, fontWeight: '600' },
  reverso: { fontSize: 28, color: t.bien },
  explicacion: { fontSize: 14, color: t.inkMuted },
});
