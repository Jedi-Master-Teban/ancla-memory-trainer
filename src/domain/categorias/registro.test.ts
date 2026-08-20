import type { FilaTarjeta } from '../../db/tipos';
import { aNumero } from '../fonetica/decodificador';
import { esCategoriaValida, REGISTRO } from './registro';

function tarjeta(parcial: Partial<FilaTarjeta> & { id: string; categoria: FilaTarjeta['categoria'] }): FilaTarjeta {
  return {
    mazo_id: 'mazo-1',
    contenido_frente: '',
    contenido_reverso: '',
    fsrs_state: 0,
    fsrs_dificultad: 0,
    fsrs_estabilidad: 0,
    fsrs_reps: 0,
    fsrs_lapses: 0,
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

describe('REGISTRO — forma para las 4 categorías reales', () => {
  it.each(['colgadero', 'naipe', 'numero', 'lista_item'] as const)('%s tiene etiquetas y campos', (categoria) => {
    const def = REGISTRO[categoria];
    expect(def.etiquetaSingular.length).toBeGreaterThan(0);
    expect(def.etiquetaPlural.length).toBeGreaterThan(0);
    expect(def.campos.length).toBeGreaterThan(0);
  });
});

describe('validar — colgadero delega en validarColgadero real (fonetica/decodificador.ts)', () => {
  it('palabra que sí decodifica al número dado: sin advertencias', () => {
    const numero = aNumero('Oro');
    const resultado = REGISTRO.colgadero.validar!({ numero: String(numero), palabra: 'Oro' });
    expect(resultado.advertencias).toEqual([]);
  });

  it('palabra que no decodifica al número dado: advierte, no bloquea (§4)', () => {
    const resultado = REGISTRO.colgadero.validar!({ numero: '99', palabra: 'Oro' });
    expect(resultado.advertencias.length).toBeGreaterThan(0);
  });

  it('número no numérico: advierte en vez de reventar', () => {
    const resultado = REGISTRO.colgadero.validar!({ numero: 'abc', palabra: 'Oro' });
    expect(resultado.advertencias.length).toBeGreaterThan(0);
  });
});

describe('validar — naipe delega en validarPalabraNaipe real (fonetica/naipes.ts)', () => {
  const cartaDiamantesAs = { palo: 'diamantes', valor: 'A', aprobada_por_operador: true };

  it('palabra válida para la carta de la tarjeta existente: sin advertencias', () => {
    const t = tarjeta({ id: 't1', categoria: 'naipe', metadata_categoria: JSON.stringify(cartaDiamantesAs) });
    // "Dato": d(marcador diamantes) + a + t(As) + o — mismo ejemplo que naipes.test.ts.
    const resultado = REGISTRO.naipe.validar!({ palabra: 'Dato' }, t);
    expect(resultado.advertencias).toEqual([]);
  });

  it('palabra inválida para la carta: el motivo real se refleja como advertencia, no bloquea (§4)', () => {
    const t = tarjeta({ id: 't1', categoria: 'naipe', metadata_categoria: JSON.stringify(cartaDiamantesAs) });
    const resultado = REGISTRO.naipe.validar!({ palabra: 'Zapato' }, t);
    expect(resultado.advertencias.length).toBeGreaterThan(0);
  });

  it('sin tarjeta existente (naipe nunca se crea, solo defensivo): sin advertencias', () => {
    const resultado = REGISTRO.naipe.validar!({ palabra: 'Dato' }, undefined);
    expect(resultado.advertencias).toEqual([]);
  });
});

describe('numero y lista_item — sin validador de dominio (ninguno existe hoy)', () => {
  it('numero.validar no está definido', () => {
    expect(REGISTRO.numero.validar).toBeUndefined();
  });

  it('lista_item.validar no está definido', () => {
    expect(REGISTRO.lista_item.validar).toBeUndefined();
  });
});

describe('cargarValores', () => {
  it('colgadero: número y palabra desde metadata/contenido_reverso', () => {
    const t = tarjeta({
      id: 't1',
      categoria: 'colgadero',
      contenido_reverso: 'Oro',
      metadata_categoria: JSON.stringify({ numero: 0 }),
    });
    expect(REGISTRO.colgadero.cargarValores!(t)).toEqual({ numero: '0', palabra: 'Oro' });
  });

  it('naipe: solo la palabra (la carta no es un campo del formulario)', () => {
    const t = tarjeta({ id: 't1', categoria: 'naipe', contenido_reverso: 'Dato' });
    expect(REGISTRO.naipe.cargarValores!(t)).toEqual({ palabra: 'Dato' });
  });

  it('numero: etiqueta y dígitos desde frente/reverso', () => {
    const t = tarjeta({ id: 't1', categoria: 'numero', contenido_frente: 'Clave caja fuerte', contenido_reverso: '045' });
    expect(REGISTRO.numero.cargarValores!(t)).toEqual({ etiqueta: 'Clave caja fuerte', digitos: '045' });
  });

  it('lista_item no tiene cargarValores — este mecanismo solo crea, nunca edita lista_item', () => {
    expect(REGISTRO.lista_item.cargarValores).toBeUndefined();
  });
});

describe('esCategoriaValida', () => {
  it.each(['colgadero', 'naipe', 'numero', 'lista_item'])('"%s" es una categoría válida', (c) => {
    expect(esCategoriaValida(c)).toBe(true);
  });

  it('un valor que no es ninguna de las 4 categorías reales no es válido', () => {
    expect(esCategoriaValida('palabra_clave')).toBe(false);
    expect(esCategoriaValida('')).toBe(false);
    expect(esCategoriaValida(undefined)).toBe(false);
  });
});
