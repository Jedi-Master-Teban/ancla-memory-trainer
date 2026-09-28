import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { segmentarPalabra } from '../../domain/fonetica/decodificador';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { PalabraCodificada } from '../PalabraCodificada';
import { BotonGuia, usePalabrasColgadero } from './comun';

const alAzar = (distinto?: number) => {
  let n = distinto ?? 0;
  while (n === distinto || n === 0) n = 1 + Math.floor(Math.random() * 100);
  return n;
};

/**
 * Capítulo del colgadero: un número, y piensas su palabra ANTES de verla.
 * Es recuerdo activo, lo mismo que enseña el capítulo de fundamentos.
 */
export function PracticaColgadero() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const palabras = usePalabrasColgadero();
  const [numero, setNumero] = useState(() => alAzar());
  const [visible, setVisible] = useState(false);

  if (!palabras) return <ActivityIndicator color={t.ink} />;

  const palabra = palabras.get(numero);
  const segmentos = palabra ? segmentarPalabra(palabra) : null;

  return (
    <View style={estilos.bloque}>
      <Text style={[estilos.pregunta, { color: t.inkMuted }]}>Piensa la palabra del</Text>
      <Text style={[estilos.numero, { color: t.accent1, fontFamily: tipografia.display }]} accessibilityLabel={`Número ${numero}`}>
        {numero}
      </Text>
      <View style={[estilos.respuesta, { backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]} aria-live="polite">
        {!visible ? (
          <BotonGuia texto="Ver la palabra" onPress={() => setVisible(true)} />
        ) : segmentos ? (
          <PalabraCodificada segmentos={segmentos} tamano={34} />
        ) : (
          <Text style={[estilos.texto, { color: t.ink, fontFamily: tipografia.display }]}>
            {palabra ?? 'Todavía no tiene palabra en tu colgadero'}
          </Text>
        )}
      </View>
      <BotonGuia
        texto="Otro número"
        variante="secundario"
        onPress={() => {
          setNumero((n) => alAzar(n));
          setVisible(false);
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 10, alignItems: 'stretch' },
  pregunta: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  numero: { fontSize: 56, fontWeight: '800', textAlign: 'center', lineHeight: 62 },
  respuesta: { minHeight: 96, padding: 14, alignItems: 'center', justifyContent: 'center' },
  texto: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
});
