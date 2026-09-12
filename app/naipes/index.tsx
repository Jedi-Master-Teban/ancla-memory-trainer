import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { EditorNaipe } from '../../src/components/EditorNaipe';
import { obtenerBD } from '../../src/db/client';
import { actualizarContenidoTarjeta, listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { etiquetaCarta, type Carta } from '../../src/domain/fonetica/naipes';
import { useTema } from '../../src/stores/tema';
import type { TokensColor } from '../../src/tema/colores';
import { ResumenCategoria } from '../../src/components/ResumenCategoria';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { PanelHojear } from '../../src/components/PanelHojear';
import { ordenarParaHojear } from '../../src/components/hojear-logic';
import { useHojearStore } from '../../src/stores/hojear';

const MODOS = [
  { href: '/naipes/flash' as const, etiqueta: 'Fonética Flash', descripcion: 'Carta → palabra' },
  { href: '/naipes/reverso' as const, etiqueta: 'Reverso', descripcion: 'Palabra → carta' },
  { href: '/naipes/velocidad' as const, etiqueta: 'Velocidad', descripcion: 'Serie cronometrada' },
  { href: '/naipes/baraja-completa' as const, etiqueta: 'Baraja Completa', descripcion: 'Memoriza y reproduce las 52' },
];

type TabCategoria = 'repasar' | 'hojear' | 'editar';

/** Hojear va en medio: es el puente entre reconocer y recordar. */
const SEGMENTOS: Array<{ id: TabCategoria; etiqueta: string }> = [
  { id: 'repasar', etiqueta: 'Repasar' },
  { id: 'hojear', etiqueta: 'Hojear' },
  { id: 'editar', etiqueta: 'Editar' },
];

interface FilaConCarta {
  tarjeta: FilaTarjeta;
  carta: Carta;
}

export default function NaipesIndex() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [filas, setFilas] = useState<FilaConCarta[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [tab, setTab] = useState<TabCategoria>('repasar');
  const guardado = useHojearStore((sel) => sel.posiciones.naipe);

  // El pie de la fila «Continuar»: la carta donde se dejó el carrusel.
  const etiquetaContinuar = useMemo(() => {
    if (guardado === undefined) return undefined;
    const fila = filas[guardado];
    return fila ? etiquetaCarta(fila.carta) : undefined;
  }, [guardado, filas]);

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'naipe');
        if (!mazo) {
          if (cancelado) return;
          setDb(conexion);
          setFilas([]);
          setCargando(false);
          return;
        }
        const tarjetas = await listarTarjetasPorMazo(conexion, mazo.id);
        const conCarta = ordenarParaHojear(tarjetas, 'naipe').map((tarjeta) => ({
          tarjeta,
          carta: JSON.parse(tarjeta.metadata_categoria) as Carta,
        }));
        if (cancelado) return;
        setDb(conexion);
        setFilas(conCarta);
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

  useFocusEffect(cargar);

  async function guardarPalabra(tarjetaId: string, palabra: string) {
    if (!db) return;
    await actualizarContenidoTarjeta(db, tarjetaId, { contenidoReverso: palabra });
    setEditando(null);
    cargar();
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
        <HeaderFlotante titulo="Naipes" volverA="/" />
        <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
        <ResumenCategoria categoria="naipe" unidad="cartas" />

        {filas.length === 0 ? (
          <Text style={estilos.aviso}>
            Todavía no hay mazo naipe sembrado — falta completar src/seed/naipes.ts y correr la migración.
          </Text>
        ) : (
          <View style={estilos.segmentoWrap}>
            <SegmentedControl segmentos={SEGMENTOS} activo={tab} onChange={setTab} />
          </View>
        )}

        {filas.length > 0 && tab === 'repasar'
          ? MODOS.map((modo) => (
              <Link key={modo.href} href={modo.href} style={estilos.tarjetaModo}>
                <Text style={estilos.etiqueta}>{modo.etiqueta}</Text>
                <Text style={estilos.descripcion}>{modo.descripcion}</Text>
              </Link>
            ))
          : null}

        {filas.length > 0 && tab === 'hojear' ? (
          <PanelHojear categoria="naipe" total={filas.length} etiquetaContinuar={etiquetaContinuar} />
        ) : null}

        {filas.length > 0 && tab === 'editar' ? (
          <>
            <Text style={estilos.subtitulo}>Las 52 cartas</Text>
            {filas.map(({ tarjeta, carta }) =>
              editando === tarjeta.id ? (
                <EditorNaipe
                  key={tarjeta.id}
                  carta={carta}
                  palabraActual={tarjeta.contenido_reverso}
                  onGuardar={(palabra) => guardarPalabra(tarjeta.id, palabra)}
                />
              ) : (
                <Pressable key={tarjeta.id} onPress={() => setEditando(tarjeta.id)} style={estilos.filaCarta}>
                  <Text style={estilos.etiquetaCarta}>{etiquetaCarta(carta)}</Text>
                  <Text style={estilos.palabraCarta}>{tarjeta.contenido_reverso || 'sin asignar'}</Text>
                </Pressable>
              )
            )}
          </>
        ) : null}
        </ScrollView>
      </>
    );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: t.bg },
  contenido: { padding: 24, gap: 12 },
  segmentoWrap: { marginBottom: 4 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
  subtitulo: { color: t.ink, fontSize: 18, fontWeight: '600', marginTop: 16 },
  aviso: { color: t.dificil },
  error: { color: t.otraVez, padding: 24, textAlign: 'center' },
  tarjetaModo: { backgroundColor: t.card, borderRadius: 12, padding: 16 },
  etiqueta: { color: t.ink, fontSize: 18, fontWeight: '600' },
  descripcion: { color: t.inkMuted, fontSize: 13, marginTop: 8 },
  filaCarta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: t.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  etiquetaCarta: { color: t.ink, fontWeight: '600' },
  palabraCarta: { color: t.inkMuted },
});
