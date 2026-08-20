import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EditorLista, type ObjetoEditable } from '../../src/components/EditorLista';
import { obtenerBD } from '../../src/db/client';
import {
  actualizarLista,
  eliminarLista,
  guardarObjetosDeLista,
  listarObjetosDeLista,
  obtenerLista,
} from '../../src/db/repository';
import type { ConexionBD, FilaLista, FilaListaObjeto } from '../../src/db/tipos';

export default function ListaDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [lista, setLista] = useState<FilaLista | null>(null);
  const [objetos, setObjetos] = useState<FilaListaObjeto[]>([]);
  const [segundosTexto, setSegundosTexto] = useState('30');

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const filaLista = await obtenerLista(conexion, id);
        if (!filaLista) throw new Error(`No existe la lista ${id}`);
        const filaObjetos = await listarObjetosDeLista(conexion, id);
        if (cancelado) return;
        setDb(conexion);
        setLista(filaLista);
        setObjetos(filaObjetos);
        setSegundosTexto(String(filaLista.segundos_estudio));
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
  }, [id]);

  // El Stack no desmonta esta pantalla al navegar a /crear/lista_item y
  // volver — useFocusEffect (no useEffect) para que un objeto agregado ahí
  // aparezca al regresar, mismo patrón ya establecido en index.tsx/racha.tsx.
  useFocusEffect(cargar);

  async function guardarObjetos(nuevos: ObjetoEditable[]) {
    if (!db) return;
    await guardarObjetosDeLista(db, id, nuevos, new Date());
    cargar();
  }

  async function guardarSegundos() {
    if (!db) return;
    const segundos = Number(segundosTexto);
    if (!Number.isFinite(segundos) || segundos <= 0) return;
    await actualizarLista(db, id, { segundosEstudio: Math.round(segundos) });
    cargar();
  }

  function confirmarEliminar() {
    Alert.alert('Eliminar lista', `¿Eliminar "${lista?.nombre}"? Se archivará su historial de repaso.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await eliminarLista(db, id);
          router.replace('/listas');
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

  if (error || !lista) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error ?? 'lista no encontrada'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      <Text style={estilos.titulo}>{lista.nombre}</Text>

      <View style={estilos.filaSegundos}>
        <Text style={estilos.etiquetaSegundos}>Segundos de estudio:</Text>
        <TextInput
          value={segundosTexto}
          onChangeText={setSegundosTexto}
          onBlur={guardarSegundos}
          keyboardType="number-pad"
          style={estilos.inputSegundos}
        />
      </View>

      {objetos.length >= 2 ? (
        <Link href={`/listas/estudiar?id=${lista.id}`} style={estilos.botonEstudiar}>
          <Text style={estilos.textoBotonEstudiar}>Estudiar ({objetos.length - 1} eslabones)</Text>
        </Link>
      ) : (
        <View style={estilos.botonEstudiarDeshabilitado}>
          <Text style={estilos.textoBotonEstudiarDeshabilitado}>
            Estudiar — agrega {2 - objetos.length} objeto{objetos.length === 1 ? '' : 's'} más
            {objetos.length > 0 ? ` (tienes ${objetos.length})` : ''}
          </Text>
        </View>
      )}

      <EditorLista
        key={objetos.map((o) => o.id).join('-')}
        objetos={objetos.map((o) => ({ id: o.id, texto: o.texto }))}
        onGuardar={guardarObjetos}
      />

      <Link href={`/crear/lista_item?listaId=${lista.id}`} style={estilos.botonAgregarObjeto}>
        <Text style={estilos.textoBotonAgregarObjeto}>+ Añadir objeto individual</Text>
      </Link>

      <Pressable onPress={confirmarEliminar} style={estilos.botonEliminar}>
        <Text style={estilos.textoBotonEliminar}>Eliminar lista</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, gap: 16 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  aviso: { color: '#f9e2af' },
  titulo: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  filaSegundos: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  etiquetaSegundos: { color: '#a6adc8' },
  inputSegundos: {
    backgroundColor: '#313244',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 70,
  },
  botonEstudiar: { backgroundColor: '#a6e3a1', borderRadius: 8, padding: 14, alignItems: 'center' },
  textoBotonEstudiar: { color: '#1e1e2e', fontWeight: '700' },
  botonEstudiarDeshabilitado: {
    backgroundColor: '#313244',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  textoBotonEstudiarDeshabilitado: { color: '#6c7086', fontWeight: '600' },
  botonAgregarObjeto: {
    borderWidth: 1,
    borderColor: '#45475a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotonAgregarObjeto: { color: '#89b4fa', fontWeight: '600', fontSize: 14 },
  botonEliminar: { padding: 12, alignItems: 'center', marginTop: 8 },
  textoBotonEliminar: { color: '#f38ba8' },
});
