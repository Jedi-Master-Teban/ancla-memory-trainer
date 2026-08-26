import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { explicarNaipe, simboloDePalo, type Carta, type Palo } from '../domain/fonetica/naipes';
import { useTema } from '../stores/tema';
import { IconoChevron } from './iconos';

const NEGRO_CARTA = '#1a1a1a';
const ROJO_CARTA = '#c0392b';
/** Igual en los dos temas — naipes.html: "la carta SIEMPRE es clara... la hace reconocible como una carta real". */
const CREMA_CARTA = '#f5f0e6';

const ANCHO_CARTA = 112;
const ALTO_CARTA = 156;
const ANCHO_PALABRA = 150;

function esColorRojo(palo: Palo): boolean {
  return palo === 'diamantes' || palo === 'corazones';
}

/**
 * Cara física de la carta. Sin hooks a propósito: se usa hasta 52 veces a la
 * vez en Baraja Completa, y así el modo compacto no arrastra ninguna máquina
 * de animación. `React.memo` evita que las 52 se re-rendericen en cada toque.
 */
export const CaraFisica = memo(function CaraFisica({ carta, compacta }: { carta: Carta; compacta?: boolean }) {
  const color = esColorRojo(carta.palo) ? ROJO_CARTA : NEGRO_CARTA;
  const simbolo = simboloDePalo(carta.palo);
  const dim = compacta
    ? { width: 56, height: 76, borderRadius: 6, padding: 4 }
    : { width: ANCHO_CARTA, height: ALTO_CARTA, borderRadius: 12, padding: 10 };

  return (
    <View style={[estilos.caraFisica, dim]}>
      <View style={estilos.esquina}>
        <Text style={[compacta ? estilos.rangoCompacto : estilos.rango, { color }]}>{carta.valor}</Text>
        <Text style={[compacta ? estilos.simboloChicoCompacto : estilos.simboloChico, { color }]}>{simbolo}</Text>
      </View>
      <Text style={[compacta ? estilos.simboloCentroCompacto : estilos.simboloCentro, { color }]}>{simbolo}</Text>
      <View style={[estilos.esquina, estilos.esquinaInferior]}>
        <Text style={[compacta ? estilos.rangoCompacto : estilos.rango, { color }]}>{carta.valor}</Text>
        <Text style={[compacta ? estilos.simboloChicoCompacto : estilos.simboloChico, { color }]}>{simbolo}</Text>
      </View>
    </View>
  );
});

interface Props {
  carta: Carta;
  /** Palabra colgadero asociada (tarjeta.contenido_reverso). */
  palabra: string;
  revelada: boolean;
  /**
   * true (default): la CARTA es la pregunta y la palabra se revela
   * (flash/velocidad). false: la PALABRA es la pregunta y la carta se revela
   * (reverso.tsx). La carta siempre ocupa el lado izquierdo para que la
   * disposición no salte entre modos.
   */
  disenoAlFrente?: boolean;
}

/**
 * Carta a la izquierda + palabra a la derecha, como
 * `agent_docs/prototipos/pantallas/naipes.html:112-134` (ADR-027).
 *
 * Sustituye al volteo 3D anterior, que el operador rechazó: aquel usaba
 * `rotateY` + `backfaceVisibility` y sufría de las dos caras visibles a la vez,
 * y de un `Animated.Value` que sobrevivía al cambio de tarjeta y reproducía el
 * giro hacia atrás. Aquí la única animación es una aparición corta del lado
 * oculto — nada que pueda quedar a medias entre tarjetas.
 */
export function CartaVisual({ carta, palabra, revelada, disenoAlFrente = true }: Props) {
  const { colores: t, tipografia } = useTema();
  const aparecer = useRef(new Animated.Value(revelada ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(aparecer, {
      toValue: revelada ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [revelada, aparecer]);

  const explicacion = explicarNaipe(carta, palabra);

  const ladoPalabra = (
    <View style={[estilos.cajaPalabra, { backgroundColor: t.card }]}>
      <Text style={[estilos.etiquetaCarta, { color: t.inkMuted, fontFamily: tipografia.display }]}>
        {carta.valor} {simboloDePalo(carta.palo)}
      </Text>
      <Text style={[estilos.textoPalabra, { color: t.ink, fontFamily: tipografia.display }]}>{palabra}</Text>
      {explicacion ? <Text style={[estilos.textoExplicacion, { color: t.inkMuted }]}>{explicacion}</Text> : null}
    </View>
  );

  const ladoCarta = <CaraFisica carta={carta} />;

  const oculto = (ancho: number) => (
    <View style={[estilos.cajaOculta, { width: ancho, backgroundColor: t.card, borderColor: t.inkMuted }]}>
      <Text style={[estilos.interrogacion, { color: t.inkMuted, fontFamily: tipografia.display }]}>?</Text>
    </View>
  );

  // La carta va siempre a la izquierda; lo que cambia es cuál de los dos lados
  // está oculto antes de revelar.
  const izquierda = disenoAlFrente ? ladoCarta : revelada ? ladoCarta : oculto(ANCHO_CARTA);
  const derecha = disenoAlFrente ? (revelada ? ladoPalabra : oculto(ANCHO_PALABRA)) : ladoPalabra;
  const ladoAnimado: 'izquierda' | 'derecha' = disenoAlFrente ? 'derecha' : 'izquierda';

  const estiloAnimado = {
    opacity: aparecer,
    transform: [{ scale: aparecer.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
  };

  return (
    <View style={estilos.fila}>
      {ladoAnimado === 'izquierda' && revelada ? (
        <Animated.View style={estiloAnimado}>{izquierda}</Animated.View>
      ) : (
        izquierda
      )}

      <IconoChevron color={t.inkMuted} />

      {ladoAnimado === 'derecha' && revelada ? (
        <Animated.View style={estiloAnimado}>{derecha}</Animated.View>
      ) : (
        derecha
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caraFisica: { backgroundColor: CREMA_CARTA, justifyContent: 'space-between' },
  esquina: { alignItems: 'center' },
  esquinaInferior: { alignSelf: 'flex-end', transform: [{ rotate: '180deg' }] },
  rango: { fontSize: 20, fontWeight: '700', lineHeight: 22 },
  rangoCompacto: { fontSize: 12, fontWeight: '700', lineHeight: 13 },
  simboloChico: { fontSize: 12, lineHeight: 13 },
  simboloChicoCompacto: { fontSize: 8, lineHeight: 9 },
  simboloCentro: { fontSize: 44, textAlign: 'center' },
  simboloCentroCompacto: { fontSize: 18, textAlign: 'center' },
  cajaPalabra: {
    width: ANCHO_PALABRA,
    height: ALTO_CARTA,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  cajaOculta: {
    height: ALTO_CARTA,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interrogacion: { fontSize: 34, fontWeight: '700', opacity: 0.5 },
  etiquetaCarta: { fontSize: 13 },
  textoPalabra: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  textoExplicacion: { fontSize: 11, textAlign: 'center' },
});
