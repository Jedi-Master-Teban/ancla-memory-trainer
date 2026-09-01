import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconoColgadero, IconoLista, IconoNaipe, IconoNumero } from '../src/components/iconos';
import { obtenerBD } from '../src/db/client';
import { contarElementosPorCategoria } from '../src/db/repository';
import type { Categoria } from '../src/db/tipos';
import { useTema } from '../src/stores/tema';
import { cardStyle, coloresDelTema, type TemaId } from '../src/tema/colores';

const RUTA_EDITAR: Record<Categoria, string> = {
  colgadero: '/colgadero',
  naipe: '/naipes',
  lista_item: '/listas',
  numero: '/numeros',
};

const ICONOS: Record<Categoria, (p: { color: string; tamano?: number }) => React.ReactElement> = {
  colgadero: IconoColgadero,
  naipe: IconoNaipe,
  lista_item: IconoLista,
  numero: IconoNumero,
};

const ETIQUETAS: Record<Categoria, string> = {
  colgadero: 'Colgadero',
  naipe: 'Naipes',
  lista_item: 'Listas',
  numero: 'Números',
};

/**
 * Vista global "Editar": lista las 4 categorías con conteo de elementos
 * y un botón para entrar a la pantalla de edición de cada una. Es la
 * pestaña "Editar" del TabBarInferior global (Fase 2.1 del plan UI).
 */
export default function Editar() {
  const { colores: t, tipografia, tema } = useTema();
  const [cargando, setCargando] = useState(true);
  const [conteos, setConteos] = useState<Record<Categoria, number>>({
    colgadero: 0,
    naipe: 0,
    lista_item: 0,
    numero: 0,
  });

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const db = await obtenerBD();
        const filas = await contarElementosPorCategoria(db);
        if (cancelado) return;
        const mapa: Record<Categoria, number> = {
          colgadero: 0,
          naipe: 0,
          lista_item: 0,
          numero: 0,
        };
        filas.forEach((f) => {
          mapa[f.categoria] = f.elementos;
        });
        setConteos(mapa);
        setCargando(false);
      } catch {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useFocusEffect(cargar);

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  const categorias: Categoria[] = ['colgadero', 'naipe', 'lista_item', 'numero'];
  // cardStyle necesita TemaId, lo derivamos del bg actual.
  const temaId: TemaId = coloresDelTema(tema).bg === t.bg ? tema : 'arcade';

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={estilos.contenido}
    >
      <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>
        Categorías
      </Text>
      <Text style={[estilos.descripcion, { color: t.inkMuted }]}>
        Toca una categoría para añadir, editar o eliminar elementos.
      </Text>
      {categorias.map((cat) => {
        const Icono = ICONOS[cat];
        return (
          <Pressable
            key={cat}
            onPress={() => router.push(RUTA_EDITAR[cat] as never)}
            style={[estilos.fila, cardStyle(temaId), { borderColor: t.borderMuted ?? 'transparent' }]}
          >
            <View style={[estilos.iconoWrap, { backgroundColor: `${t.accent1}1A` }]}>
              <Icono color={t.accent1} tamano={28} />
            </View>
            <View style={estilos.texto}>
              <Text style={[estilos.nombre, { color: t.ink, fontFamily: tipografia.display }]}>
                {ETIQUETAS[cat]}
              </Text>
              <Text style={[estilos.conteo, { color: t.inkMuted }]}>
                {conteos[cat]} {conteos[cat] === 1 ? 'elemento' : 'elementos'}
              </Text>
            </View>
            <Text style={[estilos.flecha, { color: t.inkMuted }]}>›</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 20, gap: 10, paddingBottom: 120 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitulo: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  descripcion: { fontSize: 13, marginBottom: 12 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  iconoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '700' },
  conteo: { fontSize: 12, marginTop: 2 },
  flecha: { fontSize: 28, fontWeight: '300' },
});
