import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { obtenerBD } from '../../src/db/client';
import { crearLista, listarListas, listarObjetosDeLista } from '../../src/db/repository';
import type { ConexionBD, FilaLista } from '../../src/db/tipos';
import { useTema } from '../../src/stores/tema';
import type { TokensColor } from '../../src/tema/colores';
import { ResumenCategoria } from '../../src/components/ResumenCategoria';

const SEGUNDOS_ESTUDIO_DEFECTO = 30;

export default function ListasIndex() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [listas, setListas] = useState<FilaLista[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [nombreNueva, setNombreNueva] = useState('');

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const filas = await listarListas(conexion);
        const entradas = await Promise.all(
          filas.map(async (l) => [l.id, (await listarObjetosDeLista(conexion, l.id)).length] as const)
        );
        if (cancelado) return;
        setDb(conexion);
        setListas(filas);
        setConteos(Object.fromEntries(entradas));
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

  // El Stack no desmonta esta pantalla al entrar a una lista y volver —
  // useFocusEffect para que el conteo de objetos y nombre reflejen cambios
  // hechos en /listas/[id].
  useFocusEffect(cargar);

  async function crear() {
    if (!db || nombreNueva.trim().length === 0) return;
    const lista = await crearLista(db, { nombre: nombreNueva.trim(), segundosEstudio: SEGUNDOS_ESTUDIO_DEFECTO }, new Date());
    setNombreNueva('');
    router.push(`/listas/${lista.id}`);
  }

  if (cargando) {
    return (
      <View  style={estilos.centro}>
        <ActivityIndicator color={t.ink} />
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
    <>
      <HeaderFlotante titulo="Listas" volverA="/" />
      <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
        <ResumenCategoria categoria="lista_item" unidad="listas" />

        <View style={estilos.filaCrear}>
          <TextInput
            value={nombreNueva}
            onChangeText={setNombreNueva}
            placeholder="Nombre de la lista nueva..."
            placeholderTextColor={t.inkMuted}
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
    </>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: t.bg },
  contenido: { padding: 24, gap: 12 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
  error: { color: t.otraVez, padding: 24, textAlign: 'center' },
  aviso: { color: t.dificil },
  filaCrear: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: t.card,
    color: t.ink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  botonCrear: { backgroundColor: t.accent1, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  textoBotonCrear: { color: t.inkOnAccent, fontWeight: '600' },
  filaLista: { backgroundColor: t.card, borderRadius: 12, padding: 16 },
  nombreLista: { color: t.ink, fontSize: 18, fontWeight: '600' },
  detalleLista: { color: t.inkMuted, fontSize: 13, marginTop: 8 },
});
