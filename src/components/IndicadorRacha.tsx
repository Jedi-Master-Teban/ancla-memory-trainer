import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MorphIcon } from 'morphicons/react-native';
import type { MorphHandle } from 'morphicons/react-native';
import type { EstadoRacha } from '../domain/racha/calculo';
import { useTema } from '../stores/tema';
import { Odometro } from './Odometro';

interface Props {
  diasConsecutivos: number;
  estado: EstadoRacha;
  /** 'normal' (default): mini-versión del dashboard. 'grande': tarjeta hero de racha.tsx. */
  tamano?: 'normal' | 'grande';
}

const DURACION_PULSO_MS: Record<EstadoRacha, number> = { activa: 900, en_riesgo: 450, rota: 0 };

/**
 * Datos de icono estilo Lucide (IconNode): [elemento, atributos][].
 * Morphicons morfea cualquier icono stroke-based entre sí con spring physics.
 *
 * - LLAMA ACTIVA: Flame de Lucide (una llama llena de movimiento).
 * - LLAMA EN RIESGO: la misma Flame — la urgencia la da el pulso rápido y
 *   la opacidad reducida (ya en v1), no un icono distinto.
 * - RACHA ROTA: FlameKindling (brasas apagándose sobre leños) — el morph
 *   Flame→FlameKindling es literalmente "la llama se apaga".
 */
const ICONO_LLAMA = [
  [
    'path',
    {
      d: 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4',
    },
  ],
] as const;

const ICONO_BRASAS = [
  [
    'path',
    {
      d: 'M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z',
    },
  ],
  ['path', { d: 'm5 22 14-4' }],
  ['path', { d: 'm5 18 14 4' }],
] as const;

/**
 * Llama de la racha — v2 (Fase 8 pulido premium).
 *
 * - MORPH real con Morphicons: al romperse la racha la llama se desvanece
 *   en brasas con spring physics ("gentle"); al recuperarla, vuelve a prender.
 * - Halo radial detrás (glow funcional): respira junto con el pulso; se
 *   apaga si la racha está rota.
 * - Pulso de escala conservado de v1: `en_riesgo` late más rápido (450 ms).
 * - reducedMotion:"user" respeta el ajuste de Accesibilidad del OS.
 */
export function IndicadorRacha({ diasConsecutivos, estado, tamano = 'grande' }: Props) {
  const { colores: t, tipografia } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(estado === 'rota' ? 0 : 1)).current;
  const morfRef = useRef<MorphHandle>(null);

  // Morph según estado (la librería anima cuando cambia la prop `icon`;
  // el ref queda disponible para futuras interacciones táctiles).
  useEffect(() => {
    morfRef.current?.set(estado === 'rota' ? ICONO_BRASAS : ICONO_LLAMA);
  }, [estado]);

  useEffect(() => {
    const duracion = DURACION_PULSO_MS[estado];
    if (duracion === 0) {
      escala.setValue(1);
      Animated.timing(halo, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      return;
    }
    halo.setValue(estado === 'en_riesgo' ? 0.45 : 1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(escala, { toValue: 1.12, duration: duracion, useNativeDriver: true }),
          Animated.timing(halo, {
            toValue: estado === 'en_riesgo' ? 0.7 : 0.55,
            duration: duracion,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(escala, { toValue: 1, duration: duracion, useNativeDriver: true }),
          Animated.timing(halo, {
            toValue: estado === 'en_riesgo' ? 0.45 : 1,
            duration: duracion,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [estado, escala, halo]);

  const esGrande = tamano === 'grande';
  const tamanoLlama = esGrande ? 56 : 28;
  const colorLlama = estado === 'rota' ? t.inkMuted : t.flameOuterEnd;
  const fontSizeDias = esGrande ? 56 : 28;
  const anchoDigito = esGrande ? 34 : 17;

  return (
    <View style={esGrande ? estilos.contenedorGrande : estilos.contenedor}>
      <View>
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.halo,
            esGrande ? estilos.haloGrande : estilos.haloMini,
            { opacity: estado === 'rota' ? 0 : halo },
          ]}
        />
        <Animated.View style={{ opacity: estado === 'en_riesgo' ? 0.8 : 1, transform: [{ scale: escala }] }}>
          <MorphIcon
            ref={morfRef}
            icon={estado === 'rota' ? ICONO_BRASAS : ICONO_LLAMA}
            size={tamanoLlama}
            color={colorLlama}
            strokeWidth={2}
            spring="bouncy"
            reducedMotion="user"
            label={estado === 'rota' ? 'racha rota' : 'llama de racha activa'}
          />
        </Animated.View>
      </View>
      <View style={esGrande ? estilos.diasWrapGrande : estilos.diasWrap}>
        <Odometro
          valor={diasConsecutivos}
          color={t.ink}
          fontFamily={tipografia.display}
          fontSize={fontSizeDias}
          fontWeight="700"
          anchoDigito={anchoDigito}
          altoDigito={Math.round(fontSizeDias * 1.05)}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dias: { fontSize: 28, fontWeight: '700' },
  diasWrap: { flexDirection: 'row', alignItems: 'center' },
  contenedorGrande: { alignItems: 'center' },
  diasGrande: { fontSize: 56, fontWeight: '700', marginTop: 4 },
  diasWrapGrande: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,130,29,0.30)',
  },
  haloMini: { width: 40, height: 40, top: -6 },
  haloGrande: { width: 76, height: 76, top: -10 },
});
