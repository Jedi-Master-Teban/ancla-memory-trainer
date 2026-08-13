import { StyleSheet, View } from 'react-native';
import type { FilaDiaPractica } from '../db/tipos';
import { diaAnterior, fechaLocal } from '../domain/racha/calculo';

interface Props {
  dias: FilaDiaPractica[];
  ahora: Date;
}

function ultimosNoventaDias(ahora: Date): string[] {
  const fechas: string[] = [fechaLocal(ahora)];
  for (let i = 1; i < 90; i++) {
    fechas.push(diaAnterior(fechas[fechas.length - 1]));
  }
  return fechas.reverse();
}

function colorPorIntensidad(tarjetasRevisadas: number): string {
  if (tarjetasRevisadas === 0) return '#313244';
  if (tarjetasRevisadas < 5) return '#45528c';
  if (tarjetasRevisadas < 15) return '#5c7ce0';
  return '#89b4fa';
}

/** ~90 días, un cuadro por día (07-racha.md §5). Días congelados, marcados aparte. */
export function Heatmap90({ dias, ahora }: Props) {
  const porFecha = new Map(dias.map((d) => [d.fecha_local, d]));
  const fechas = ultimosNoventaDias(ahora);

  return (
    <View style={estilos.grid}>
      {fechas.map((fecha) => {
        const dia = porFecha.get(fecha);
        return (
          <View
            key={fecha}
            style={[
              estilos.celda,
              { backgroundColor: colorPorIntensidad(dia?.tarjetas_revisadas ?? 0) },
              dia?.congelador_usado === 1 && estilos.celdaCongelada,
            ]}
          />
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  celda: { width: 10, height: 10, borderRadius: 2 },
  celdaCongelada: { borderWidth: 1, borderColor: '#89dceb' },
});
