import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormularioGenerico } from '../../src/components/FormularioGenerico';
import { obtenerBD } from '../../src/db/client';
import { ARCHIVAR_CATEGORIA, GUARDAR_CATEGORIA, obtenerTarjeta } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { esCategoriaValida, REGISTRO } from '../../src/domain/categorias/registro';

/**
 * Ruta genérica de creación/edición (§8.6). `/crear/colgadero`,
 * `/crear/colgadero?id=X` (editar), `/crear/naipe?id=X` (editar, naipe nunca
 * se crea — ADR-025), `/crear/lista_item?listaId=X` (crear, siempre dentro
 * de una lista existente). `useLocalSearchParams` nunca da el union real de
 * `Categoria` (typed routes solo tipa segmentos dinámicos como string) — de
 * ahí el guard explícito con `esCategoriaValida`.
 */
export default function Crear() {
  const { categoria: categoriaParam, id, listaId } = useLocalSearchParams<{
    categoria: string;
    id?: string;
    listaId?: string;
  }>();
  const categoria = esCategoriaValida(categoriaParam) ? categoriaParam : null;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [tarjeta, setTarjeta] = useState<FilaTarjeta | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        if (!categoria) {
          throw new Error(`"${categoriaParam}" no es una categoría válida.`);
        }
        if (categoria === 'naipe' && !id) {
          throw new Error('Naipe no admite creación — el mazo es un conjunto cerrado de 52 cartas.');
        }
        if (categoria === 'lista_item' && !id && !listaId) {
          throw new Error('Falta listaId para crear un objeto de lista.');
        }
        const conexion = await obtenerBD();
        const existente = id ? await obtenerTarjeta(conexion, id) : null;
        if (id && !existente) {
          throw new Error(`No existe la tarjeta ${id}.`);
        }
        if (cancelado) return;
        setDb(conexion);
        setTarjeta(existente);
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
  }, [categoria, categoriaParam, id, listaId]);

  async function guardar(valores: Record<string, string>) {
    if (!db || !categoria) return;
    const valoresCompletos = categoria === 'lista_item' && listaId ? { ...valores, listaId } : valores;
    await GUARDAR_CATEGORIA[categoria](db, valoresCompletos, id, new Date());
    router.back();
  }

  function confirmarEliminar() {
    if (!db || !categoria || !id) return;
    const archivar = ARCHIVAR_CATEGORIA[categoria];
    if (!archivar) return;
    Alert.alert('Eliminar', `¿Eliminar "${tarjeta?.contenido_frente}"? Se archivará su historial de repaso.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await archivar(db, id);
          router.back();
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

  if (error || !categoria) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
      </View>
    );
  }

  const puedeEliminar = Boolean(ARCHIVAR_CATEGORIA[categoria] && id);

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      <Text style={estilos.titulo}>
        {id ? `Editar ${REGISTRO[categoria].etiquetaSingular}` : `${REGISTRO[categoria].etiquetaSingular} nuevo`}
      </Text>
      <FormularioGenerico categoria={categoria} tarjetaExistente={tarjeta ?? undefined} onGuardar={guardar} />
      {puedeEliminar ? (
        <Pressable onPress={confirmarEliminar} style={estilos.botonEliminar}>
          <Text style={estilos.textoEliminar}>Eliminar</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#f38ba8', textAlign: 'center' },
  titulo: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  botonEliminar: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  textoEliminar: { color: '#f38ba8', fontWeight: '600' },
});
