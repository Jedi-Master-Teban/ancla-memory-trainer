import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { segmentarPalabraNaipe, simboloDePalo, type Palo, type Valor } from '../../domain/fonetica/naipes';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { CaraFisica } from '../CartaVisual';
import { ORDEN_VALORES, restriccionDeNaipe } from '../hojear-logic';
import { PalabraCodificada } from '../PalabraCodificada';
import { Ficha, usePalabrasNaipe } from './comun';

/** En el orden de las reglas: la inicial de cada palo es E, D, P, C. */
const PALOS: { palo: Palo; nombre: string }[] = [
  { palo: 'espadas', nombre: 'Espadas' },
  { palo: 'diamantes', nombre: 'Diamantes' },
  { palo: 'palos', nombre: 'Palos' },
  { palo: 'corazones', nombre: 'Corazones' },
];

/** Capítulo de naipes: elige una carta y mira su regla junto a tu palabra. */
export function PracticaNaipe() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const palabras = usePalabrasNaipe();
  const [palo, setPalo] = useState<Palo>('diamantes');
  const [valor, setValor] = useState<Valor>('8');

  if (!palabras) return <ActivityIndicator color={t.ink} />;

  const carta = { palo, valor };
  const palabra = palabras.get(`${valor}-${palo}`);
  const segmentos = palabra ? segmentarPalabraNaipe(palabra, carta) : null;

  return (
    <View style={estilos.bloque}>
      <View style={estilos.fila}>
        {PALOS.map((p) => (
          <Ficha key={p.palo} activa={p.palo === palo} onPress={() => setPalo(p.palo)} etiqueta={p.nombre} estilo={estilos.estirada}>
            {simboloDePalo(p.palo)}
          </Ficha>
        ))}
      </View>
      {/* 13 valores en filas de 7 y 6: en filas de 6 la K quedaba sola en la última. */}
      {[ORDEN_VALORES.slice(0, 7), ORDEN_VALORES.slice(7)].map((fila) => (
        <View key={fila[0]} style={estilos.fila}>
          {fila.map((v) => (
            <Ficha key={v} activa={v === valor} onPress={() => setValor(v)} estilo={estilos.estirada}>
              {v}
            </Ficha>
          ))}
        </View>
      ))}
      <View style={[estilos.resultado, { backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]} aria-live="polite">
        <CaraFisica carta={carta} />
        <View style={estilos.explicacion}>
          <Text style={[estilos.etiqueta, { color: t.inkMuted }]}>La regla</Text>
          <Text style={[estilos.regla, { color: t.accent1, fontFamily: tipografia.display }]}>{restriccionDeNaipe(carta)}</Text>
          <Text style={[estilos.etiqueta, { color: t.inkMuted }]}>Tu palabra</Text>
          {segmentos ? (
            <PalabraCodificada segmentos={segmentos} tamano={24} />
          ) : (
            <Text style={[estilos.palabra, { color: t.ink, fontFamily: tipografia.display }]}>
              {palabra ?? 'Todavía sin palabra'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 10 },
  fila: { flexDirection: 'row', gap: 6 },
  estirada: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
  resultado: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  explicacion: { flex: 1, gap: 4 },
  etiqueta: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  regla: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  palabra: { fontSize: 22, fontWeight: '700' },
});
