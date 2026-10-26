import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormularioGenerico } from '../../src/components/FormularioGenerico';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { obtenerBD } from '../../src/db/client';
import { ARCHIVAR_CATEGORIA, GUARDAR_CATEGORIA, obtenerTarjeta } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { esCategoriaValida, REGISTRO } from '../../src/domain/categorias/registro';
import type { Categoria } from '../../src/db/tipos';
import { useTema } from '../../src/stores/tema';
import type { TokensColor } from '../../src/tema/colores';
import { confirmar } from '../../src/stores/dialogo';

/** A dónde vuelve el header de cada categoría. */
const RUTA_CATEGORIA: Record<Categoria, string> = {
  colgadero: '/colgadero',
  naipe: '/naipes',
  lista_item: '/listas',
  numero: '/numeros',
};

/**
 * Ruta genérica de creación/edición (§8.6). `/crear/colgadero`,
 * `/crear/colgadero?id=X` (editar), `/crear/naipe?id=X` (editar, naipe nunca
 * se crea — ADR-025), `/crear/lista_item?listaId=X` (crear, siempre dentro
 * de una lista existente). `useLocalSearchParams` nunca da el union real de
 * `Categoria` (typed routes solo tipa segmentos dinámicos como string) — de
 * ahí el guard explícito con `esCategoriaValida`.
 */
export default function Crear() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const { categoria: categoriaParam, id, listaId } = useLocalSearchParams<{
    categoria: string;
    id?: string;
    listaId?: string;
  }>();
  const categoria = esCategoriaValida(categoriaParam) ? categoriaParam : null;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cosas que no son una falla sino algo que no se puede hacer: se explican
  // con palabras, sin «Error:» (se llega aquí por un enlace directo).
  const [aviso, setAviso] = useState<string | null>(null);
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
          setAviso('Los naipes son 52 cartas fijas, así que no se pueden crear nuevos. Lo que sí puedes es cambiar la palabra de cada carta desde Naipes.');
          setCargando(false);
          return;
        }
        if (categoria === 'lista_item' && !id && !listaId) {
          setAviso('Un objeto siempre pertenece a una lista. Entra a una lista y usa «+» para añadirle objetos, o crea una lista nueva.');
          setCargando(false);
          return;
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

  async function confirmarEliminar() {
    if (!db || !categoria || !id) return;
    const archivar = ARCHIVAR_CATEGORIA[categoria];
    if (!archivar) return;
    const eliminar = await confirmar({
      titulo: 'Eliminar',
      mensaje: `¿Eliminar "${tarjeta?.contenido_frente}"? Se archivará su historial de repaso.`,
      accion: 'Eliminar',
      destructiva: true,
    });
    if (!eliminar) return;
    await archivar(db, id);
    router.back();
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (aviso) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.aviso}>{aviso}</Text>
        <Pressable onPress={() => router.replace((categoria === 'naipe' ? '/naipes' : '/listas') as never)}>
          <Text style={estilos.enlaceAviso}>{categoria === 'naipe' ? 'Ir a Naipes' : 'Ir a Listas'}</Text>
        </Pressable>
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
      <HeaderFlotante
        titulo={
          id
            ? `Editar ${REGISTRO[categoria].etiquetaSingular}`
            : `${REGISTRO[categoria].etiquetaSingular} nuevo`
        }
        volverA={RUTA_CATEGORIA[categoria]}
      />
      <FormularioGenerico categoria={categoria} tarjetaExistente={tarjeta ?? undefined} onGuardar={guardar} />
      {puedeEliminar ? (
        <Pressable onPress={confirmarEliminar} style={estilos.botonEliminar}>
          <Text style={estilos.textoEliminar}>Eliminar</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: t.bg },
  contenido: { padding: 24 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: t.otraVez, textAlign: 'center' },
  aviso: { color: t.ink, textAlign: 'center', fontSize: 16, lineHeight: 24, maxWidth: 340 },
  enlaceAviso: { color: t.accent1, fontWeight: '800', fontSize: 16, marginTop: 16, padding: 8 },
  titulo: { color: t.ink, fontSize: 20, fontWeight: '700' },
  botonEliminar: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  textoEliminar: { color: t.otraVez, fontWeight: '600' },
});
