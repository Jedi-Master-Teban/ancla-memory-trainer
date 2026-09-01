import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polyline, Stop, Text as SvgText } from 'react-native-svg';
import { Pressable } from 'react-native';
import {
  agruparPorPeriodo,
  construirGeometria,
  mejorPunto,
  type PeriodoLineChart,
  type PuntoLinea,
} from './line-chart-logic';
import { useTema } from '../stores/tema';

interface Props {
  puntos: PuntoLinea[];
  tamano?: number;
  alto?: number;
  titulo?: string;
  subtitulo?: string;
  metaY?: number;
  periodos?: PeriodoLineChart[];
  periodoActivo?: PeriodoLineChart;
  onCambiarPeriodo?: (p: PeriodoLineChart) => void;
}

const ETIQUETAS_PERIODO: Record<PeriodoLineChart, string> = {
  dia: 'Día',
  semana: 'Semana',
  mes: 'Mes',
  todo: 'Todo',
};

/**
 * LineChart SVG con selector de período (Día/Semana/Mes/Todo).
 * - Línea accent con stroke 2.5
 * - Área debajo con gradient accent → transparente
 * - Línea meta punteada horizontal (cuando se pasa `metaY`)
 * - Punto destacado del mejor día
 * - Selector de período encima del chart
 */
export function LineChart({
  puntos,
  tamano = 340,
  alto = 140,
  titulo,
  subtitulo,
  metaY,
  periodos = ['dia', 'semana', 'mes', 'todo'],
  periodoActivo,
  onCambiarPeriodo,
}: Props) {
  const { colores: t } = useTema();
  const puntosAgrupados = useMemo(() => {
    if (!periodoActivo) return puntos;
    return agruparPorPeriodo(puntos, periodoActivo);
  }, [puntos, periodoActivo]);

  const geom = useMemo(
    () => construirGeometria(puntosAgrupados, tamano, alto),
    [puntosAgrupados, tamano, alto],
  );
  const mejor = useMemo(() => mejorPunto(puntosAgrupados), [puntosAgrupados]);

  const colorEjes = t.bg === '#1f160f' || t.bg === '#141433' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Para la línea meta
  const metaYPos = metaY !== undefined && geom.ejeY.max > 0
    ? 10 + (alto - 20) - (metaY / geom.ejeY.max) * (alto - 20)
    : null;

  return (
    <View style={estilos.contenedor}>
      {(titulo || subtitulo) && (
        <View style={estilos.header}>
          {titulo && <Text style={[estilos.titulo, { color: t.ink }]}>{titulo}</Text>}
          {subtitulo && <Text style={[estilos.subtitulo, { color: t.inkMuted }]}>{subtitulo}</Text>}
        </View>
      )}
      {periodos.length > 0 && onCambiarPeriodo && (
        <View style={estilos.filaPeriodos}>
          {periodos.map((p) => {
            const activo = p === periodoActivo;
            return (
              <Pressable
                key={p}
                onPress={() => onCambiarPeriodo(p)}
                style={[
                  estilos.chipPeriodo,
                  { backgroundColor: activo ? t.accent1 : 'transparent' },
                  { borderColor: activo ? t.accent1 : t.borderMuted ?? t.inkMuted },
                ]}
              >
                <Text style={[estilos.chipTexto, { color: activo ? t.inkOnAccent : t.inkMuted }]}>
                  {ETIQUETAS_PERIODO[p]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <Svg width={tamano} height={alto} viewBox={`0 0 ${tamano} ${alto}`}>
        <Defs>
          <LinearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={t.accent1} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={t.accent1} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {metaYPos !== null && (
          <G>
            <Line
              x1={10}
              y1={metaYPos}
              x2={tamano - 10}
              y2={metaYPos}
              stroke={t.accent2 ?? t.accent1}
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <SvgText
              x={tamano - 12}
              y={metaYPos - 4}
              fontSize={9}
              fill={t.accent2 ?? t.accent1}
              textAnchor="end"
            >
              meta {metaY}
            </SvgText>
          </G>
        )}
        {geom.puntosArea && <Path d={geom.puntosArea} fill="url(#lineFill)" />}
        {geom.puntosPolyline && (
          <Polyline
            points={geom.puntosPolyline}
            fill="none"
            stroke={t.accent1}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {geom.puntosCirculo.map((c, i) => (
          <Circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={3.5}
            fill={t.bg}
            stroke={t.accent1}
            strokeWidth={2}
          />
        ))}
        {mejor && geom.puntosCirculo[mejor.indice] && (
          <G>
            <Circle
              cx={geom.puntosCirculo[mejor.indice].cx}
              cy={geom.puntosCirculo[mejor.indice].cy}
              r={7}
              fill="transparent"
              stroke={t.accent1}
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />
          </G>
        )}
        {/* Línea base (eje X) */}
        <Line x1={10} y1={alto - 10} x2={tamano - 10} y2={alto - 10} stroke={colorEjes} />
      </Svg>
      {mejor && (
        <Text style={[estilos.mejor, { color: t.inkMuted }]}>
          Mejor día: {mejor.fecha} · {mejor.valor}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 8 },
  header: { marginBottom: 8 },
  titulo: { fontSize: 15, fontWeight: '700' },
  subtitulo: { fontSize: 12, marginTop: 2 },
  filaPeriodos: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  chipPeriodo: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipTexto: { fontSize: 11, fontWeight: '600' },
  mejor: { fontSize: 11, marginTop: 4, textAlign: 'right' },
});
