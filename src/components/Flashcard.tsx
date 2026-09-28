import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { segmentarPalabra } from '../domain/fonetica/decodificador';
import { useTema } from '../stores/tema';
import { cardStyle, recetaForma, type TokensColor } from '../tema/colores';
import { ALTO_MAX_TARJETA, ALTO_MIN_TARJETA } from './EscenaRepaso';
import { PalabraCodificada } from './PalabraCodificada';

interface Props {
  frente: string;
  reverso: string;
  revelada: boolean;
  /** Texto de apoyo bajo la respuesta (p. ej. la descomposición de un número). */
  explicacion?: string;
  /**
   * Qué cara es una palabra fonética. Al revelar se pinta con sus consonantes
   * resaltadas y su dígito debajo, en lugar de la fórmula de `explicacion`.
   *
   * Solo al revelar, y por eso importa saber la cara: en Reverso la palabra es
   * la PREGUNTA, y resaltarla antes de tiempo sería mostrar la respuesta.
   */
  caraCodificada?: 'frente' | 'reverso';
}

/**
 * La tarjeta de repaso. Tiene superficie propia con la misma receta que la de
 * Hojear (`cardStyle` + `sombraCard` + `rCard`): antes era un View sin fondo y
 * el número flotaba sobre la pantalla, mientras Hojear —la misma idea de
 * tarjeta— sí la tenía. Crece hasta llenar el escenario, con tope, para que en
 * un teléfono alto no quede un rectángulo gigante con un número pequeño.
 */
export function Flashcard({ frente, reverso, revelada, explicacion, caraCodificada }: Props) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const estilos = useMemo(() => crearEstilos(t), [t]);

  const segmentos = useMemo(() => {
    if (!revelada || !caraCodificada) return null;
    const s = segmentarPalabra(caraCodificada === 'frente' ? frente : reverso);
    // Sin ningún sonido que resalte no hay nada que enseñar: texto plano.
    return s && s.some((x) => x.digito !== null) ? s : null;
  }, [revelada, caraCodificada, frente, reverso]);

  const frenteCodificado = segmentos !== null && caraCodificada === 'frente';
  const reversoCodificado = segmentos !== null && caraCodificada === 'reverso';

  return (
    <View
      style={[
        estilos.tarjeta,
        cardStyle(tema),
        forma.sombraCard,
        { borderRadius: forma.rCard, borderColor: t.borderMuted ?? 'transparent' },
      ]}
    >
      {frenteCodificado ? (
        <PalabraCodificada segmentos={segmentos} tamano={40} />
      ) : (
        <Text style={[estilos.frente, { fontFamily: tipografia.display }]}>{frente}</Text>
      )}

      {revelada ? (
        <>
          <View style={[estilos.filete, { backgroundColor: t.borderMuted ?? t.track }]} />
          {reversoCodificado ? (
            <PalabraCodificada segmentos={segmentos} tamano={34} />
          ) : (
            <Text style={[estilos.reverso, { fontFamily: tipografia.display }]}>{reverso}</Text>
          )}
          {explicacion && segmentos === null ? <Text style={estilos.explicacion}>{explicacion}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

const crearEstilos = (t: TokensColor) =>
  StyleSheet.create({
    tarjeta: {
      alignSelf: 'stretch',
      flex: 1,
      maxHeight: ALTO_MAX_TARJETA,
      minHeight: ALTO_MIN_TARJETA,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      padding: 24,
    },
    frente: { fontSize: 56, color: t.ink, fontWeight: '700', textAlign: 'center' },
    filete: { width: 38, height: 1 },
    reverso: { fontSize: 30, color: t.bien, fontWeight: '700', textAlign: 'center' },
    explicacion: { fontSize: 14, color: t.inkMuted, textAlign: 'center' },
  });
