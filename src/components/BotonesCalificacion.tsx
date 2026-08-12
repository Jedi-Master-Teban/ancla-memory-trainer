import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Calificacion } from '../domain/fsrs/scheduler';

interface Props {
  onCalificar: (calificacion: Calificacion) => void;
}

const OPCIONES: { valor: Calificacion; etiqueta: string; color: string }[] = [
  { valor: 'otra_vez', etiqueta: 'Otra vez', color: '#f38ba8' },
  { valor: 'dificil', etiqueta: 'Difícil', color: '#fab387' },
  { valor: 'bien', etiqueta: 'Bien', color: '#a6e3a1' },
  { valor: 'facil', etiqueta: 'Fácil', color: '#89b4fa' },
];

export function BotonesCalificacion({ onCalificar }: Props) {
  return (
    <View style={estilos.fila}>
      {OPCIONES.map((opcion) => (
        <Pressable
          key={opcion.valor}
          onPress={() => onCalificar(opcion.valor)}
          style={[estilos.boton, { backgroundColor: opcion.color }]}
        >
          <Text style={estilos.texto}>{opcion.etiqueta}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  boton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  texto: { color: '#1e1e2e', fontWeight: '600' },
});
