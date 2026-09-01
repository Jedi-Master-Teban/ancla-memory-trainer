import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { LineChart } from '../src/components/LineChart';
import { RadarChart } from '../src/components/RadarChart';
import { TarjetasProblematicas } from '../src/components/TarjetasProblematicas';
import { obtenerBD, rutaArchivoBD } from '../src/db/client';
import { listarDiasPractica, obtenerPanelRetencion } from '../src/db/repository';
import type { ConexionBD, FilaDiaPractica } from '../src/db/tipos';
import type { Categoria } from '../src/db/tipos';
import type { PanelRetencion, Ventana } from '../src/domain/estadisticas/retencion';
import { generarInsights, type Insight } from '../src/domain/estadisticas/insights';
import { retencionPorCategoria, type RetencionPorCategoria } from '../src/domain/estadisticas/retencion-categorias';
import { useTema } from '../src/stores/tema';
import type { PuntoLinea, PeriodoLineChart } from '../src/components/line-chart-logic';

const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  colgadero: 'Colgadero',
  naipe: 'Naipes',
  lista_item: 'Listas',
  numero: 'Números',
};

const VENTANAS: { valor: Ventana; etiqueta: string }[] = [
  { valor: '7d', etiqueta: '7 días' },
  { valor: '30d', etiqueta: '30 días' },
  { valor: 'todo', etiqueta: 'Todo' },
];

/**
 * Panel de retención (§8.8, agent_docs/modulos/08-panel-retencion.md). El
 * `done when` de esta fase exige comparar cada número contra una consulta
 * SQL manual (agent_docs/consultas-verificacion.sql) — por eso se muestra el
 * `ahora` exacto de la carga: la consulta manual necesita ese mismo instante,
 * no una aproximación de cuándo el operador miró la pantalla.
 *
 * Historial de sesiones vive en su propia pantalla (app/historial-sesiones.tsx),
 * no aquí: con "Tarjetas problemáticas" ya larga, una sección expandible al
 * fondo obligaba a un scroll excesivo — feedback real del operador probando
 * en el dispositivo.
 */
export default function Estadisticas() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventana, setVentana] = useState<Ventana>('30d');
  const [panel, setPanel] = useState<PanelRetencion | null>(null);
  const [ahoraCarga, setAhoraCarga] = useState<Date | null>(null);
  const [dias, setDias] = useState<FilaDiaPractica[]>([]);
  const [retencion, setRetencion] = useState<RetencionPorCategoria>({
    colgadero: 0, naipe: 0, lista_item: 0, numero: 0,
  });
  const [periodoLinea, setPeriodoLinea] = useState<PeriodoLineChart>('dia');
  const { colores: t } = useTema();

  const puntosLinea: PuntoLinea[] = useMemo(
    () => dias.map((d) => ({ fecha: d.fecha_local, valor: d.tarjetas_revisadas })),
    [dias],
  );

  const insightsVisibles: Insight[] = useMemo(
    () =>
      generarInsights({
        retencion,
        xpSemanaActual: 0,
        xpSemanaAnterior: 0,
        diasConsecutivos: 0,
        xpHoy: 0,
        metaDiaria: 20,
      }),
    [retencion],
  );

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion: ConexionBD = await obtenerBD();
        const ahora = new Date();
        const [panelCalculado, diasPractica, retencionCats] = await Promise.all([
          obtenerPanelRetencion(conexion, ventana, ahora),
          listarDiasPractica(conexion),
          retencionPorCategoria(conexion, ventana, ahora),
        ]);
        if (cancelado) return;
        setAhoraCarga(ahora);
        setPanel(panelCalculado);
        setDias(diasPractica);
        setRetencion(retencionCats);
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
  }, [ventana]);

  useFocusEffect(cargar);

  async function exportarBD() {
    try {
      const ruta = await rutaArchivoBD();
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('No disponible', 'Compartir archivos no está disponible en este dispositivo.');
        return;
      }
      await Sharing.shareAsync(`file://${ruta}`);
    } catch (e) {
      Alert.alert('Error al exportar', String(e));
    }
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (error || !panel) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={estilos.contenedorScroll}
      contentContainerStyle={estilos.contenido}
      refreshControl={
        <RefreshControl
          refreshing={cargando}
          onRefresh={cargar}
          tintColor={t.accent1}
          colors={[t.accent1]}
          progressBackgroundColor={t.card}
        />
      }
    >
      <View style={estilos.filaVentanas}>
        {VENTANAS.map(({ valor, etiqueta }) => (
          <Pressable
            key={valor}
            onPress={() => setVentana(valor)}
            style={[estilos.botonVentana, ventana === valor && estilos.botonVentanaActivo]}
          >
            <Text style={[estilos.textoVentana, ventana === valor && estilos.textoVentanaActivo]}>{etiqueta}</Text>
          </Pressable>
        ))}
      </View>

      {panel.porCategoria.length >= 3 && (
        <View style={[estilos.bloqueRadar, { backgroundColor: t.card, borderColor: t.borderMuted ?? 'transparent' }]}>
          <RadarChart
            etiquetas={panel.porCategoria.map((m) => ETIQUETA_CATEGORIA[m.categoria])}
            valores={panel.porCategoria.map((m) => m.porcentajeRetencion ?? 0)}
            tamano={280}
            titulo="Retención por categoría"
            subtitulo={`Últimos ${ventana === 'todo' ? 'todos los días' : ventana === '7d' ? '7 días' : '30 días'}`}
          />
        </View>
      )}

      {puntosLinea.length > 0 && (
        <View style={[estilos.bloqueLinea, { backgroundColor: t.card, borderColor: t.borderMuted ?? 'transparent' }]}>
          <LineChart
            puntos={puntosLinea}
            titulo="Tarjetas por día"
            subtitulo="XP ganado (cada tarjeta = 1 XP)"
            metaY={20}
            periodos={['dia', 'semana', 'mes', 'todo']}
            periodoActivo={periodoLinea}
            onCambiarPeriodo={setPeriodoLinea}
          />
        </View>
      )}

      {insightsVisibles.length > 0 && (
        <View style={estilos.bloqueInsights}>
          {insightsVisibles.map((ins, i) => (
            <View
              key={i}
              style={[
                estilos.insight,
                {
                  backgroundColor:
                    ins.tipo === 'alerta'
                      ? '#FEF3C7'
                      : ins.tipo === 'positivo'
                      ? '#D1FAE5'
                      : ins.tipo === 'motivacion'
                      ? '#DBEAFE'
                      : t.card,
                  borderLeftColor:
                    ins.tipo === 'alerta'
                      ? '#F59E0B'
                      : ins.tipo === 'positivo'
                      ? '#10B981'
                      : ins.tipo === 'motivacion'
                      ? '#3B82F6'
                      : t.borderMuted ?? t.inkMuted,
                },
              ]}
            >
              <Text style={[estilos.insightTitulo, { color: t.ink }]}>{ins.titulo}</Text>
              {ins.detalle && (
                <Text style={[estilos.insightDetalle, { color: t.inkMuted }]}>{ins.detalle}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {panel.porCategoria.map((metricas) => (
        <View key={metricas.categoria} style={estilos.bloqueCategoria}>
          <Text style={estilos.nombreCategoria}>{ETIQUETA_CATEGORIA[metricas.categoria]}</Text>
          <Text style={estilos.retencion}>
            {metricas.porcentajeRetencion !== null ? `${Math.round(metricas.porcentajeRetencion * 100)}%` : '—'}{' '}
            retención
          </Text>
          <Text style={estilos.estados}>
            {metricas.estados.nueva} nuevas · {metricas.estados.aprendiendo} aprendiendo · {metricas.estados.madura}{' '}
            maduras · {metricas.estados.en_riesgo} en riesgo
          </Text>
        </View>
      ))}

      <TarjetasProblematicas tarjetas={panel.tarjetasProblematicas} />

      <Link href="/historial-sesiones" style={estilos.enlaceHistorial}>
        Ver historial de sesiones →
      </Link>

      {ahoraCarga ? <Text style={estilos.horaCaptura}>Calculado: {ahoraCarga.toISOString()}</Text> : null}

      <Pressable onPress={exportarBD} style={estilos.botonExportar}>
        <Text style={estilos.textoExportar}>Exportar BD (verificación)</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, gap: 12 },
  bloqueRadar: { borderRadius: 16, borderWidth: 1, padding: 8, alignItems: 'center' },
  bloqueLinea: { borderRadius: 16, borderWidth: 1, padding: 4 },
  bloqueInsights: { gap: 8 },
  insight: { borderRadius: 12, borderLeftWidth: 4, padding: 14 },
  insightTitulo: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  insightDetalle: { fontSize: 12 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  filaVentanas: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  botonVentana: { flex: 1, backgroundColor: '#313244', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  botonVentanaActivo: { backgroundColor: '#89b4fa' },
  textoVentana: { color: '#a6adc8', fontSize: 13 },
  textoVentanaActivo: { color: '#1e1e2e', fontWeight: '600' },
  bloqueCategoria: { backgroundColor: '#313244', borderRadius: 10, padding: 14, gap: 4 },
  nombreCategoria: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  retencion: { color: '#a6e3a1', fontSize: 14 },
  estados: { color: '#a6adc8', fontSize: 13 },
  enlaceHistorial: { color: '#89b4fa', fontWeight: '600', textAlign: 'center', marginTop: 8, paddingVertical: 8 },
  horaCaptura: { color: '#45475a', fontSize: 11, textAlign: 'center', marginTop: 16 },
  botonExportar: { alignSelf: 'center', marginTop: 8, paddingVertical: 6, paddingHorizontal: 12 },
  textoExportar: { color: '#45475a', fontSize: 11, textDecorationLine: 'underline' },
});
