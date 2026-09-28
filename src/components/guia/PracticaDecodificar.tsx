import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { segmentarPalabra } from '../../domain/fonetica/decodificador';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { PalabraCodificada } from '../PalabraCodificada';
import { Ficha } from './comun';

/** Casos de la tabla de decodificacion-fonetica.md §3: cada uno enseña una regla. */
const EJEMPLOS = ['Techo', 'Cheque', 'Guerra', 'Niño', 'Acecho', 'Hucha'];

/** Capítulo del alfabeto: escribe cualquier palabra y mira qué número esconde. */
export function PracticaDecodificar() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const [palabra, setPalabra] = useState('Techo');

  const resultado = useMemo(() => {
    const limpia = palabra.trim();
    if (!limpia) return null;
    const segmentos = segmentarPalabra(limpia);
    if (!segmentos) return { error: true as const };
    if (!segmentos.some((s) => s.digito !== null)) return { error: false as const, segmentos, numero: null };
    return { error: false as const, segmentos, numero: segmentos.filter((s) => s.digito !== null).map((s) => s.digito).join('') };
  }, [palabra]);

  return (
    <View style={estilos.bloque}>
      <TextInput
        value={palabra}
        onChangeText={setPalabra}
        placeholder="Escribe una palabra"
        placeholderTextColor={t.inkMuted}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel="Palabra para decodificar"
        style={[
          estilos.entrada,
          { backgroundColor: t.card, color: t.ink, borderColor: t.borderMuted ?? t.track, borderRadius: forma.rIcon },
        ]}
      />
      <View style={estilos.ejemplos}>
        {EJEMPLOS.map((e) => (
          <Ficha key={e} activa={palabra === e} onPress={() => setPalabra(e)}>
            {e}
          </Ficha>
        ))}
      </View>
      <View style={[estilos.salida, { backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]} aria-live="polite">
        {resultado === null ? (
          <Text style={[estilos.texto, { color: t.inkMuted }]}>Escribe una palabra para ver su número.</Text>
        ) : resultado.error ? (
          <Text style={[estilos.texto, { color: t.otraVez }]}>
            Esa palabra tiene letras que el alfabeto fonético no usa, como números o signos.
          </Text>
        ) : (
          <>
            <PalabraCodificada segmentos={resultado.segmentos} tamano={32} />
            <Text style={[estilos.numero, { color: t.ink, fontFamily: tipografia.display }]}>
              {resultado.numero === null ? 'Sin consonantes: no vale ningún número' : `= ${resultado.numero}`}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12 },
  entrada: { minHeight: 48, paddingHorizontal: 14, fontSize: 18, fontWeight: '700', borderWidth: 1 },
  ejemplos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  salida: { padding: 16, gap: 8, alignItems: 'center', minHeight: 110, justifyContent: 'center' },
  texto: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
  numero: { fontSize: 22, fontWeight: '800' },
});
