import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { PanelHojear } from '../../src/components/PanelHojear';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { ordenarParaHojear } from '../../src/components/hojear-logic';
import { obtenerBD } from '../../src/db/client';
import { listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { useHojearStore } from '../../src/stores/hojear';
import { useTema } from '../../src/stores/tema';
import { cardStyle, recetaForma } from '../../src/tema/colores';
import { ResumenCategoria } from '../../src/components/ResumenCategoria';

const MODOS = [
  { href: '/colgadero/flash' as const, etiqueta: 'Fonética Flash', descripcion: 'Número → palabra' },
  { href: '/colgadero/reverso' as const, etiqueta: 'Reverso', descripcion: 'Palabra → número' },
  { href: '/colgadero/velocidad' as const, etiqueta: 'Velocidad', descripcion: 'Serie cronometrada' },
];

type TabCategoria = 'repasar' | 'hojear' | 'editar';

/**
 * Tres contextos, no dos (Fase 9): Repasar califica, Hojear solo muestra,
 * Editar cambia el dato. Hojear va en medio porque es el puente entre los
 * otros dos: se hojea para reconocer, se repasa para recordar.
 */
const SEGMENTOS: Array<{ id: TabCategoria; etiqueta: string }> = [
  { id: 'repasar', etiqueta: 'Repasar' },
  { id: 'hojear', etiqueta: 'Hojear' },
  { id: 'editar', etiqueta: 'Editar' },
];

export default function ColgaderoIndex() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [palabras, setPalabras] = useState<FilaTarjeta[]>([]);
  const [tab, setTab] = useState<TabCategoria>('repasar');
  const { colores: t, tipografia, tema } = useTema();
  const forma = recetaForma(tema);
  const guardado = useHojearStore((s) => s.posiciones.colgadero);

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion: ConexionBD = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'colgadero');
        const tarjetas = mazo ? await listarTarjetasPorMazo(conexion, mazo.id) : [];
        if (cancelado) return;
        setPalabras(ordenarParaHojear(tarjetas, 'colgadero'));
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

  const etiquetaContinuar = useMemo(() => {
    if (guardado === undefined) return undefined;
    return palabras[guardado]?.contenido_reverso || undefined;
  }, [guardado, palabras]);

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.error, { color: t.otraVez }]}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <>
      <HeaderFlotante titulo="Colgadero" volverA="/" />
      <ScrollView style={[estilos.contenedor, { backgroundColor: t.bg }]} contentContainerStyle={estilos.contenido}>
        <ResumenCategoria categoria="colgadero" unidad="palabras" />

        <View style={estilos.segmentoWrap}>
          <SegmentedControl segmentos={SEGMENTOS} activo={tab} onChange={setTab} />
        </View>

        {tab === 'repasar' ? (
          <View style={estilos.seccion}>
            {MODOS.map((modo) => (
              <Link
                key={modo.href}
                href={modo.href}
                style={[
                  estilos.tarjetaModo,
                  cardStyle(tema),
                  { borderRadius: forma.rCard, borderColor: t.borderMuted ?? 'transparent' },
                ]}
              >
                <Text style={[estilos.etiqueta, { color: t.ink, fontFamily: tipografia.display }]}>
                  {modo.etiqueta}
                </Text>
                <Text style={[estilos.descripcion, { color: t.inkMuted }]}>{modo.descripcion}</Text>
              </Link>
            ))}
          </View>
        ) : tab === 'hojear' ? (
          <PanelHojear categoria="colgadero" total={palabras.length} etiquetaContinuar={etiquetaContinuar} />
        ) : (
          <View style={estilos.seccion}>
            <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>
              Todas las palabras ({palabras.length})
            </Text>
            {palabras.map((tarjeta) => (
              <Link
                key={tarjeta.id}
                href={`/crear/colgadero?id=${tarjeta.id}` as never}
                style={[
                  estilos.filaPalabra,
                  cardStyle(tema),
                  { borderRadius: forma.rRow, borderColor: t.borderMuted ?? 'transparent' },
                ]}
              >
                <Text style={[estilos.numeroPalabra, { color: t.inkMuted }]}>{tarjeta.contenido_frente}</Text>
                <Text style={[estilos.textoPalabra, { color: t.ink }]}>
                  {tarjeta.contenido_reverso || 'sin asignar'}
                </Text>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  contenido: { padding: 24, gap: 16, paddingBottom: 120 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 24, textAlign: 'center' },
  segmentoWrap: { marginBottom: 4 },
  seccion: { gap: 12 },
  tarjetaModo: { borderWidth: 1, padding: 16 },
  etiqueta: { fontSize: 18, fontWeight: '700' },
  descripcion: { fontSize: 13, marginTop: 8 },
  subtitulo: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  filaPalabra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  numeroPalabra: { fontSize: 14, width: 32 },
  textoPalabra: { fontWeight: '700' },
});
