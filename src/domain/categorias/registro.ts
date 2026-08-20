import type { Categoria, FilaTarjeta, MetadataColgadero, MetadataNaipe } from '../../db/tipos';
import { validarColgadero } from '../fonetica/decodificador';
import { validarPalabraNaipe, type Carta } from '../fonetica/naipes';

export type TipoCampo = 'texto' | 'numero' | 'seleccion';

export interface CampoCategoria {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];
}

export interface ResultadoValidacionCategoria {
  advertencias: string[];
}

/**
 * `validar` recibe la tarjeta existente (no solo los valores del formulario)
 * porque colgadero/naipe validan relativo a un dato que no siempre es un
 * campo editable: para naipe, la carta (palo/valor) vive en la tarjeta que
 * se edita, nunca en el formulario — naipe nunca se crea (ver REGISTRO.naipe
 * abajo y ADR-025).
 */
export interface DefinicionCategoria {
  etiquetaSingular: string;
  etiquetaPlural: string;
  campos: CampoCategoria[];
  validar?: (valores: Record<string, string>, tarjetaExistente?: FilaTarjeta) => ResultadoValidacionCategoria;
  cargarValores?: (tarjeta: FilaTarjeta) => Record<string, string>;
}

/**
 * Registro genérico de categorías (§8.6, agent_docs/modulos/06-ejercicios-custom.md).
 * `validar` siempre ADAPTA el validador de dominio real — nunca lo reimplementa — a
 * esta forma común de advertencias no bloqueantes (§4). numero y lista_item no tienen
 * validador de dominio real, así que no tienen `validar` aquí tampoco.
 */
export const REGISTRO: Record<Categoria, DefinicionCategoria> = {
  colgadero: {
    etiquetaSingular: 'Colgadero',
    etiquetaPlural: 'Colgadero',
    campos: [
      { clave: 'numero', etiqueta: 'Número', tipo: 'numero', requerido: true },
      { clave: 'palabra', etiqueta: 'Palabra', tipo: 'texto', requerido: true },
    ],
    validar: (valores) => {
      const numero = Number(valores.numero);
      const ok = Number.isFinite(numero) && validarColgadero(numero, valores.palabra);
      return {
        advertencias: ok
          ? []
          : [`"${valores.palabra}" no decodifica al número ${valores.numero || '?'} según la tabla fonética.`],
      };
    },
    cargarValores: (tarjeta) => {
      const { numero } = JSON.parse(tarjeta.metadata_categoria) as MetadataColgadero;
      return { numero: String(numero), palabra: tarjeta.contenido_reverso };
    },
  },

  naipe: {
    etiquetaSingular: 'Naipe',
    etiquetaPlural: 'Naipes',
    campos: [{ clave: 'palabra', etiqueta: 'Palabra', tipo: 'texto', requerido: true }],
    // Sin creación (mazo cerrado de 52 cartas, ADR-025) — validar siempre recibe una
    // tarjetaExistente en la práctica; el caso undefined es puramente defensivo.
    validar: (valores, tarjetaExistente) => {
      if (!tarjetaExistente) return { advertencias: [] };
      const { palo, valor } = JSON.parse(tarjetaExistente.metadata_categoria) as MetadataNaipe;
      const carta: Carta = { palo, valor };
      const resultado = validarPalabraNaipe(valores.palabra, carta);
      const advertencias = [...resultado.advertencias];
      if (!resultado.valida && resultado.motivo) advertencias.unshift(resultado.motivo);
      return { advertencias };
    },
    cargarValores: (tarjeta) => ({ palabra: tarjeta.contenido_reverso }),
  },

  numero: {
    etiquetaSingular: 'Número',
    etiquetaPlural: 'Números',
    campos: [
      { clave: 'etiqueta', etiqueta: 'Etiqueta', tipo: 'texto', requerido: true },
      { clave: 'digitos', etiqueta: 'Dígitos', tipo: 'numero', requerido: true },
    ],
    // Sin validar: no existe validador de dominio para números — descomponer() es un
    // transform puro (Trozo.palabra === null es informativo, "sin colgadero", nunca
    // un caso inválido — ver src/domain/numeros/descomposicion.ts).
    cargarValores: (tarjeta) => ({ etiqueta: tarjeta.contenido_frente, digitos: tarjeta.contenido_reverso }),
  },

  lista_item: {
    etiquetaSingular: 'Objeto',
    etiquetaPlural: 'Objetos',
    campos: [{ clave: 'texto', etiqueta: 'Objeto', tipo: 'texto', requerido: true }],
    // Sin validar (no existe detección de duplicados en este dominio) y sin
    // cargarValores: este mecanismo solo CREA lista_item (agrega un objeto al final
    // de una lista existente) — nunca edita uno, ver GUARDAR_CATEGORIA.lista_item en
    // src/db/repository.ts.
  },
};

const CATEGORIAS_VALIDAS = Object.keys(REGISTRO) as Categoria[];

export function esCategoriaValida(valor: string | undefined): valor is Categoria {
  return valor !== undefined && (CATEGORIAS_VALIDAS as string[]).includes(valor);
}
