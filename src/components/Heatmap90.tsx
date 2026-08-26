import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FilaDiaPractica } from '../db/tipos';
import { diaAnterior, fechaLocal } from '../domain/racha/calculo';
import { useTema } from '../stores/tema';

interface Props {
  dias: FilaDiaPractica[];
  ahora: Date;
}

/** 15 columnas × 6 filas = 90 días, igual que `racha.html` (`repeat(15, 1fr)`, gap 4). */
const COLUMNAS = 15;
const SEPARACION = 4;

const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function ultimosNoventaDias(ahora: Date): string[] {
  const fechas: string[] = [fechaLocal(ahora)];
  for (let i = 1; i < 90; i++) {
    fechas.push(diaAnterior(fechas[fechas.length - 1]));
  }
  return fechas.reverse();
}

function colorPorIntensidad(tarjetasRevisadas: number, escala: [string, string, string, string]): string {
  if (tarjetasRevisadas === 0) return escala[0];
  if (tarjetasRevisadas < 5) return escala[1];
  if (tarjetasRevisadas < 15) return escala[2];
  return escala[3];
}

/** 'D mmm' con mes fijo en español — evita depender de los datos ICU de Hermes, nunca probados aquí. */
function formatearFechaTooltip(fecha: string): string {
  const [, mes, dia] = fecha.split('-').map(Number);
  return `${dia} ${MESES_ABREV[mes - 1]}`;
}

/**
 * ~90 días, un cuadro por día (07-racha.md §5), al tamaño real del mockup: el
 * ancho de celda se calcula desde el ancho medido del contenedor para que
 * entren exactamente 15 por fila, en vez de un tamaño fijo de 10px que hacía
 * que pareciera un código QR y no un heatmap estilo GitHub.
 *
 * Tocar una celda alterna un tooltip con la fecha y el conteo; tocar otra
 * mientras hay uno abierto lo mueve.
 */
export function Heatmap90({ dias, ahora }: Props) {
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [anchoGrid, setAnchoGrid] = useState(0);
  const { tema, colores: t } = useTema();
  const porFecha = new Map(dias.map((d) => [d.fecha_local, d]));
  const fechas = ultimosNoventaDias(ahora);
  const radioCelda = tema === 'arcade' ? 4 : 1;

  const ladoCelda = anchoGrid > 0 ? (anchoGrid - SEPARACION * (COLUMNAS - 1)) / COLUMNAS : 0;

  function medir(e: LayoutChangeEvent) {
    const ancho = e.nativeEvent.layout.width;
    if (ancho !== anchoGrid) setAnchoGrid(ancho);
  }

  return (
    <View>
      <View style={estilos.grid} onLayout={medir}>
        {ladoCelda > 0 &&
          fechas.map((fecha) => {
            const dia = porFecha.get(fecha);
            const activa = seleccionada === fecha;
            return (
              <View key={fecha} style={{ width: ladoCelda, height: ladoCelda }}>
                <Pressable
                  onPress={() => setSeleccionada(activa ? null : fecha)}
                  style={[
                    estilos.celda,
                    { backgroundColor: colorPorIntensidad(dia?.tarjetas_revisadas ?? 0, t.celdaEscala), borderRadius: radioCelda },
                    dia?.congelador_usado === 1 && { borderWidth: tema === 'arcade' ? 2 : 1.5, borderColor: t.accent3 },
                  ]}
                />
                {activa ? (
                  <View style={[estilos.tooltip, { backgroundColor: t.card, bottom: ladoCelda + 6 }]}>
                    <Text style={[estilos.tooltipFecha, { color: t.ink }]}>{formatearFechaTooltip(fecha)}</Text>
                    <Text style={[estilos.tooltipDetalle, { color: t.inkMuted }]}>
                      {dia?.tarjetas_revisadas ?? 0} tarjeta{(dia?.tarjetas_revisadas ?? 0) === 1 ? '' : 's'}
                      {dia?.congelador_usado === 1 ? ' · congelado' : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
      </View>

      <Text style={[estilos.instruccion, { color: t.inkMuted }]}>
        Toca cualquier día para ver la fecha y cuántas tarjetas repasaste.
      </Text>

      <View style={estilos.leyenda}>
        <Text style={[estilos.leyendaTexto, { color: t.inkMuted }]}>Menos</Text>
        {t.celdaEscala.map((color, i) => (
          <View key={i} style={[estilos.leyendaCelda, { backgroundColor: color, borderRadius: radioCelda }]} />
        ))}
        <Text style={[estilos.leyendaTexto, { color: t.inkMuted }]}>Más</Text>
        <View
          style={[
            estilos.leyendaCelda,
            estilos.leyendaCongelada,
            { backgroundColor: t.celdaEscala[0], borderColor: t.accent3, borderRadius: radioCelda },
          ]}
        />
        <Text style={[estilos.leyendaTexto, { color: t.inkMuted }]}>Congelado</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SEPARACION },
  celda: { width: '100%', height: '100%' },
  tooltip: {
    position: 'absolute',
    left: -22,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  tooltipFecha: { fontSize: 11, fontWeight: '700' },
  tooltipDetalle: { fontSize: 10, marginTop: 1 },
  instruccion: { fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  leyendaTexto: { fontSize: 11 },
  leyendaCelda: { width: 11, height: 11 },
  leyendaCongelada: { borderWidth: 1.5, marginLeft: 6 },
});
