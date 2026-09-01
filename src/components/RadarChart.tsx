import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { poligonoAnillo, poligonoDatos, puntoEtiqueta, puntoVertice } from './radar-logic';
import { useTema } from '../stores/tema';

interface Props {
  etiquetas: string[];
  /** Valores normalizados [0..1] en el mismo orden que etiquetas. */
  valores: number[];
  /** Tamaño del SVG (cuadrado). */
  tamano?: number;
  /** Etiquetas adicionales a mostrar junto al % (ej: nombre categoría). */
  titulo?: string;
  subtitulo?: string;
}

/**
 * RadarChart SVG para retención por categoría (4-6 ejes ideal).
 * - 4 anillos de referencia (25/50/75/100%)
 * - Ejes radiales con etiqueta + porcentaje
 * - Polígono de datos con relleno accent @ 30% y borde accent
 * - Puntos en cada vértice
 *
 * Investigación: Stephen Few — radar funciona para comparar 4-6 dimensiones
 * con la misma métrica. Pie/bar agrupado pierden la "forma" mental del
 * conjunto; radar la preserva.
 */
export function RadarChart({ etiquetas, valores, tamano = 260, titulo, subtitulo }: Props) {
  const { colores: t } = useTema();
  const cx = tamano / 2;
  const cy = tamano / 2;
  const radio = (tamano / 2) * 0.7;
  const total = etiquetas.length;

  if (total < 3 || total !== valores.length) {
    return (
      <View style={estilos.error}>
        <Text style={{ color: t.inkMuted }}>Radar requiere 3-6 dimensiones</Text>
      </View>
    );
  }

  const fracciones = [0.25, 0.5, 0.75, 1];
  const colorAnillos = t.bg === '#1f160f' || t.bg === '#141433' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const colorEjes = t.bg === '#1f160f' || t.bg === '#141433' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={estilos.contenedor}>
      {titulo && <Text style={[estilos.titulo, { color: t.ink }]}>{titulo}</Text>}
      {subtitulo && <Text style={[estilos.subtitulo, { color: t.inkMuted }]}>{subtitulo}</Text>}
      <Svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`}>
        {/* Anillos de referencia */}
        <G>
          {fracciones.map((f) => (
            <Polygon
              key={f}
              points={poligonoAnillo(total, f, cx, cy, radio)}
              fill="none"
              stroke={colorAnillos}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}
        </G>
        {/* Ejes radiales */}
        <G>
          {Array.from({ length: total }, (_, i) => {
            const p = puntoVertice(i, total, radio, cx, cy);
            return (
              <Line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={colorEjes}
                strokeWidth={1}
              />
            );
          })}
        </G>
        {/* Polígono de datos */}
        <Polygon
          points={poligonoDatos(valores, cx, cy, radio)}
          fill={t.accent1}
          fillOpacity={0.28}
          stroke={t.accent1}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {/* Puntos en cada vértice */}
        <G>
          {valores.map((v, i) => {
            const p = puntoVertice(i, total, radio * Math.max(0, Math.min(1, v)), cx, cy);
            return (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={t.bg}
                stroke={t.accent1}
                strokeWidth={2}
              />
            );
          })}
        </G>
        {/* Etiquetas */}
        <G>
          {etiquetas.map((et, i) => {
            const p = puntoEtiqueta(i, total, cx, cy, radio);
            const pct = Math.round(valores[i] * 100);
            return (
              <G key={i}>
                <SvgText
                  x={p.x}
                  y={p.y - 4}
                  fontSize={11}
                  fontWeight="700"
                  fill={t.ink}
                  textAnchor="middle"
                >
                  {et}
                </SvgText>
                <SvgText
                  x={p.x}
                  y={p.y + 9}
                  fontSize={10}
                  fill={t.inkMuted}
                  textAnchor="middle"
                >
                  {pct}%
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', paddingVertical: 8 },
  titulo: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  subtitulo: { fontSize: 12, marginBottom: 12 },
  error: { padding: 20, alignItems: 'center' },
});
