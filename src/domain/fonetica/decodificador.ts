/**
 * Decodificador fonético (§7.2 del brief). Algoritmo y prioridad de reglas
 * documentados en agent_docs/decodificacion-fonetica.md §2-3 — no se
 * modifica esta lógica sin actualizar ese documento primero.
 */

export interface Fonema {
  sonido: string;
  digito: number;
  indice: number;
}

export interface ResultadoDecodificacion {
  digitos: number[];
  fonemas: Fonema[];
}

const SIN_VALOR = new Set(['a', 'e', 'i', 'o', 'u', 'h', 'w', 'x', 'y']);

export function normalizar(palabra: string): string {
  return palabra
    .toLowerCase()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/[\s-]/g, '');
}

function esEOI(caracter: string | undefined): boolean {
  return caracter === 'e' || caracter === 'i';
}

export function decodificar(palabraOriginal: string): ResultadoDecodificacion {
  if (palabraOriginal.length === 0) {
    throw new Error('La palabra no puede estar vacía');
  }

  const palabra = normalizar(palabraOriginal);
  if (palabra.length === 0) {
    throw new Error(`"${palabraOriginal}" no queda ningún carácter tras normalizar`);
  }

  const digitos: number[] = [];
  const fonemas: Fonema[] = [];
  let i = 0;

  while (i < palabra.length) {
    const c = palabra[i];
    const dos = palabra.slice(i, i + 2);

    if (dos === 'ch') {
      fonemas.push({ sonido: 'ch', digito: 8, indice: i });
      digitos.push(8);
      i += 2;
    } else if (dos === 'll') {
      fonemas.push({ sonido: 'll', digito: 5, indice: i });
      digitos.push(5);
      i += 2;
    } else if (dos === 'rr') {
      fonemas.push({ sonido: 'rr', digito: 0, indice: i });
      digitos.push(0);
      i += 2;
    } else if (dos === 'qu' && esEOI(palabra[i + 2])) {
      fonemas.push({ sonido: 'qu', digito: 4, indice: i });
      digitos.push(4);
      i += 2;
    } else if (dos === 'gu' && esEOI(palabra[i + 2])) {
      fonemas.push({ sonido: 'gu', digito: 8, indice: i });
      digitos.push(8);
      i += 2;
    } else if (c === 'c' && esEOI(palabra[i + 1])) {
      fonemas.push({ sonido: 'c', digito: 6, indice: i });
      digitos.push(6);
      i += 1;
    } else if (c === 'c') {
      fonemas.push({ sonido: 'c', digito: 4, indice: i });
      digitos.push(4);
      i += 1;
    } else if (c === 'g' && esEOI(palabra[i + 1])) {
      fonemas.push({ sonido: 'g', digito: 7, indice: i });
      digitos.push(7);
      i += 1;
    } else if (c === 'g') {
      fonemas.push({ sonido: 'g', digito: 8, indice: i });
      digitos.push(8);
      i += 1;
    } else if (c === 't' || c === 'd') {
      fonemas.push({ sonido: c, digito: 1, indice: i });
      digitos.push(1);
      i += 1;
    } else if (c === 'n' || c === 'ñ') {
      fonemas.push({ sonido: c, digito: 2, indice: i });
      digitos.push(2);
      i += 1;
    } else if (c === 'm') {
      fonemas.push({ sonido: c, digito: 3, indice: i });
      digitos.push(3);
      i += 1;
    } else if (c === 'k' || c === 'q') {
      fonemas.push({ sonido: c, digito: 4, indice: i });
      digitos.push(4);
      i += 1;
    } else if (c === 'l') {
      fonemas.push({ sonido: c, digito: 5, indice: i });
      digitos.push(5);
      i += 1;
    } else if (c === 's' || c === 'z') {
      fonemas.push({ sonido: c, digito: 6, indice: i });
      digitos.push(6);
      i += 1;
    } else if (c === 'f' || c === 'j') {
      fonemas.push({ sonido: c, digito: 7, indice: i });
      digitos.push(7);
      i += 1;
    } else if (c === 'v' || c === 'b' || c === 'p') {
      fonemas.push({ sonido: c, digito: 9, indice: i });
      digitos.push(9);
      i += 1;
    } else if (c === 'r') {
      fonemas.push({ sonido: c, digito: 0, indice: i });
      digitos.push(0);
      i += 1;
    } else if (SIN_VALOR.has(c)) {
      i += 1;
    } else {
      throw new Error(`Carácter no reconocido: "${c}" en "${palabraOriginal}"`);
    }
  }

  return { digitos, fonemas };
}

export function aNumero(palabra: string): number {
  const { digitos } = decodificar(palabra);
  if (digitos.length === 0) {
    throw new Error(`"${palabra}" no contiene ningún dígito`);
  }
  return Number(digitos.join(''));
}

export function validarColgadero(numero: number, palabra: string): boolean {
  try {
    return aNumero(palabra) === numero;
  } catch {
    return false;
  }
}

export function explicar(palabra: string): string {
  const { fonemas, digitos } = decodificar(palabra);
  const partes = fonemas.map((f) => `${f.sonido}(${f.digito})`);
  return `${partes.join(' + ')} → ${digitos.join('')}`;
}
