import {
  cartaDesdePalabra,
  esFigura,
  explicarNaipe,
  inicialDePalo,
  sonidosDeValor,
  validarPalabraNaipe,
  type Carta,
} from './naipes';

describe('inicialDePalo', () => {
  it.each([
    ['espadas', 'e'],
    ['diamantes', 'd'],
    ['palos', 'p'],
    ['corazones', 'c'],
  ] as const)('%s → %s', (palo, letra) => {
    expect(inicialDePalo(palo)).toBe(letra);
  });
});

describe('esFigura', () => {
  it.each(['J', 'Q', 'K'] as const)('%s es figura', (valor) => {
    expect(esFigura(valor)).toBe(true);
  });

  it.each(['A', '2', '10'] as const)('%s no es figura', (valor) => {
    expect(esFigura(valor)).toBe(false);
  });
});

describe('sonidosDeValor', () => {
  it('devuelve null para figuras (ADR-017: sin restricción de sonido)', () => {
    expect(sonidosDeValor('J')).toBeNull();
    expect(sonidosDeValor('Q')).toBeNull();
    expect(sonidosDeValor('K')).toBeNull();
  });

  it('devuelve los sonidos admitidos para cartas numéricas', () => {
    expect(sonidosDeValor('A')).toEqual(expect.arrayContaining(['t', 'd']));
    expect(sonidosDeValor('10')).toEqual(expect.arrayContaining(['r']));
  });
});

describe('validarPalabraNaipe — contrato 1: cada palo salta correctamente su marcador', () => {
  it('Diamantes: una palabra cuyo valor es As no se confunde con la "d" inicial', () => {
    // "Dato": d(marcador) + a(ignorada) + t(1=As) + o(ignorada)
    const carta: Carta = { palo: 'diamantes', valor: 'A' };
    const resultado = validarPalabraNaipe('Dato', carta);
    expect(resultado.valida).toBe(true);
  });

  it('Palos: una palabra cuyo valor es 9 no se confunde con la "p" inicial', () => {
    // "Pipa": p(marcador) + i(ignorada) + p(9) + a(ignorada)
    const carta: Carta = { palo: 'palos', valor: '9' };
    const resultado = validarPalabraNaipe('Pipa', carta);
    expect(resultado.valida).toBe(true);
  });

  it('Corazones: una palabra cuyo valor es 4 no se confunde con la "c" inicial', () => {
    // "Caco": c(marcador) + a(ignorada) + c(4, ante o) + o(ignorada)
    const carta: Carta = { palo: 'corazones', valor: '4' };
    const resultado = validarPalabraNaipe('Caco', carta);
    expect(resultado.valida).toBe(true);
  });

  it('Espadas: la inicial es vocal, el primer sonido consonante ya es el valor', () => {
    // "Efe": e(marcador, vocal) + f(7) + e(ignorada)
    const carta: Carta = { palo: 'espadas', valor: '7' };
    const resultado = validarPalabraNaipe('Efe', carta);
    expect(resultado.valida).toBe(true);
  });
});

describe('validarPalabraNaipe — contrato 2: "10 de Espadas" acepta E…R y rechaza E…T', () => {
  it('acepta una palabra que termina en sonido R', () => {
    const carta: Carta = { palo: 'espadas', valor: '10' };
    expect(validarPalabraNaipe('Ero', carta).valida).toBe(true);
  });

  it('rechaza una palabra que termina en sonido T (valor de As, no de 10)', () => {
    const carta: Carta = { palo: 'espadas', valor: '10' };
    const resultado = validarPalabraNaipe('Eta', carta);
    expect(resultado.valida).toBe(false);
    expect(resultado.motivo).toBeTruthy();
  });
});

describe('validarPalabraNaipe — contrato 3: Corazones rechaza palabras que empiezan por "ch"', () => {
  it('rechaza con motivo legible', () => {
    const carta: Carta = { palo: 'corazones', valor: '8' };
    const resultado = validarPalabraNaipe('Chapa', carta);
    expect(resultado.valida).toBe(false);
    expect(resultado.motivo).toMatch(/ambig/i);
  });

  it('acepta una palabra de Corazones que empieza por "c" + vocal', () => {
    // "Cocho" hipotético: c(marcador)+o(ig)+ch(8)+o(ig)
    const carta: Carta = { palo: 'corazones', valor: '8' };
    expect(validarPalabraNaipe('Cocho', carta).valida).toBe(true);
  });
});

describe('validarPalabraNaipe — contrato 4: consonantes intermedias son válidas con advertencia', () => {
  it('una palabra con más de un sonido consonante tras el marcador es válida pero avisa', () => {
    // "Danto" para As de Diamantes: d(marcador)+a(ig)+n(intermedia)+t(1, correcto)+o(ig)
    const carta: Carta = { palo: 'diamantes', valor: 'A' };
    const resultado = validarPalabraNaipe('Danto', carta);
    expect(resultado.valida).toBe(true);
    expect(resultado.advertencias.length).toBeGreaterThan(0);
  });

  it('una palabra con exactamente un sonido tras el marcador no genera advertencia', () => {
    const carta: Carta = { palo: 'diamantes', valor: 'A' };
    const resultado = validarPalabraNaipe('Dato', carta);
    expect(resultado.advertencias).toEqual([]);
  });
});

describe('validarPalabraNaipe — figuras (ADR-017): solo Regla 1, sin sonido', () => {
  it('una figura es válida con cualquier terminación, si empieza con la letra de palo', () => {
    const carta: Carta = { palo: 'palos', valor: 'K' };
    // "Pozo" no tiene ningún sonido "reservado" que cumplir — solo debe empezar con P
    expect(validarPalabraNaipe('Pozo', carta).valida).toBe(true);
  });

  it('una figura rechaza si empieza con la letra de palo equivocada', () => {
    const carta: Carta = { palo: 'palos', valor: 'K' };
    const resultado = validarPalabraNaipe('Kilo', carta);
    expect(resultado.valida).toBe(false);
    expect(resultado.motivo).toBeTruthy();
  });

  it('nunca aplica una restricción de sonido a una figura, aunque la palabra termine en cualquier cosa', () => {
    const carta: Carta = { palo: 'diamantes', valor: 'Q' };
    // "Domo" termina en sonido 3 (M) — irrelevante para una figura, debe validar igual
    expect(validarPalabraNaipe('Domo', carta).valida).toBe(true);
  });
});

describe('validarPalabraNaipe — casos base', () => {
  it('rechaza cadena vacía', () => {
    expect(validarPalabraNaipe('', { palo: 'espadas', valor: 'A' }).valida).toBe(false);
  });

  it('rechaza si no queda nada después del marcador', () => {
    const resultado = validarPalabraNaipe('D', { palo: 'diamantes', valor: 'A' });
    expect(resultado.valida).toBe(false);
  });

  it('REGRESIÓN: una palabra cuya letra de palo lleva tilde (É) se reconoce igual que sin tilde', () => {
    // "Éxito" para A de Espadas: é→e (marcador), x sin valor, t(1). Bug real
    // encontrado ayudando al operador — el chequeo de marcador comparaba
    // contra el carácter con tilde literal en vez de normalizar primero.
    const resultado = validarPalabraNaipe('Éxito', { palo: 'espadas', valor: 'A' });
    expect(resultado.valida).toBe(true);
    expect(resultado.advertencias).toEqual([]);
  });
});

describe('cartaDesdePalabra — contrato 5: inversa de validarPalabraNaipe', () => {
  it('decodifica una palabra numérica válida a su carta', () => {
    expect(cartaDesdePalabra('Dato', new Map())).toEqual({ palo: 'diamantes', valor: 'A' });
    expect(cartaDesdePalabra('Pipa', new Map())).toEqual({ palo: 'palos', valor: '9' });
    expect(cartaDesdePalabra('Ero', new Map())).toEqual({ palo: 'espadas', valor: '10' });
  });

  it('devuelve null para una palabra que no decodifica a ninguna carta válida', () => {
    expect(cartaDesdePalabra('Xilofono', new Map())).toBeNull();
  });

  it('devuelve null para Corazones ambiguo (empieza por "ch")', () => {
    expect(cartaDesdePalabra('Chapa', new Map())).toBeNull();
  });

  it('para una figura, busca en el mapa de palabras asignadas (no hay nada que decodificar)', () => {
    const carta: Carta = { palo: 'palos', valor: 'K' };
    const asignadas = new Map<string, Carta>([['pozo', carta]]);
    expect(cartaDesdePalabra('Pozo', asignadas)).toEqual(carta);
  });

  it('un remanente sin ningún sonido consonante (todo vocales) devuelve null', () => {
    // "Paeoa": p(marcador) + "aeoa" — todo vocal, ningún dígito que decodificar.
    expect(cartaDesdePalabra('Paeoa', new Map())).toBeNull();
  });

  it(
    'LIMITACIÓN CONOCIDA: una palabra de figura que no está en el mapa, si además ' +
      'decodifica foneticamente a un valor numérico válido, se reporta como esa carta ' +
      'numérica — no hay forma de distinguir "pensada como figura" de "coincide con un ' +
      'número" sin la tabla de asignación (ADR-017: las figuras no tienen firma fonética)',
    () => {
      const carta: Carta = { palo: 'palos', valor: '6' };
      expect(cartaDesdePalabra('Pozo', new Map())).toEqual(carta);
    }
  );
});

describe('explicarNaipe — cadena fonética del reverso (Fase 8, ADR-026)', () => {
  it('para una carta numérica válida, retorna el desglose fonético del resto tras el marcador de palo', () => {
    // "Dato" (contrato 1 de validarPalabraNaipe arriba): d(marcador) + a(ignorada) + t(1=As) + o(ignorada)
    const carta: Carta = { palo: 'diamantes', valor: 'A' };
    expect(explicarNaipe(carta, 'Dato')).toBe('d + t(1) → 1');
  });

  it('para otra carta numérica válida (marcador vocal), retorna el desglose del resto', () => {
    // "Efe" (contrato 1 arriba): e(marcador, vocal) + f(7) + e(ignorada)
    const carta: Carta = { palo: 'espadas', valor: '7' };
    expect(explicarNaipe(carta, 'Efe')).toBe('e + f(7) → 7');
  });

  it('para una figura (J/Q/K), retorna null — no hay nada que decodificar (ADR-017)', () => {
    const carta: Carta = { palo: 'diamantes', valor: 'K' };
    expect(explicarNaipe(carta, 'Domingo')).toBeNull();
  });

  it('si no queda nada tras el marcador, retorna null', () => {
    const carta: Carta = { palo: 'espadas', valor: 'A' };
    expect(explicarNaipe(carta, 'E')).toBeNull();
  });

  it('defensivo: si la palabra no empieza con el marcador esperado, retorna null', () => {
    const carta: Carta = { palo: 'diamantes', valor: 'A' };
    expect(explicarNaipe(carta, 'Tato')).toBeNull();
  });
});
