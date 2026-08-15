import { State } from 'ts-fsrs';
import type { FilaTarjeta } from '../db/tipos';
import { rutaEditar } from './TarjetasProblematicas';

function tarjeta(parcial: Partial<FilaTarjeta> & { id: string }): FilaTarjeta {
  return {
    mazo_id: 'mazo-1',
    categoria: 'colgadero',
    contenido_frente: '1',
    contenido_reverso: 'Tea',
    fsrs_state: State.Review,
    fsrs_dificultad: 0,
    fsrs_estabilidad: 0,
    fsrs_reps: 0,
    fsrs_lapses: 3,
    fsrs_scheduled_days: 0,
    fsrs_learning_steps: 0,
    fecha_ultima_revision: null,
    fecha_proxima_revision: new Date().toISOString(),
    metadata_categoria: '{}',
    creada_en: new Date().toISOString(),
    archivada: 0,
    ...parcial,
  };
}

describe('rutaEditar', () => {
  it('colgadero: apunta al índice de la categoría (sin editor propio hoy, hueco real conocido)', () => {
    const t = tarjeta({ id: 't1', categoria: 'colgadero' });
    expect(rutaEditar(t)).toBe('/colgadero');
  });

  it('naipe: apunta al índice, que ya tiene edición inline', () => {
    const t = tarjeta({ id: 't1', categoria: 'naipe' });
    expect(rutaEditar(t)).toBe('/naipes');
  });

  it('numero: apunta al índice, que ya tiene edición inline', () => {
    const t = tarjeta({ id: 't1', categoria: 'numero' });
    expect(rutaEditar(t)).toBe('/numeros');
  });

  it('lista_item: apunta a la lista específica, leyendo lista_id de metadata_categoria', () => {
    const t = tarjeta({
      id: 't1',
      categoria: 'lista_item',
      metadata_categoria: JSON.stringify({ lista_id: 'lista-42', id_objeto_a: 'a', id_objeto_b: 'b' }),
    });
    expect(rutaEditar(t)).toBe('/listas/lista-42');
  });
});
