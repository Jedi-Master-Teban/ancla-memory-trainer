import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { obtenerBD } from '../../src/db/client';
import { listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { useTema } from '../../src/stores/tema';

const MODOS = [
  { href: '/colgadero/flash' as const, etiqueta: 'Fonética Flash', descripcion: 'Número → palabra' },
  { href: '/colgadero/reverso' as const, etiqueta: 'Reverso', descripcion: 'Palabra → número' },
  { href: '/colgadero/velocidad' as const, etiqueta: 'Velocidad', descripcion: 'Serie cronometrada' },
];

type TabCategoria = 'repasar' | 'editar';

const SEGMENTOS: Array<{ id: TabCategoria; etiqueta: string }> = [
  { id: 'repasar', etiqueta: 'Repasar' },
  { id: 'editar', etiqueta: 'Editar' },
];

/**
 * Pantalla Colgadero — refactorizada en Fase 3 del plan UI para
 * separar los contextos "Repasar" y "Editar" (principio de testing
 * effect: el modo retrieval NO debe mezclarse con la lista editable
 * porque contamina la memoria).
 *
 * - Pestaña "Repasar": 3 modos (Fonética Flash / Reverso / Velocidad)
 *   + botón para añadir palabra nueva.
 * - Pestaña "Editar": lista de las 100 palabras ordenada por número,
 *   cada fila navega a la pantalla de creación con id (modo edición).
 */
export default function ColgaderoIndex() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [palabras, setPalabras] = useState<FilaTarjeta[]>([]);
  const [tab, setTab] = useState<TabCategoria>('repasar');
  const { colores: t } = useTema();

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion: ConexionBD = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'colgadero');
        const tarjetas = mazo ? await listarTarjetasPorMazo(conexion, mazo.id) : [];
        if (cancelado) return;
        setPalabras([...tarjetas].sort((a, b) => Number(a.contenido_frente) - Number(b.contenido_frente)));
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
      <HeaderFlotante titulo="Colgadero" />
      <ScrollView
        style={[estilos.contenedor, { backgroundColor: t.bg }]}
        contentContainerStyle={estilos.contenido}
      >
        <View style={estilos.segmentoWrap}>
          <SegmentedControl segmentos={SEGMENTOS} activo={tab} onChange={setTab} />
        </View>

        {tab === 'repasar' ? (
          <View style={estilos.seccion}>
            {MODOS.map((modo) => (
              <Link key={modo.href} href={modo.href} style={[estilos.tarjetaModo, { backgroundColor: t.card }]}>
                <Text style={[estilos.etiqueta, { color: t.ink }]}>{modo.etiqueta}</Text>
                <Text style={[estilos.descripcion, { color: t.inkMuted }]}>{modo.descripcion}</Text>
              </Link>
            ))}
          </View>
        ) : (
          <View style={estilos.seccion}>
            <Text style={[estilos.subtitulo, { color: t.ink }]}>
              Todas las palabras ({palabras.length})
            </Text>
            {palabras.map((tarjeta) => (
              <Link
                key={tarjeta.id}
                href={`/crear/colgadero?id=${tarjeta.id}` as never}
                style={[estilos.filaPalabra, { backgroundColor: t.card }]}
              >
                <Text style={[estilos.numeroPalabra, { color: t.inkMuted }]}>
                  {tarjeta.contenido_frente}
                </Text>
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
  tarjetaModo: { borderRadius: 12, padding: 16 },
  etiqueta: { fontSize: 18, fontWeight: '600' },
  descripcion: { fontSize: 13, marginTop: 8 },
  subtitulo: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  filaPalabra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  numeroPalabra: { fontSize: 14, width: 32 },
  textoPalabra: { fontWeight: '600' },
});
