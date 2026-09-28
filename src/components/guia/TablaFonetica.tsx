import { StyleSheet, Text, View } from 'react-native';
import { segmentarPalabra } from '../../domain/fonetica/decodificador';
import { TABLA_FONETICA } from '../../domain/guia/contenido';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { PalabraCodificada } from '../PalabraCodificada';

/** La tabla del alfabeto fonético: dígito, sonidos, truco y un ejemplo con su letra resaltada. */
export function TablaFonetica() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  return (
    <View
      style={[estilos.tabla, { backgroundColor: t.card, borderColor: t.borderMuted ?? t.track, borderRadius: forma.rRow }]}
      accessibilityLabel="Tabla del alfabeto fonético"
    >
      {TABLA_FONETICA.map((fila, i) => {
        const segmentos = segmentarPalabra(fila.ejemplo);
        return (
          <View
            key={fila.digito}
            style={[estilos.fila, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.borderMuted ?? t.track }]}
          >
            <Text style={[estilos.digito, { color: t.accent1, fontFamily: tipografia.display }]}>{fila.digito}</Text>
            <View style={estilos.centro}>
              <Text style={[estilos.sonidos, { color: t.ink, fontFamily: tipografia.display }]}>{fila.sonidos}</Text>
              <Text style={[estilos.truco, { color: t.inkMuted }]}>{fila.truco}</Text>
            </View>
            <View style={estilos.ejemplo}>
              {segmentos ? <PalabraCodificada segmentos={segmentos} tamano={17} /> : <Text>{fila.ejemplo}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  tabla: { borderWidth: 1, overflow: 'hidden' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  digito: { width: 26, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  centro: { flex: 1, gap: 1 },
  sonidos: { fontSize: 15.5, fontWeight: '800' },
  truco: { fontSize: 12.5, lineHeight: 17 },
  ejemplo: { minWidth: 64, alignItems: 'flex-end' },
});
