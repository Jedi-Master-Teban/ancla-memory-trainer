import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export interface ObjetoEditable {
  id?: string;
  texto: string;
}

interface Props {
  objetos: ObjetoEditable[];
  onGuardar: (objetos: ObjetoEditable[]) => void;
}

/**
 * Editor de objetos de una lista encadenada: añadir/editar/reordenar/eliminar
 * (04-listas-cadena.md §5). Reordenar es por botones arriba/abajo, no
 * arrastrar — no hay ninguna librería de drag-and-drop instalada ni
 * verificada en este proyecto.
 */
export function EditorLista({ objetos, onGuardar }: Props) {
  const [filas, setFilas] = useState<ObjetoEditable[]>(objetos.length > 0 ? objetos : [{ texto: '' }]);

  function actualizarTexto(indice: number, texto: string) {
    setFilas((prev) => prev.map((f, i) => (i === indice ? { ...f, texto } : f)));
  }

  function eliminarFila(indice: number) {
    setFilas((prev) => prev.filter((_, i) => i !== indice));
  }

  function moverFila(indice: number, delta: number) {
    setFilas((prev) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { texto: '' }]);
  }

  function guardar() {
    const limpias = filas.filter((f) => f.texto.trim().length > 0).map((f) => ({ ...f, texto: f.texto.trim() }));
    onGuardar(limpias);
  }

  return (
    <View style={estilos.contenedor}>
      {filas.map((fila, indice) => (
        <View key={fila.id ?? `nueva-${indice}`} style={estilos.fila}>
          <Text style={estilos.numero}>{indice + 1}</Text>
          <TextInput
            value={fila.texto}
            onChangeText={(texto) => actualizarTexto(indice, texto)}
            style={estilos.input}
            placeholder="Objeto..."
            placeholderTextColor="#6c7086"
          />
          <Pressable onPress={() => moverFila(indice, -1)} disabled={indice === 0} style={estilos.botonChico}>
            <Text style={[estilos.textoBotonChico, indice === 0 && estilos.deshabilitado]}>↑</Text>
          </Pressable>
          <Pressable
            onPress={() => moverFila(indice, 1)}
            disabled={indice === filas.length - 1}
            style={estilos.botonChico}
          >
            <Text style={[estilos.textoBotonChico, indice === filas.length - 1 && estilos.deshabilitado]}>↓</Text>
          </Pressable>
          <Pressable onPress={() => eliminarFila(indice)} style={estilos.botonChico}>
            <Text style={estilos.textoEliminar}>✕</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={agregarFila} style={estilos.botonAgregar}>
        <Text style={estilos.textoBotonAgregar}>+ Añadir objeto</Text>
      </Pressable>

      <Pressable onPress={guardar} style={estilos.botonGuardar}>
        <Text style={estilos.textoBotonGuardar}>Guardar</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numero: { color: '#a6adc8', width: 20, textAlign: 'right' },
  input: {
    flex: 1,
    backgroundColor: '#313244',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  botonChico: { paddingHorizontal: 8, paddingVertical: 8 },
  textoBotonChico: { color: '#89b4fa', fontSize: 16 },
  deshabilitado: { color: '#45475a' },
  textoEliminar: { color: '#f38ba8', fontSize: 16 },
  botonAgregar: { paddingVertical: 10, alignItems: 'center' },
  textoBotonAgregar: { color: '#89b4fa', fontWeight: '600' },
  botonGuardar: { backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  textoBotonGuardar: { color: '#1e1e2e', fontWeight: '600' },
});
