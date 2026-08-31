/**
 * Tokens de tipografía (Fase 8, ADR-026 y ADR-027). Dos ejes independientes:
 * el TEMA decide *cuál* familia (Fredoka/Nunito para Arcade, Lora/Karla para
 * Papel), y la PREFERENCIA decide si se usan esas familias o la letra del
 * sistema. Los pesos concretos se cargan con `useFonts` en `app/_layout.tsx`;
 * los nombres de aquí deben coincidir con las claves que se registran ahí.
 */
import type { TemaId } from './colores';

export type TipografiaId = 'sistema' | 'tematica';

export interface TokensTipografia {
  /** `undefined` = sin `fontFamily`, es decir la fuente del sistema. */
  display?: string;
  body?: string;
}

export function tipografiaDelTema(tema: TemaId, preferencia: TipografiaId): TokensTipografia {
  if (preferencia === 'sistema') return {};
  switch (tema) {
    case 'soft':
      // Soft UI prioriza legibilidad y calidez — Nunito (sans redondeada) encaja.
      return { display: 'Nunito_600SemiBold', body: 'Nunito_400Regular' };
    case 'arcade':
      return { display: 'Fredoka_600SemiBold', body: 'Nunito_400Regular' };
    case 'papel':
      return { display: 'Lora_600SemiBold', body: 'Karla_400Regular' };
  }
}
