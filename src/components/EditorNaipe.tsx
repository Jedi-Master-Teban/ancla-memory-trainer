import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { etiquetaCarta, validarPalabraNaipe, type Carta } from '../domain/fonetica/naipes';

interface Props {
  carta: Carta;
  palabraActual: string;
  onGuardar: (palabra: string) => void;
}

/**
 * Edición con validación no bloqueante (modulos/03-naipes.md): advierte si la
 * palabra no cumple la regla, pero nunca impide guardar — la lista es del
 * operador.
 */
export function EditorNaipe({ carta, palabraActual, onGuardar }: Props) {
  const [palabra, setPalabra] = useState(palabraActual);
  const resultado = palabra.trim().length > 0 ? validarPalabraNaipe(palabra.trim(), carta) : null;

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>{etiquetaCarta(carta)}</Text>
      <TextInput
        value={palabra}
        onChangeText={setPalabra}
        style={estilos.input}
        placeholder="Palabra..."
        placeholderTextColor="#6c7086"
        autoCapitalize="words"
      />
      {resultado && !resultado.valida ? <Text style={estilos.aviso}>{resultado.motivo}</Text> : null}
      {resultado?.advertencias.map((advertencia) => (
        <Text key={advertencia} style={estilos.advertencia}>
          {advertencia}
        </Text>
      ))}
      <Pressable onPress={() => onGuardar(palabra.trim())} style={estilos.boton}>
        <Text style={estilos.textoBoton}>Guardar</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 8, padding: 16, backgroundColor: '#313244', borderRadius: 12 },
  titulo: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  input: {
    backgroundColor: '#1e1e2e',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  aviso: { color: '#f38ba8', fontSize: 13 },
  advertencia: { color: '#f9e2af', fontSize: 13 },
  boton: { backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoBoton: { color: '#1e1e2e', fontWeight: '600' },
});
