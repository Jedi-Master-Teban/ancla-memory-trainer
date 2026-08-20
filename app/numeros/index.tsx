import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { obtenerBD } from '../../src/db/client';
import {
  editarNumeroImportante,
  eliminarNumeroImportante,
  listarNumerosImportantes,
  listarTarjetasPorMazo,
  obtenerMazoPorCategoria,
} from '../../src/db/repository';
import type { ConexionBD, FilaNumeroImportante } from '../../src/db/tipos';
import { descomponer, type Trozo } from '../../src/domain/numeros/descomposicion';

export default function NumerosIndex() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [numeros, setNumeros] = useState<FilaNumeroImportante[]>([]);
  const [mapaColgadero, setMapaColgadero] = useState<Map<number, string>>(new Map());
  const [editando, setEditando] = useState<string | null>(null);
  const [etiquetaEdit, setEtiquetaEdit] = useState('');
  const [digitosEdit, setDigitosEdit] = useState('');

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const [filas, mazoColgadero] = await Promise.all([
          listarNumerosImportantes(conexion),
          obtenerMazoPorCategoria(conexion, 'colgadero'),
        ]);
        const tarjetasColgadero = mazoColgadero ? await listarTarjetasPorMazo(conexion, mazoColgadero.id) : [];
        if (cancelado) return;
        setDb(conexion);
        setNumeros(filas);
        setMapaColgadero(new Map(tarjetasColgadero.map((t) => [Number(t.contenido_frente), t.contenido_reverso])));
        setCargando(false);
      } catch (e) {
        if (!cancelado) {
          setError(String(e));
          setCargando(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // El Stack no desmonta esta pantalla al ir a /numeros/nuevo y volver —
  // useFocusEffect para que el número recién creado aparezca sin recargar
  // la app a mano.
  useFocusEffect(cargar);

  const trozosEdit: Trozo[] = useMemo(() => {
    if (digitosEdit.length === 0) return [];
    try {
      return descomponer(digitosEdit, (valor) => mapaColgadero.get(valor));
    } catch {
      return [];
    }
  }, [digitosEdit, mapaColgadero]);

  function empezarEdicion(numero: FilaNumeroImportante) {
    setEditando(numero.id);
    setEtiquetaEdit(numero.etiqueta);
    setDigitosEdit(numero.digitos);
  }

  async function guardarEdicion(id: string) {
    if (!db) return;
    await editarNumeroImportante(db, id, { etiqueta: etiquetaEdit.trim(), digitos: digitosEdit.trim() });
    setEditando(null);
    cargar();
  }

  function confirmarEliminar(numero: FilaNumeroImportante) {
    Alert.alert('Eliminar número', `¿Eliminar "${numero.etiqueta}"? Se archivará su historial de repaso.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await eliminarNumeroImportante(db, numero.id);
          cargar();
        },
      },
    ]);
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      <View style={estilos.filaBotones}>
        <Link href="/numeros/nuevo" style={estilos.boton}>
          <Text style={estilos.textoBoton}>+ Número nuevo</Text>
        </Link>
        {numeros.length > 0 ? (
          <Link href="/numeros/repasar" style={[estilos.boton, estilos.botonRepasar]}>
            <Text style={estilos.textoBoton}>Repasar</Text>
          </Link>
        ) : null}
      </View>

      {numeros.length === 0 ? (
        <Text style={estilos.aviso}>Todavía no hay números importantes guardados.</Text>
      ) : (
        numeros.map((numero) =>
          editando === numero.id ? (
            <View key={numero.id} style={estilos.filaEdicion}>
              <TextInput
                value={etiquetaEdit}
                onChangeText={setEtiquetaEdit}
                placeholder="Etiqueta..."
                placeholderTextColor="#6c7086"
                style={estilos.input}
              />
              <TextInput
                value={digitosEdit}
                onChangeText={(texto) => setDigitosEdit(texto.replace(/[^0-9]/g, ''))}
                placeholder="Dígitos..."
                placeholderTextColor="#6c7086"
                keyboardType="number-pad"
                style={estilos.input}
              />
              {trozosEdit.length > 0 ? (
                <View style={estilos.bloquePreview}>
                  <Text style={estilos.tituloPreview}>Descomposición</Text>
                  {trozosEdit.map((trozo, i) => (
                    <Text key={i} style={estilos.filaTrozo}>
                      {trozo.digitos} → {trozo.palabra ?? 'sin colgadero'}
                    </Text>
                  ))}
                </View>
              ) : null}
              <Pressable onPress={() => guardarEdicion(numero.id)} style={estilos.botonGuardar}>
                <Text style={estilos.textoBoton}>Guardar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable key={numero.id} onPress={() => empezarEdicion(numero)} style={estilos.filaNumero}>
              <View>
                <Text style={estilos.etiquetaNumero}>{numero.etiqueta}</Text>
                <Text style={estilos.digitosNumero}>{numero.digitos}</Text>
              </View>
              <Pressable onPress={() => confirmarEliminar(numero)} hitSlop={8}>
                <Text style={estilos.textoEliminar}>✕</Text>
              </Pressable>
            </Pressable>
          )
        )
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, gap: 12 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  aviso: { color: '#f9e2af' },
  filaBotones: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  boton: { flex: 1, backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  botonRepasar: { backgroundColor: '#a6e3a1' },
  textoBoton: { color: '#1e1e2e', fontWeight: '600' },
  filaNumero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#313244',
    borderRadius: 12,
    padding: 16,
  },
  etiquetaNumero: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  digitosNumero: { color: '#a6adc8', fontSize: 14, marginTop: 4 },
  textoEliminar: { color: '#f38ba8', fontSize: 16 },
  filaEdicion: { backgroundColor: '#313244', borderRadius: 12, padding: 16, gap: 8 },
  input: {
    backgroundColor: '#1e1e2e',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  botonGuardar: { backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  bloquePreview: { backgroundColor: '#1e1e2e', borderRadius: 8, padding: 12, gap: 4 },
  tituloPreview: { color: '#ffffff', fontWeight: '600', marginBottom: 2 },
  filaTrozo: { color: '#a6e3a1', fontSize: 14 },
});
