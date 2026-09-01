import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

/**
 * Odómetro numérico: cada dígito rueda verticalmente cuando el valor
 * cambia. La altura fija de cada celda + un `overflow: hidden` en el
 * contenedor simula un "flip clock" simple sin dependencias externas.
 *
 * Importante: NO anima en mount. Solo anima cuando el dígito de
 * destino realmente cambia desde la última renderización. Esto evita
 * la "animación de bienvenida" cada vez que el usuario entra a la
 * pantalla de racha.
 */
interface Props {
  valor: number;
  color: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: '400' | '500' | '600' | '700' | '800';
  anchoDigito?: number;
  altoDigito?: number;
}

const DIGITOS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Odometro({
  valor,
  color,
  fontFamily,
  fontSize = 28,
  fontWeight = '700',
  anchoDigito,
  altoDigito,
}: Props) {
  const alto = altoDigito ?? Math.round(fontSize * 1.05);
  const ancho = anchoDigito ?? Math.round(fontSize * 0.6);
  const digitos = String(Math.max(0, Math.floor(valor))).split('');

  return (
    <View style={estilos.contenedor}>
      {digitos.map((d, i) => (
        <DigitoRodante
          key={`${digitos.length - i}`}
          destino={Number(d)}
          color={color}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={fontWeight}
          ancho={ancho}
          alto={alto}
        />
      ))}
    </View>
  );
}

interface DigitoProps {
  destino: number;
  color: string;
  fontFamily?: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  ancho: number;
  alto: number;
}

function DigitoRodante({ destino, color, fontFamily, fontSize, fontWeight, ancho, alto }: DigitoProps) {
  const translateY = useRef(new Animated.Value(-destino * alto)).current;
  const destinoAnteriorRef = useRef(destino);
  const montadoRef = useRef(false);

  useEffect(() => {
    // Primer mount: NO animar. Solo posicionarse en el destino.
    if (!montadoRef.current) {
      montadoRef.current = true;
      translateY.setValue(-destino * alto);
      destinoAnteriorRef.current = destino;
      return;
    }
    // Cambios posteriores: animar solo si el dígito realmente cambió.
    if (destinoAnteriorRef.current !== destino) {
      Animated.timing(translateY, {
        toValue: -destino * alto,
        duration: 500,
        useNativeDriver: true,
      }).start();
      destinoAnteriorRef.current = destino;
    }
  }, [destino, alto, translateY]);

  return (
    <View style={[estilos.celda, { width: ancho, height: alto }]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {DIGITOS.map((d) => (
          <Text
            key={d}
            style={[
              estilos.digito,
              {
                color,
                fontFamily,
                fontSize,
                fontWeight,
                lineHeight: alto,
                height: alto,
                width: ancho,
              },
            ]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row' },
  celda: { overflow: 'hidden' },
  digito: { textAlign: 'center' },
});
