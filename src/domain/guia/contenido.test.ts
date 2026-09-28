import { aNumero } from '../fonetica/decodificador';
import {
  CAPITULOS,
  ESCENARIOS_CALIFICAR,
  FUENTES,
  LISTA_DE_PRACTICA,
  TABLA_FONETICA,
  capituloPorId,
  opcionesDeRecuerdo,
  siguienteCapitulo,
} from './contenido';

// La guía enseña las reglas de Ancla. Si un ejemplo del texto no coincide con
// lo que hace el decodificador de la app, la guía estaría enseñando otra cosa:
// estas pruebas lo impiden.
describe('contenido de la guía', () => {
  it('cada fila de la tabla fonética: su palabra de ejemplo decodifica a su dígito', () => {
    expect(TABLA_FONETICA.map((f) => f.digito)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    for (const fila of TABLA_FONETICA) {
      expect([fila.ejemplo, aNumero(fila.ejemplo)]).toEqual([fila.ejemplo, fila.digito]);
    }
  });

  it('los ejemplos resueltos en el texto dan el número que dice el texto', () => {
    const ejemplos: [string, number][] = [
      ['Techo', 18],
      ['Cheque', 84],
      ['Mufa', 37],
      ['Mito', 31],
      ['Codo', 41],
      ['Hucha', 8],
      ['Dúo', 1],
    ];
    for (const [palabra, numero] of ejemplos) expect([palabra, aNumero(palabra)]).toEqual([palabra, numero]);
  });

  it('toda fuente citada existe, y toda fuente se cita en algún capítulo', () => {
    const citadas = new Set<string>();
    for (const c of CAPITULOS) {
      c.fuentes.forEach((f) => citadas.add(f));
      c.consejos.forEach((k) => k.fuentes.forEach((f) => citadas.add(f)));
    }
    for (const id of citadas) expect(FUENTES[id]).toBeDefined();
    expect(Object.keys(FUENTES).sort()).toEqual([...citadas].sort());
  });

  it('los consejos de investigación citan al menos una fuente', () => {
    for (const c of CAPITULOS) {
      for (const k of c.consejos.filter((x) => x.base === 'investigacion')) {
        expect([c.id, k.titulo, k.fuentes.length > 0]).toEqual([c.id, k.titulo, true]);
      }
    }
  });

  it('los capítulos tienen ids únicos y se recorren en orden', () => {
    const ids = CAPITULOS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(capituloPorId('colgadero')?.titulo).toBe('El colgadero');
    expect(capituloPorId('no-existe')).toBeUndefined();
    expect(siguienteCapitulo(ids[0])?.id).toBe(ids[1]);
    expect(siguienteCapitulo(ids[ids.length - 1])).toBeUndefined();
  });

  it('el ejercicio de calificar cubre los cuatro botones, uno por situación', () => {
    expect(ESCENARIOS_CALIFICAR.map((e) => e.correcta).sort()).toEqual(['bien', 'dificil', 'facil', 'otra_vez']);
  });
});

describe('opcionesDeRecuerdo', () => {
  const azarFijo = () => 0.42;

  it('ofrece tres opciones distintas, y una es la que sigue', () => {
    for (let i = 0; i < LISTA_DE_PRACTICA.length - 1; i++) {
      const opciones = opcionesDeRecuerdo(LISTA_DE_PRACTICA, i, azarFijo);
      expect(opciones).toHaveLength(3);
      expect(new Set(opciones).size).toBe(3);
      expect(opciones).toContain(LISTA_DE_PRACTICA[i + 1]);
    }
  });

  it('nunca ofrece el mismo elemento por el que se pregunta', () => {
    for (let i = 0; i < LISTA_DE_PRACTICA.length - 1; i++) {
      expect(opcionesDeRecuerdo(LISTA_DE_PRACTICA, i, azarFijo)).not.toContain(LISTA_DE_PRACTICA[i]);
    }
  });

  it('el orden de las opciones depende del azar, no siempre la correcta primero', () => {
    const posiciones = new Set(
      [0.01, 0.35, 0.7, 0.99].map((v) => opcionesDeRecuerdo(LISTA_DE_PRACTICA, 0, () => v).indexOf(LISTA_DE_PRACTICA[1])),
    );
    expect(posiciones.size).toBeGreaterThan(1);
  });
});
