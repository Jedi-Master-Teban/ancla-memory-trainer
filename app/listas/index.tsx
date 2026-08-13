import { Link, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { obtenerBD } from '../../src/db/client';
import { crearLista, listarListas, listarObjetosDeLista } from '../../src/db/repository';
import type { ConexionBD, FilaLista } from '../../src/db/tipos';

const SEGUNDOS_ESTUDIO_DEFECTO = 30;

export default function ListasIndex() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [listas, setListas] = useState<FilaLista[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [nombreNueva, setNombreNueva] = useState('');

  const cargar = useCallback(async () => {
    try {
      const conexion = await obtenerBD();
      const filas = await listarListas(conexion);
      const entradas = await Promise.all(
        filas.map(async (l) => [l.id, (await listarObjetosDeLista(conexion, l.id)).length] as const)
      );
      setDb(conexion);
      setListas(filas);
      setConteos(Object.fromEntries(entradas));
      setCargando(false);
    } catch (e) {
      setError(String(e));
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear() {
    if (!db || nombreNueva.trim().length === 0) return;
    const lista = await crearLista(db, { nombre: nombreNueva.trim(), segundosEstudio: SEGUNDOS_ESTUDIO_DEFECTO }, new Date());
    setNombreNueva('');
    await cargar();
    router.push(`/listas/${lista.id}`);
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
      <View style={estilos.filaCrear}>
        <TextInput
          value={nombreNueva}
          onChangeText={setNombreNueva}
          placeholder="Nombre de la lista nueva..."
          placeholderTextColor="#6c7086"
          style={estilos.input}
        />
        <Pressable onPress={crear} style={estilos.botonCrear}>
          <Text style={estilos.textoBotonCrear}>Crear</Text>
        </Pressable>
      </View>

      {listas.length === 0 ? (
        <Text style={estilos.aviso}>Todavía no hay listas. Crea la primera arriba.</Text>
      ) : (
        listas.map((lista) => (
          <Link key={lista.id} href={`/listas/${lista.id}`} style={estilos.filaLista}>
            <Text style={estilos.nombreLista}>{lista.nombre}</Text>
            <Text style={estilos.detalleLista}>
              {conteos[lista.id] ?? 0} objetos · {lista.segundos_estudio}s de estudio
            </Text>
          </Link>
        ))
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
  filaCrear: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#313244',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  botonCrear: { backgroundColor: '#89b4fa', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  textoBotonCrear: { color: '#1e1e2e', fontWeight: '600' },
  filaLista: { backgroundColor: '#313244', borderRadius: 12, padding: 16 },
  nombreLista: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  detalleLista: { color: '#a6adc8', fontSize: 13, marginTop: 8 },
});
