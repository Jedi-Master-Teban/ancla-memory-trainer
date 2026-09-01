import { StyleSheet, Text, View } from 'react-native';
import type { EstadoRacha } from '../domain/racha/calculo';
import { colorRachaPorDias, siguienteUmbral } from '../domain/racha/streak-color';
import { useTema } from '../stores/tema';
import { IndicadorRacha } from './IndicadorRacha';

interface Props {
  diasConsecutivos: number;
  estado: EstadoRacha;
  /** 'mini' (default, header pill) o 'hero' (racha.tsx pantalla completa) */
  tamano?: 'mini' | 'hero';
}

/**
 * StreakPill — versión "premium" del IndicadorRacha:
 * - Marco coloreado que cambia en umbrales (gris → amarillo → naranja → rojo → gold).
 * - Halo glow alrededor de la flama en niveles altos.
 * - Muestra la meta del siguiente umbral como microcopy motivador.
 *
 * Investigación aplicada (Octalysis + loss aversion): cada umbral es un
 * achievement tangible; el color hace al usuario consciente de lo que
 * perdería si rompe la racha.
 */
export function StreakPill({ diasConsecutivos, estado, tamano = 'mini' }: Props) {
  const { colores: t } = useTema();
  const cRacha = colorRachaPorDias(diasConsecutivos, t);
  const meta = siguienteUmbral(diasConsecutivos);

  if (tamano === 'hero') {
    return (
      <View
        style={[
          estilos.heroContenedor,
          {
            backgroundColor: cRacha.fondo,
            borderColor: cRacha.borde,
            shadowColor: cRacha.halo,
          },
        ]}
      >
        <IndicadorRacha diasConsecutivos={diasConsecutivos} estado={estado} tamano="grande" />
        {meta && (
          <Text style={[estilos.heroMeta, { color: t.inkMuted }]}>
            Siguiente meta: {meta.etiqueta}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        estilos.miniContenedor,
        {
          backgroundColor: cRacha.fondo,
          borderColor: cRacha.borde,
        },
      ]}
    >
      <IndicadorRacha diasConsecutivos={diasConsecutivos} estado={estado} tamano="normal" />
    </View>
  );
}

const estilos = StyleSheet.create({
  miniContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  heroContenedor: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 6,
  },
  heroMeta: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
