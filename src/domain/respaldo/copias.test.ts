import {
  copiaParaRecuperar,
  copiasABorrar,
  describirFecha,
  esArchivoSQLite,
  nombreDeRespaldo,
  resumenLegible,
  tieneProgreso,
  tocaCopiaDiaria,
  type MetaCopia,
  type ResumenDatos,
  type TipoCopia,
} from './copias';

const VACIO: ResumenDatos = { revisiones: 0, sesiones: 0, diasPracticados: 0, listas: 0, numeros: 0 };
const CON_PROGRESO: ResumenDatos = { revisiones: 1240, sesiones: 80, diasPracticados: 45, listas: 3, numeros: 2 };

/** Fechas LOCALES, para que el día de calendario no dependa de la zona horaria del equipo. */
const dia = (d: number, h = 10) => new Date(2026, 8, d, h, 0, 0);

/** Nacimiento de la base original (su primera migración) y de una base recreada después. */
const BASE_ORIGINAL = new Date(2026, 7, 1).toISOString();
const BASE_RECREADA = new Date(2026, 8, 28, 9).toISOString();

function copia(id: string, tipo: TipoCopia, fecha: Date, resumen: ResumenDatos = CON_PROGRESO): MetaCopia {
  return { id, tipo, creadaEn: fecha.toISOString(), versionEsquema: 8, resumen, tamano: 1000, idBase: BASE_ORIGINAL };
}

describe('esArchivoSQLite', () => {
  const cabecera = new TextEncoder().encode('SQLite format 3\u0000');

  it('reconoce la cabecera de 16 bytes de SQLite', () => {
    const bytes = new Uint8Array(4096);
    bytes.set(cabecera, 0);
    expect(esArchivoSQLite(bytes)).toBe(true);
  });

  it('rechaza cualquier otro archivo, aunque se llame .db', () => {
    expect(esArchivoSQLite(new TextEncoder().encode('%PDF-1.7 esto no es una base de datos'))).toBe(false);
    expect(esArchivoSQLite(cabecera.slice(0, 10))).toBe(false);
    expect(esArchivoSQLite(new Uint8Array(0))).toBe(false);
  });
});

describe('tieneProgreso', () => {
  it('una base recién instalada no tiene progreso', () => {
    expect(tieneProgreso(VACIO)).toBe(false);
  });

  it('basta un repaso, una lista o un número para tenerlo', () => {
    expect(tieneProgreso({ ...VACIO, revisiones: 1 })).toBe(true);
    expect(tieneProgreso({ ...VACIO, listas: 1 })).toBe(true);
    expect(tieneProgreso({ ...VACIO, numeros: 1 })).toBe(true);
  });
});

describe('copiaParaRecuperar', () => {
  it('no ofrece nada si la base actual tiene progreso', () => {
    expect(copiaParaRecuperar(CON_PROGRESO, BASE_RECREADA, [copia('a', 'diaria', dia(20))], null)).toBeNull();
  });

  it('base recreada y vacía, con copias de la anterior: ofrece la más reciente con progreso', () => {
    const copias = [
      copia('vieja', 'diaria', dia(20)),
      copia('nueva', 'antes-de-actualizar', dia(26)),
      copia('vacia', 'antes-de-actualizar', dia(27), VACIO),
    ];
    expect(copiaParaRecuperar(VACIO, BASE_RECREADA, copias, null)?.id).toBe('nueva');
  });

  // Encontrado por la prueba E2E: borrar tu única lista deja la base sin
  // progreso, pero no es una pérdida. Es la MISMA base: no se ofrece nada.
  it('la misma base vaciada por el usuario no es una pérdida', () => {
    expect(copiaParaRecuperar(VACIO, BASE_ORIGINAL, [copia('a', 'diaria', dia(20))], null)).toBeNull();
  });

  it('sin copias, o solo copias vacías, no hay nada que recuperar', () => {
    expect(copiaParaRecuperar(VACIO, BASE_RECREADA, [], null)).toBeNull();
    expect(copiaParaRecuperar(VACIO, BASE_RECREADA, [copia('vacia', 'diaria', dia(20), VACIO)], null)).toBeNull();
  });

  it('si elegiste empezar de cero, no vuelve a preguntar por esas copias', () => {
    const copias = [copia('a', 'diaria', dia(20)), copia('b', 'diaria', dia(21))];
    expect(copiaParaRecuperar(VACIO, BASE_RECREADA, copias, dia(21).toISOString())).toBeNull();
  });

  it('pero sí por una copia posterior a esa decisión', () => {
    const copias = [copia('a', 'diaria', dia(20)), copia('b', 'diaria', dia(24))];
    expect(copiaParaRecuperar(VACIO, BASE_RECREADA, copias, dia(21).toISOString())?.id).toBe('b');
  });
});

describe('tocaCopiaDiaria', () => {
  it('nunca copia una base sin progreso: no debe desplazar copias buenas', () => {
    expect(tocaCopiaDiaria([], VACIO, dia(28))).toBe(false);
  });

  it('copia si no hay ninguna diaria', () => {
    expect(tocaCopiaDiaria([copia('u', 'antes-de-actualizar', dia(28))], CON_PROGRESO, dia(28))).toBe(true);
  });

  it('una por día de calendario local', () => {
    expect(tocaCopiaDiaria([copia('hoy', 'diaria', dia(28, 8))], CON_PROGRESO, dia(28, 22))).toBe(false);
    expect(tocaCopiaDiaria([copia('ayer', 'diaria', dia(27, 23))], CON_PROGRESO, dia(28, 7))).toBe(true);
  });
});

describe('copiasABorrar', () => {
  it('conserva las 3 diarias más recientes', () => {
    const copias = [1, 2, 3, 4, 5].map((d) => copia(`d${d}`, 'diaria', dia(d)));
    expect(copiasABorrar(copias).sort()).toEqual(['d1', 'd2']);
  });

  it('cuenta cada tipo por separado', () => {
    const copias = [
      copia('d1', 'diaria', dia(1)),
      copia('u1', 'antes-de-actualizar', dia(2)),
      copia('u2', 'antes-de-actualizar', dia(3)),
      copia('u3', 'antes-de-actualizar', dia(4)),
      copia('r1', 'antes-de-restaurar', dia(5)),
    ];
    expect(copiasABorrar(copias)).toEqual(['u1']);
  });

  it('nunca borra la copia más reciente con progreso, aunque le toque por antigüedad', () => {
    const copias = [
      copia('buena', 'antes-de-actualizar', dia(10)),
      copia('vacia1', 'antes-de-actualizar', dia(11), VACIO),
      copia('vacia2', 'antes-de-actualizar', dia(12), VACIO),
    ];
    expect(copiasABorrar(copias)).toEqual(['vacia1']);
  });
});

describe('nombreDeRespaldo', () => {
  it('lleva la fecha local, para distinguir respaldos en Archivos', () => {
    expect(nombreDeRespaldo(dia(28, 23))).toBe('ancla-respaldo-2026-09-28.db');
  });
});

describe('resumenLegible', () => {
  it('cuenta lo que importa, en plural o singular', () => {
    expect(resumenLegible(CON_PROGRESO)).toBe('1.240 repasos · 45 días de práctica · 3 listas · 2 números');
    expect(resumenLegible({ ...VACIO, revisiones: 1, diasPracticados: 1, listas: 1, numeros: 1 })).toBe(
      '1 repaso · 1 día de práctica · 1 lista · 1 número',
    );
  });

  it('omite lo que está en cero', () => {
    expect(resumenLegible({ ...VACIO, revisiones: 12, diasPracticados: 2 })).toBe('12 repasos · 2 días de práctica');
  });

  it('una base vacía lo dice', () => {
    expect(resumenLegible(VACIO)).toBe('Sin práctica todavía');
  });
});

describe('describirFecha', () => {
  const ahora = dia(28, 18);

  it('hoy y ayer por su nombre, con la hora', () => {
    expect(describirFecha(new Date(2026, 8, 28, 10, 32).toISOString(), ahora)).toBe('hoy a las 10:32');
    expect(describirFecha(new Date(2026, 8, 27, 21, 5).toISOString(), ahora)).toBe('ayer a las 21:05');
  });

  it('antes de ayer, con día y mes', () => {
    expect(describirFecha(new Date(2026, 8, 25, 9, 0).toISOString(), ahora)).toBe('el 25 sep. a las 09:00');
    expect(describirFecha(new Date(2026, 0, 3, 23, 59).toISOString(), ahora)).toBe('el 3 ene. a las 23:59');
  });

  it('otro año lo dice', () => {
    expect(describirFecha(new Date(2025, 11, 31, 8, 15).toISOString(), ahora)).toBe('el 31 dic. de 2025 a las 08:15');
  });
});
