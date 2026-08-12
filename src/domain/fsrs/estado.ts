import { State, TypeConvert, type Card, type CardInput } from 'ts-fsrs';
import { retrievability } from './scheduler';

export type EstadoVisual = 'nueva' | 'aprendiendo' | 'madura' | 'en_riesgo';

const UMBRAL_RETRIEVABILITY_EN_RIESGO = 0.9;
const UMBRAL_DIAS_ESTABILIDAD_MADURA = 21;

export function estadoVisual(tarjeta: Card | CardInput, ahora: Date): EstadoVisual {
  const estado = TypeConvert.state(tarjeta.state);

  if (estado === State.New) return 'nueva';
  if (estado === State.Learning || estado === State.Relearning) return 'aprendiendo';

  if (retrievability(tarjeta, ahora) < UMBRAL_RETRIEVABILITY_EN_RIESGO) return 'en_riesgo';
  if (tarjeta.stability >= UMBRAL_DIAS_ESTABILIDAD_MADURA) return 'madura';
  return 'aprendiendo';
}
