import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { descomponer } from '../../domain/numeros/descomposicion';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { usePalabrasColgadero } from './comun';

/**
 * Capítulo de números: escribe un número y mira en qué palabras de TU
 * colgadero se parte. Usa la misma descomposición que Números importantes.
 */
export function PracticaNumero() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const palabras = usePalabrasColgadero();
  const [digitos, setDigitos] = useState('3141');

  const trozos = useMemo(
    () => (palabras && digitos ? descomponer(digitos, (valor) => palabras.get(valor)) : []),
    [digitos, palabras],
  );

  if (!palabras) return <ActivityIndicator color={t.ink} />;

  const cadena = trozos.map((tr) => tr.palabra ?? '¿?').join(' → ');

  return (
    <View style={estilos.bloque}>
      <TextInput
        value={digitos}
        onChangeText={(texto) => setDigitos(texto.replace(/\D/g, '').slice(0, 16))}
        keyboardType="number-pad"
        placeholder="Escribe un número"
        placeholderTextColor={t.inkMuted}
        accessibilityLabel="Número para convertir en palabras"
        style={[
          estilos.entrada,
          { backgroundColor: t.card, color: t.ink, borderColor: t.borderMuted ?? t.track, borderRadius: forma.rIcon, fontFamily: tipografia.display },
        ]}
      />
      {trozos.length > 0 ? (
        <View aria-live="polite" style={estilos.salida}>
          <View style={estilos.trozos}>
            {trozos.map((tr, i) => (
              <View key={i} style={[estilos.trozo, { backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]}>
                <Text style={[estilos.digitos, { color: t.accent1, fontFamily: tipografia.display }]}>{tr.digitos}</Text>
                <Text style={[estilos.palabra, { color: tr.palabra ? t.ink : t.inkMuted, fontFamily: tipografia.display }]}>
                  {tr.palabra ?? 'sin palabra'}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[estilos.texto, { color: t.inkMuted }]}>
            Ahora encadénalas en una escena: {cadena}.
          </Text>
        </View>
      ) : (
        <Text style={[estilos.texto, { color: t.inkMuted }]}>Escribe un número para partirlo en palabras.</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12 },
  entrada: { minHeight: 48, paddingHorizontal: 14, fontSize: 22, fontWeight: '800', letterSpacing: 2, borderWidth: 1 },
  salida: { gap: 10 },
  trozos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trozo: { paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', gap: 2, minWidth: 72 },
  digitos: { fontSize: 20, fontWeight: '800' },
  palabra: { fontSize: 15, fontWeight: '700' },
  texto: { fontSize: 15, lineHeight: 21 },
});
