import { useState, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { etiquetaCarta, validarPalabraNaipe, type Carta } from '../domain/fonetica/naipes';
import { useTema } from '../stores/tema';
import type { TokensColor } from '../tema/colores';

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
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
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
        placeholderTextColor={t.inkMuted}
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

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { gap: 8, padding: 16, backgroundColor: t.card, borderRadius: 12 },
  titulo: { color: t.ink, fontSize: 18, fontWeight: '700' },
  input: {
    backgroundColor: t.bg,
    color: t.ink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  aviso: { color: t.otraVez, fontSize: 13 },
  advertencia: { color: t.dificil, fontSize: 13 },
  boton: { backgroundColor: t.accent1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoBoton: { color: t.inkOnAccent, fontWeight: '600' },
});
