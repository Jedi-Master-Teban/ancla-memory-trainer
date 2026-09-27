import { StyleSheet, Text, View } from 'react-native';
import type { SegmentoNaipe } from '../domain/fonetica/naipes';
import { simboloDePalo } from '../domain/fonetica/naipes';
import { useTema } from '../stores/tema';

/**
 * La palabra con su código a la vista: cada consonante que codifica va en el
 * acento y lleva su dígito debajo. «Tufo» se lee T(1)·u·f(7)·o sin tener que
 * descifrar una fórmula — es el núcleo del método de Lorayne, y antes era la
 * línea más discreta de la pantalla (`t(1) + f(7) → 17` en gris y a 14 px).
 *
 * En naipes, la primera letra es el palo y no un dígito: va en tinta tenue con
 * el símbolo del palo debajo, para que se lea como lo que es.
 *
 * Todas las columnas reservan la fila del dígito aunque no lo tengan, para que
 * las letras compartan línea base.
 */
interface Props {
  segmentos: SegmentoNaipe[];
  /** Tamaño de las letras. El dígito se escala a partir de él. */
  tamano?: number;
}

/** Rojo de palo: único color fijo permitido fuera de tokens (handoff Fase 9). */
const ROJO_PALO = '#c0392b';

export function PalabraCodificada({ segmentos, tamano = 30 }: Props) {
  const { colores: t, tipografia } = useTema();
  const tamanoDigito = Math.round(tamano * 0.45);
  const altoDigito = Math.round(tamanoDigito * 1.3);

  // El lector de pantalla dice PRIMERO la palabra y después su código. Sin la
  // palabra al frente anunciaba «P, palo, n vale 2» y nunca decía «Pan»: quien
  // usa VoiceOver se quedaba sin la respuesta (auditoría WCAG 4.1.2).
  const palabra = segmentos.map((s) => s.texto).join('');
  const codigo = segmentos
    .map((s) => (s.digito !== null ? `${s.texto} vale ${s.digito}` : s.palo ? `${s.texto} es el palo` : null))
    .filter(Boolean)
    .join('; ');
  const etiqueta = codigo ? `${palabra}: ${codigo}` : palabra;

  return (
    <View style={estilos.fila} accessibilityRole="text" accessibilityLabel={etiqueta}>
      {segmentos.map((s, i) => {
        const codifica = s.digito !== null;
        const esPalo = s.palo !== undefined;
        const rojo = s.palo === 'diamantes' || s.palo === 'corazones';
        return (
          <View key={i} style={estilos.columna}>
            <Text
              style={[
                estilos.letras,
                {
                  fontSize: tamano,
                  fontFamily: tipografia.display,
                  color: codifica ? t.accent1 : esPalo ? t.inkMuted : t.ink,
                },
              ]}
            >
              {/* Espacios duros: en una fila de columnas un espacio suelto al
                  borde de un <Text> puede colapsarse en web. */}
              {s.texto.replace(/ /g, ' ')}
            </Text>
            <Text
              style={[
                estilos.digito,
                {
                  height: altoDigito,
                  fontSize: tamanoDigito,
                  lineHeight: altoDigito,
                  color: esPalo ? (rojo ? ROJO_PALO : t.inkMuted) : t.accent1,
                },
              ]}
            >
              {codifica ? String(s.digito) : esPalo ? simboloDePalo(s.palo!) : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' },
  columna: { alignItems: 'center' },
  letras: { fontWeight: '700' },
  digito: { fontWeight: '800', textAlign: 'center' },
});
