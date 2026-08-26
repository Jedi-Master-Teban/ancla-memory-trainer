import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { EstadoRacha } from '../domain/racha/calculo';
import { useTema } from '../stores/tema';
import { IconoLlama } from './iconos';

interface Props {
  diasConsecutivos: number;
  estado: EstadoRacha;
  /** 'normal' (default): mini-versión del dashboard. 'grande': tarjeta hero de racha.tsx. */
  tamano?: 'normal' | 'grande';
}

const DURACION_PULSO_MS: Record<EstadoRacha, number> = { activa: 900, en_riesgo: 450, rota: 0 };

/**
 * Llama + contador (07-racha.md §5). La llama es SVG de dos formas
 * superpuestas, como en `racha.html:137-138` — ya no un emoji, para que su
 * color cambie de verdad con el tema.
 *
 * Animación simple de pulso: `en_riesgo` late más rápido y más marcado que
 * `activa` ("llama que cambia de intensidad si está en riesgo",
 * PROJECT_BRIEF.md §10), sin Reanimated ni Skia (07-racha.md §5).
 */
export function IndicadorRacha({ diasConsecutivos, estado, tamano = 'normal' }: Props) {
  const { colores: t, tipografia } = useTema();
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const duracion = DURACION_PULSO_MS[estado];
    if (duracion === 0) {
      escala.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, { toValue: 1.12, duration: duracion, useNativeDriver: true }),
        Animated.timing(escala, { toValue: 1, duration: duracion, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [estado, escala]);

  const esGrande = tamano === 'grande';
  const apagada = estado === 'rota';
  const colorExterior = apagada ? t.inkMuted : t.flameOuterEnd;
  const colorInterior = apagada ? t.inkMuted : t.flameInner;

  return (
    <View style={esGrande ? estilos.contenedorGrande : estilos.contenedor}>
      <Animated.View
        style={{ opacity: estado === 'en_riesgo' ? 0.55 : 1, transform: [{ scale: escala }] }}
      >
        <IconoLlama colorExterior={colorExterior} colorInterior={colorInterior} tamano={esGrande ? 72 : 34} />
      </Animated.View>
      <Text
        style={[esGrande ? estilos.diasGrande : estilos.dias, { color: t.ink, fontFamily: tipografia.display }]}
      >
        {diasConsecutivos}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dias: { fontSize: 28, fontWeight: '700' },
  contenedorGrande: { alignItems: 'center' },
  diasGrande: { fontSize: 56, fontWeight: '700', marginTop: 4 },
});
