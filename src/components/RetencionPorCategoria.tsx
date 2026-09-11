import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon } from 'react-native-svg';
import { poligonoAnillo, poligonoDatos, puntoVertice } from './radar-logic';
import { useTema } from '../stores/tema';
import { recetaForma } from '../tema/colores';
import { IconoBarras, IconoRadar } from './iconos';

/**
 * Retención por categoría — barras ⇄ radar (DESIGN.md §5.7).
 *
 * Las dos vistas contestan preguntas distintas y por eso conviven en vez de
 * reemplazarse: las barras dan el dato preciso y ordenable, el radar da la
 * FORMA del conjunto (¿estoy parejo o tengo un hueco?). La elección es del
 * usuario y se recuerda en `preferencias`.
 *
 * El conmutador es un ícono, no un toggle con etiqueta: MUESTRA LA VISTA A LA
 * QUE SE CAMBIA — un radar en miniatura cuando están las barras, barras
 * horizontales cuando está el radar.
 *
 * Dos correcciones sobre el RadarChart v1, ambas de legibilidad:
 *
 * 1. La retícula estaba en `rgba(0,0,0,0.08)` y era invisible sobre la card.
 *    Ahora es `inkMuted` al 32 % de opacidad, que funciona en los tres temas
 *    porque `inkMuted` ya está definido en contraste con el fondo del tema.
 * 2. Las etiquetas eran `<Text>` de react-native-svg, que ignora la familia
 *    del tema y el tamaño de texto del sistema. Ahora son `<Text>` de RN
 *    posicionados en absoluto sobre el SVG.
 */

const LADO = 300;
const ALTO = 240;
const CX = LADO / 2;
const CY = 112;
const RADIO = 78;
const FRACCIONES = [0.25, 0.5, 0.75, 1];

export type VistaRetencion = 'barras' | 'radar';

export interface DatoCategoria {
  nombre: string;
  /** 0..100 */
  pct: number;
  /** «88 maduras · 5 en riesgo» */
  detalle?: string;
}

interface Props {
  datos: DatoCategoria[];
  vista: VistaRetencion;
  onCambiarVista: (v: VistaRetencion) => void;
}

/** Qué tan lejos del centro pintar cada bloque de etiqueta. */
const ANCHO_ETIQUETA_LATERAL = 66;

export function RetencionPorCategoria({ datos, vista, onCambiarVista }: Props) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const otra: VistaRetencion = vista === 'barras' ? 'radar' : 'barras';

  return (
    <View>
      <View style={estilos.encabezado}>
        <Text style={[estilos.tituloSeccion, { color: t.inkMuted, fontFamily: tipografia.display }]}>
          Por categoría
        </Text>
        <Pressable
          onPress={() => onCambiarVista(otra)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={vista === 'barras' ? 'Ver como radar' : 'Ver como barras'}
          style={({ pressed }) => [
            estilos.conmutador,
            { backgroundColor: t.cardAlt, borderRadius: forma.rIcon },
            pressed && { opacity: 0.6 },
          ]}
        >
          {vista === 'barras' ? <IconoRadar color={t.accent1} /> : <IconoBarras color={t.accent1} />}
        </Pressable>
      </View>

      {vista === 'radar' ? (
        <RadarRetencion datos={datos} />
      ) : (
        <BarrasRetencion datos={datos} />
      )}
    </View>
  );
}

function BarrasRetencion({ datos }: { datos: DatoCategoria[] }) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);

  return (
    <View style={estilos.barras}>
      {datos.map((d) => (
        <View key={d.nombre} style={estilos.barraBloque}>
          <View style={estilos.barraFila}>
            <Text style={[estilos.barraNombre, { color: t.ink, fontFamily: tipografia.body }]}>{d.nombre}</Text>
            <View style={estilos.barraDerecha}>
              {d.detalle ? (
                <Text style={[estilos.barraDetalle, { color: t.inkMuted, fontFamily: tipografia.body }]}>
                  {d.detalle}
                </Text>
              ) : null}
              <Text style={[estilos.barraPct, { color: t.ink, fontFamily: tipografia.display }]}>
                {Math.round(d.pct)} %
              </Text>
            </View>
          </View>
          <View style={[estilos.riel, { backgroundColor: t.track, borderRadius: forma.rPill }]}>
            <View
              style={[
                estilos.relleno,
                {
                  width: `${Math.max(0, Math.min(100, d.pct))}%`,
                  // 80 % es el umbral de FSRS por defecto: por debajo, la
                  // categoría necesita atención.
                  backgroundColor: d.pct < 80 ? t.dificil : t.bien,
                  borderRadius: forma.rPill,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function RadarRetencion({ datos }: { datos: DatoCategoria[] }) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const total = datos.length;

  if (total < 3) {
    return (
      <View style={[estilos.card, { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder }]}>
        <Text style={{ color: t.inkMuted, fontFamily: tipografia.body }}>
          El radar necesita al menos 3 categorías.
        </Text>
      </View>
    );
  }

  const valores = datos.map((d) => Math.max(0, Math.min(1, d.pct / 100)));
  const colorReticula = t.inkMuted;

  return (
    <View
      style={[
        estilos.card,
        forma.sombraCard,
        { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder, borderRadius: forma.rCard },
      ]}
    >
      <View style={estilos.lienzo}>
        <Svg width={LADO} height={ALTO} viewBox={`0 0 ${LADO} ${ALTO}`} style={estilos.svg}>
          <G>
            {FRACCIONES.map((f) => (
              <Polygon
                key={f}
                points={poligonoAnillo(total, f, CX, CY, RADIO)}
                fill="none"
                stroke={colorReticula}
                strokeOpacity={0.32}
                strokeWidth={1}
              />
            ))}
          </G>
          <G>
            {Array.from({ length: total }, (_, i) => {
              const p = puntoVertice(i, total, RADIO, CX, CY);
              return (
                <Line
                  key={i}
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke={colorReticula}
                  strokeOpacity={0.32}
                  strokeWidth={1}
                />
              );
            })}
          </G>
          <Polygon
            points={poligonoDatos(valores, CX, CY, RADIO)}
            fill={t.accent1}
            fillOpacity={0.22}
            stroke={t.accent1}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          <G>
            {valores.map((v, i) => {
              const p = puntoVertice(i, total, RADIO * v, CX, CY);
              return (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={t.accent1}
                  stroke={t.card}
                  strokeWidth={1.6}
                />
              );
            })}
          </G>
        </Svg>

        {/* Etiquetas en Text de RN, no de SVG: heredan la familia del tema y
            el tamaño de texto del sistema. Cuatro posiciones fijas — el radar
            de esta app siempre tiene 4 ejes (las 4 categorías). */}
        {datos.map((d, i) => (
          <View key={d.nombre} style={[estilos.etiqueta, posicionEtiqueta(i, total)]}>
            <Text
              numberOfLines={1}
              style={[estilos.etiquetaNombre, { color: t.ink, fontFamily: tipografia.display }, alineacion(i, total)]}
            >
              {d.nombre}
            </Text>
            <Text
              style={[estilos.etiquetaPct, { color: t.accent1, fontFamily: tipografia.display }, alineacion(i, total)]}
            >
              {Math.round(d.pct)} %
            </Text>
          </View>
        ))}
      </View>

      <Text style={[estilos.pie, { color: t.inkMuted, fontFamily: tipografia.body }]}>
        Cada anillo = 25 % de retención · el área naranja es tu cobertura
      </Text>
    </View>
  );
}

/** 0 arriba, 1 derecha, 2 abajo, 3 izquierda (mismo orden que puntoVertice). */
function posicionEtiqueta(i: number, total: number) {
  if (total !== 4) {
    // Fallback genérico: pega la etiqueta al vértice.
    const p = puntoVertice(i, total, RADIO + 26, CX, CY);
    return { left: p.x - ANCHO_ETIQUETA_LATERAL / 2, top: p.y - 14, width: ANCHO_ETIQUETA_LATERAL };
  }
  switch (i) {
    case 0:
      return { left: 0, right: 0, top: 0 };
    case 1:
      return { right: 0, top: 94, width: ANCHO_ETIQUETA_LATERAL };
    case 2:
      return { left: 0, right: 0, bottom: 0 };
    default:
      return { left: 0, top: 94, width: ANCHO_ETIQUETA_LATERAL };
  }
}

function alineacion(i: number, total: number) {
  if (total !== 4) return { textAlign: 'center' as const };
  if (i === 1) return { textAlign: 'right' as const };
  if (i === 3) return { textAlign: 'left' as const };
  return { textAlign: 'center' as const };
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 22,
    paddingBottom: 11,
  },
  tituloSeccion: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  conmutador: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },

  barras: { gap: 14 },
  barraBloque: { gap: 7 },
  barraFila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  barraNombre: { fontSize: 13.5, fontWeight: '700' },
  barraDerecha: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  barraDetalle: { fontSize: 11 },
  barraPct: { fontSize: 14, fontWeight: '800' },
  riel: { height: 8, overflow: 'hidden' },
  relleno: { height: '100%' },

  card: { borderWidth: 1, paddingTop: 8, paddingBottom: 14, alignItems: 'center' },
  lienzo: { width: LADO, height: ALTO },
  svg: { position: 'absolute', left: 0, top: 0 },
  etiqueta: { position: 'absolute', gap: 1 },
  etiquetaNombre: { fontSize: 12, fontWeight: '700' },
  etiquetaPct: { fontSize: 13, fontWeight: '800' },
  pie: { fontSize: 10.5, marginTop: 2, textAlign: 'center', paddingHorizontal: 12 },
});
