import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { LineChart } from '../src/components/LineChart';
import { RetencionPorCategoria as VistaRetencion, type VistaRetencion as ModoVista } from '../src/components/RetencionPorCategoria';
import { TarjetasProblematicas } from '../src/components/TarjetasProblematicas';
import { obtenerBD, rutaArchivoBD } from '../src/db/client';
import { listarDiasPractica, obtenerPanelRetencion } from '../src/db/repository';
import type { ConexionBD, FilaDiaPractica } from '../src/db/tipos';
import type { Categoria } from '../src/db/tipos';
import type { PanelRetencion, Ventana } from '../src/domain/estadisticas/retencion';
import { generarInsights, type Insight } from '../src/domain/estadisticas/insights';
import { retencionPorCategoria, type RetencionPorCategoria } from '../src/domain/estadisticas/retencion-categorias';
import { useTema } from '../src/stores/tema';
import { recetaForma } from '../src/tema/colores';
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

const TEXTO_VENTANA: Record<Ventana, string> = {
  '7d': 'los últimos 7 días',
  '30d': 'los últimos 30 días',
  todo: 'todo el historial',
};

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
 *
 * ── Fase 8 v2 (DESIGN.md §5.7, §7.2, §7.3) ─────────────────────────────────
 *
 * Esta pantalla era el peor caso de la inconsistencia visual: tenía la paleta
 * Catppuccin (#1e1e2e, #313244, #89b4fa) escrita a mano en el StyleSheet, así
 * que era la única pantalla de la app que no cambiaba con el tema. Ahora todo
 * sale de `useTema()` y `recetaForma()`.
 *
 * Los otros tres cambios:
 *
 * 1. UN NÚMERO GRANDE arriba. Antes había que leer cuatro bloques para saber
 *    si vas bien. La lectura general va primero, el desglose después.
 * 2. BARRAS ⇄ RADAR conmutables (`<VistaRetencion>`), con la preferencia
 *    recordada. El radar solo no servía: da la forma del conjunto pero no
 *    permite leer un valor con precisión.
 * 3. `paddingBottom: 130`. La pantalla se cortaba detrás de la isla y no se
 *    podía llegar al final — bug reportado.
 *
 * PENDIENTE (no bloquea): persistir `vista` en la tabla `preferencias`, junto
 * a `tema` y `tipografia`. Hoy vive en estado local, así que se olvida al
 * salir de la pantalla.
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
  const [vista, setVista] = useState<ModoVista>('barras');
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);

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

  /**
   * Datos para las dos vistas. `porcentajeRetencion` viene 0..1 o null (null =
   * no hubo revisiones en la ventana); se convierte a 0..100 y el detalle sale
   * del desglose por estado, que es lo que hace la barra accionable: «74 %» no
   * dice qué hacer, «14 en riesgo» sí.
   */
  const datosCategoria = useMemo(
    () =>
      (panel?.porCategoria ?? []).map((m) => ({
        nombre: ETIQUETA_CATEGORIA[m.categoria],
        pct: (m.porcentajeRetencion ?? 0) * 100,
        detalle: `${m.estados.madura} maduras · ${m.estados.en_riesgo} en riesgo`,
      })),
    [panel],
  );

  /**
   * Promedio simple de las categorías con datos. NO es una retención global
   * ponderada por número de revisiones — el dominio no expone ese conteo, y
   * preferimos un número honesto y etiquetado como promedio antes que inventar
   * una ponderación que no podemos verificar contra la consulta SQL manual.
   */
  const promedio = useMemo(() => {
    const conDatos = (panel?.porCategoria ?? []).filter((m) => m.porcentajeRetencion !== null);
    if (conDatos.length === 0) return null;
    const suma = conDatos.reduce((acc, m) => acc + (m.porcentajeRetencion ?? 0), 0);
    return (suma / conDatos.length) * 100;
  }, [panel]);

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
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (error || !panel) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.error, { color: t.otraVez }]}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[estilos.contenedorScroll, { backgroundColor: t.bg }]}
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
      <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>Retención</Text>

      {/* Segmentado: riel hundido en cardAlt, activo elevado en card. */}
      <View style={[estilos.segmentado, { backgroundColor: t.cardAlt, borderRadius: forma.rPill }]}>
        {VENTANAS.map(({ valor, etiqueta }) => {
          const activo = ventana === valor;
          return (
            <Pressable
              key={valor}
              onPress={() => setVentana(valor)}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              style={[
                estilos.segmento,
                { borderRadius: forma.rPill },
                activo && { backgroundColor: t.card, ...forma.sombraCard, shadowRadius: 3, shadowOpacity: 0.12 },
              ]}
            >
              <Text
                style={[
                  estilos.segmentoTexto,
                  { color: activo ? t.ink : t.inkMuted, fontFamily: tipografia.body },
                ]}
              >
                {etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          estilos.hero,
          forma.sombraCard,
          { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder, borderRadius: forma.rCard },
        ]}
      >
        <View style={estilos.heroFila}>
          <View style={estilos.heroIzquierda}>
            <Text style={[estilos.heroNumero, { color: t.ink, fontFamily: tipografia.display }]}>
              {promedio !== null ? `${Math.round(promedio)} %` : '—'}
            </Text>
            <Text style={[estilos.heroPie, { color: t.inkMuted, fontFamily: tipografia.body }]}>
              {promedio !== null
                ? `promedio por categoría en ${TEXTO_VENTANA[ventana]}`
                : `sin revisiones en ${TEXTO_VENTANA[ventana]}`}
            </Text>
          </View>
        </View>

        {puntosLinea.length > 0 && (
          <LineChart
            puntos={puntosLinea}
            titulo="Tarjetas por día"
            subtitulo="XP ganado (cada tarjeta = 1 XP)"
            metaY={20}
            periodos={['dia', 'semana', 'mes', 'todo']}
            periodoActivo={periodoLinea}
            onCambiarPeriodo={setPeriodoLinea}
          />
        )}
      </View>

      {datosCategoria.length > 0 && (
        <VistaRetencion datos={datosCategoria} vista={vista} onCambiarVista={setVista} />
      )}

      {insightsVisibles.length > 0 && (
        <View style={estilos.bloqueInsights}>
          {insightsVisibles.map((ins, i) => {
            /**
             * Los insights ahora usan los tokens del tema, no una paleta fija.
             * La versión anterior forzaba #FEF3C7 / #D1FAE5 / #DBEAFE
             * «para legibilidad cross-tema», y el efecto era el contrario: tres
             * tarjetas pastel de otra app dentro de Arcade o Papel. Los tokens
             * `dificil`, `bien` y `facil` YA están calibrados contra el fondo
             * de cada tema — es exactamente para lo que existen.
             */
            const acentoPorTipo: Record<Insight['tipo'], string> = {
              alerta: t.dificil,
              positivo: t.bien,
              motivacion: t.facil,
              neutral: t.inkMuted,
            };
            const acento = acentoPorTipo[ins.tipo];
            return (
              <View
                key={i}
                style={[
                  estilos.insight,
                  {
                    backgroundColor: t.card,
                    borderColor: t.borderMuted ?? t.glassBorder,
                    borderLeftColor: acento,
                    borderRadius: forma.rRow,
                  },
                ]}
              >
                <Text style={[estilos.insightTitulo, { color: t.ink, fontFamily: tipografia.display }]}>
                  {ins.titulo}
                </Text>
                {ins.detalle && (
                  <Text style={[estilos.insightDetalle, { color: t.inkMuted, fontFamily: tipografia.body }]}>
                    {ins.detalle}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      <TarjetasProblematicas tarjetas={panel.tarjetasProblematicas} />

      <Link
        href="/historial-sesiones"
        style={[estilos.enlaceHistorial, { color: t.accent1, fontFamily: tipografia.body }]}
      >
        Ver historial de sesiones →
      </Link>

      {/* Pie de verificación: el instante exacto del cálculo, para poder
          reproducirlo con consultas-verificacion.sql. */}
      {ahoraCarga ? (
        <Text style={[estilos.horaCaptura, { color: t.inkMuted }]}>Calculado: {ahoraCarga.toISOString()}</Text>
      ) : null}

      <Pressable onPress={exportarBD} style={estilos.botonExportar}>
        <Text style={[estilos.textoExportar, { color: t.inkMuted }]}>Exportar BD (verificación)</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1 },
  // 130 abajo: la isla flota encima. Sin esto la pantalla se corta.
  contenido: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 130, gap: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 24, textAlign: 'center' },

  titulo: { fontSize: 20, fontWeight: '700', paddingHorizontal: 2, paddingTop: 6, paddingBottom: 12 },

  segmentado: { flexDirection: 'row', gap: 5, padding: 3, marginBottom: 6 },
  segmento: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  segmentoTexto: { fontSize: 12.5, fontWeight: '700' },

  hero: { borderWidth: 1, padding: 22, gap: 18 },
  heroFila: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroIzquierda: { flex: 1, gap: 2 },
  heroNumero: { fontSize: 52, fontWeight: '800', letterSpacing: -1.5, lineHeight: 56 },
  heroPie: { fontSize: 12.5 },

  bloqueInsights: { gap: 8, marginTop: 10 },
  insight: { borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 4 },
  insightTitulo: { fontSize: 14, fontWeight: '700' },
  insightDetalle: { fontSize: 12, lineHeight: 17 },

  enlaceHistorial: { fontWeight: '600', textAlign: 'center', marginTop: 8, paddingVertical: 8, fontSize: 13.5 },
  horaCaptura: { fontSize: 11, textAlign: 'center', marginTop: 16, opacity: 0.6 },
  botonExportar: { alignSelf: 'center', marginTop: 8, paddingVertical: 6, paddingHorizontal: 12 },
  textoExportar: { fontSize: 11, textDecorationLine: 'underline', opacity: 0.7 },
});
