import { calcularEslabones, diffEslabones, type ObjetoLista } from './eslabones';

function objeto(id: string, posicion: number, texto: string): ObjetoLista {
  return { id, posicion, texto };
}

describe('calcularEslabones — N objetos produce N-1 eslabones', () => {
  it('4 objetos → 3 eslabones consecutivos', () => {
    const objetos = [
      objeto('a', 0, 'martillo'),
      objeto('b', 1, 'elefante'),
      objeto('c', 2, 'semáforo'),
      objeto('d', 3, 'guitarra'),
    ];

    const eslabones = calcularEslabones(objetos);

    expect(eslabones).toHaveLength(3);
    expect(eslabones.map((e) => `${e.textoA}→${e.textoB}`)).toEqual([
      'martillo→elefante',
      'elefante→semáforo',
      'semáforo→guitarra',
    ]);
  });

  it('2 objetos → 1 eslabón', () => {
    const objetos = [objeto('a', 0, 'uno'), objeto('b', 1, 'dos')];
    expect(calcularEslabones(objetos)).toHaveLength(1);
  });

  it('1 objeto → 0 eslabones (no hay par que formar)', () => {
    expect(calcularEslabones([objeto('a', 0, 'solo')])).toEqual([]);
  });

  it('0 objetos → 0 eslabones', () => {
    expect(calcularEslabones([])).toEqual([]);
  });

  it('ordena por posición, no por el orden del array de entrada', () => {
    const objetos = [objeto('b', 1, 'segundo'), objeto('a', 0, 'primero'), objeto('c', 2, 'tercero')];
    const eslabones = calcularEslabones(objetos);
    expect(eslabones.map((e) => `${e.textoA}→${e.textoB}`)).toEqual(['primero→segundo', 'segundo→tercero']);
  });
});

describe('diffEslabones — insertar en medio archiva 1, crea 2, conserva el resto', () => {
  it('insertar un objeto entre B y C rompe B-C y crea B-X, X-C; A-B queda sin cambios', () => {
    const anteriores = [objeto('a', 0, 'martillo'), objeto('b', 1, 'elefante'), objeto('c', 2, 'semáforo')];
    // Se inserta 'x' entre b y c
    const nuevos = [
      objeto('a', 0, 'martillo'),
      objeto('b', 1, 'elefante'),
      objeto('x', 2, 'ventana'),
      objeto('c', 3, 'semáforo'),
    ];

    const diff = diffEslabones(anteriores, nuevos);

    expect(diff.aArchivar).toHaveLength(1);
    expect(diff.aArchivar[0]).toMatchObject({ idObjetoA: 'b', idObjetoB: 'c' });

    expect(diff.aCrear).toHaveLength(2);
    expect(diff.aCrear.map((e) => `${e.idObjetoA}-${e.idObjetoB}`)).toEqual(['b-x', 'x-c']);

    expect(diff.sinCambios).toHaveLength(1);
    expect(diff.sinCambios[0]).toMatchObject({ idObjetoA: 'a', idObjetoB: 'b' });
  });

  it('un eslabón cuyo contenido no cambió pero se desplazó de posición NO se archiva (identidad por id, no por posición)', () => {
    // c-d estaba en posición 2 (old), pasa a posición 3 (new) por la inserción de x,
    // pero sigue siendo el mismo par c→d — no debe archivarse ni recrearse.
    const anteriores = [
      objeto('a', 0, 'uno'),
      objeto('b', 1, 'dos'),
      objeto('c', 2, 'tres'),
      objeto('d', 3, 'cuatro'),
    ];
    const nuevos = [
      objeto('a', 0, 'uno'),
      objeto('x', 1, 'nuevo'),
      objeto('b', 2, 'dos'),
      objeto('c', 3, 'tres'),
      objeto('d', 4, 'cuatro'),
    ];

    const diff = diffEslabones(anteriores, nuevos);

    const clavesSinCambios = diff.sinCambios.map((e) => `${e.idObjetoA}-${e.idObjetoB}`);
    expect(clavesSinCambios).toContain('c-d');
    expect(diff.aArchivar.map((e) => `${e.idObjetoA}-${e.idObjetoB}`)).not.toContain('c-d');
  });

  it('eliminar el último objeto archiva su eslabón de entrada, sin crear ninguno', () => {
    const anteriores = [objeto('a', 0, 'uno'), objeto('b', 1, 'dos'), objeto('c', 2, 'tres')];
    const nuevos = [objeto('a', 0, 'uno'), objeto('b', 1, 'dos')];

    const diff = diffEslabones(anteriores, nuevos);

    expect(diff.aArchivar).toHaveLength(1);
    expect(diff.aArchivar[0]).toMatchObject({ idObjetoA: 'b', idObjetoB: 'c' });
    expect(diff.aCrear).toEqual([]);
  });

  it('sin cambios en la lista, el diff no archiva ni crea nada', () => {
    const objetos = [objeto('a', 0, 'uno'), objeto('b', 1, 'dos'), objeto('c', 2, 'tres')];
    const diff = diffEslabones(objetos, objetos);
    expect(diff.aArchivar).toEqual([]);
    expect(diff.aCrear).toEqual([]);
    expect(diff.sinCambios).toHaveLength(2);
  });
});
