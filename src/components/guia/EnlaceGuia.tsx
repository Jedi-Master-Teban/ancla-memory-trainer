import { router } from 'expo-router';
import { BookOpen } from 'lucide';
import type { IdCapitulo } from '../../domain/guia/contenido';
import { BotonRedondo } from '../BotonRedondo';

/**
 * El libro de la cabecera de cada categoría: lleva a su capítulo de la Guía
 * (ADR-031). Mismo botón redondo que la flecha de volver, al otro lado.
 */
export function EnlaceGuia({ capitulo, nombre }: { capitulo: IdCapitulo; nombre: string }) {
  return (
    <BotonRedondo
      icono={BookOpen}
      etiqueta={`Guía: ${nombre}`}
      onPress={() => router.push(`/guia/${capitulo}` as never)}
    />
  );
}
