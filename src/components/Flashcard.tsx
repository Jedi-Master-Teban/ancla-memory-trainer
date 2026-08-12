import { StyleSheet, Text, View } from 'react-native';

interface Props {
  frente: string;
  reverso: string;
  revelada: boolean;
  explicacion?: string;
}

export function Flashcard({ frente, reverso, revelada, explicacion }: Props) {
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

const estilos = StyleSheet.create({
  tarjeta: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, minHeight: 200 },
  frente: { fontSize: 48, color: '#ffffff', fontWeight: '600' },
  reverso: { fontSize: 28, color: '#a6e3a1' },
  explicacion: { fontSize: 14, color: '#a6adc8' },
});
