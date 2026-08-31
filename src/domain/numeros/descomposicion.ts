/**
 * Descomposición fonética de números (§8.5, agent_docs/modulos/05-numeros.md).
 * Reglas de troceo y casos de cero en agent_docs/decodificacion-fonetica.md §5
 * (ADR-019) — no se modifican aquí sin actualizar esos documentos primero.
 */

export const RARA = 'Rara';
export const ORO = 'Oro';

export interface Trozo {
  digitos: string;
  valor: number;
  palabra: string | null;
}

const SOLO_DIGITOS = /^[0-9]+$/;

export function trocear(digitos: string): string[] {
  // Decimales (π-100, φ, e): la descomposición opera solo sobre DÍGITOS;
  // el separador no pertenece a la fonética. Lo eliminamos antes de validar.
  const soloDigitos = digitos.replace(/[.,]/g, '');
  if (!/^[0-9]+$/.test(soloDigitos) || soloDigitos.length === 0) {
    throw new Error(`"${digitos}" debe contener solo dígitos 0-9 (con un . opcional), sin estar vacío`);
  }
  return trocearSoloDigitos(soloDigitos);
}

function trocearSoloDigitos(digitos: string): string[] {
  const trozos: string[] = [];
  let i = 0;
  while (i < digitos.length - 1) {
    trozos.push(digitos.slice(i, i + 2));
    i += 2;
  }
  if (i < digitos.length) {
    trozos.push(digitos.slice(i));
  }
  return trozos;
}

/**
 * `buscarPalabra` consulta las palabras colgadero VIGENTES (§4 del módulo: la
 * descomposición se deriva en el momento, nunca se persiste), por eso se
 * inyecta en vez de importar la semilla estática — el operador puede haber
 * editado o vaciado una palabra desde entonces.
 */
export function descomponer(digitos: string, buscarPalabra: (valor: number) => string | undefined): Trozo[] {
  return trocear(digitos).map((chunk) => {
    const valor = Number(chunk);
    const esSobranteImpar = chunk.length === 1;

    if (valor === 0) {
      return { digitos: chunk, valor, palabra: esSobranteImpar ? ORO : RARA };
    }

    const palabra = buscarPalabra(valor);
    return { digitos: chunk, valor, palabra: palabra ? palabra : null };
  });
}
