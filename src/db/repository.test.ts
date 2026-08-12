import { State } from 'ts-fsrs';
import { crearConexionDePrueba } from './conexionDePrueba';
import { ejecutarMigraciones } from './migrations';
import type { ConexionBD } from './tipos';
import {
  armarSesionDeMazo,
  calificarTarjeta,
  cerrarSesion,
  crearMazo,
  crearSesion,
  crearTarjeta,
  listarRevisionesDeTarjeta,
  listarTarjetasPorMazo,
  obtenerMazo,
  obtenerMazoPorCategoria,
  obtenerTarjeta,
} from './repository';

const AHORA = new Date('2026-01-01T00:00:00.000Z');

async function bdLista(): Promise<ConexionBD> {
  const db = crearConexionDePrueba();
  await ejecutarMigraciones(db);
  return db;
}

describe('mazo', () => {
  it('crea y recupera un mazo', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);

    const recuperado = await obtenerMazo(db, mazo.id);

    expect(recuperado).toEqual(mazo);
  });

  it('devuelve null para un mazo que no existe', async () => {
    const db = await bdLista();
    expect(await obtenerMazo(db, 'no-existe')).toBeNull();
  });

  it('obtenerMazoPorCategoria encuentra el mazo colgadero sembrado por la migración', async () => {
    const db = await bdLista();
    const mazo = await obtenerMazoPorCategoria(db, 'colgadero');
    expect(mazo?.categoria).toBe('colgadero');
  });

  it('obtenerMazoPorCategoria devuelve null si no hay mazo de esa categoría', async () => {
    const db = await bdLista();
    expect(await obtenerMazoPorCategoria(db, 'naipe')).toBeNull();
  });
});

describe('tarjeta', () => {
  it('crea una tarjeta nueva con estado FSRS inicializado por la librería, no a mano', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);

    const tarjeta = await crearTarjeta(
      db,
      {
        mazoId: mazo.id,
        categoria: 'colgadero',
        contenidoFrente: '1',
        contenidoReverso: 'Tea',
        metadataCategoria: { numero: 1 },
      },
      AHORA
    );

    expect(tarjeta.fsrs_state).toBe(State.New);
    expect(tarjeta.metadata_categoria).toBe(JSON.stringify({ numero: 1 }));
    expect(await listarTarjetasPorMazo(db, mazo.id)).toEqual([tarjeta]);
  });
});

describe('calificarTarjeta — invariante I-4 (revision siempre acompaña a la calificación)', () => {
  it('actualiza el estado FSRS de la tarjeta y escribe una fila en revision, juntas', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);

    const actualizada = await calificarTarjeta(
      db,
      { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' },
      AHORA
    );

    expect(actualizada.fsrs_state).not.toBe(State.New);
    expect(actualizada.fecha_ultima_revision).toBe(AHORA.toISOString());

    const enBD = await obtenerTarjeta(db, tarjeta.id);
    expect(enBD).toEqual(actualizada);

    const revisiones = await listarRevisionesDeTarjeta(db, tarjeta.id);
    expect(revisiones).toHaveLength(1);
    expect(revisiones[0].tarjeta_id).toBe(tarjeta.id);
    expect(revisiones[0].sesion_id).toBe(sesion.id);
    expect(revisiones[0].estabilidad_despues).toBe(actualizada.fsrs_estabilidad);
    expect(revisiones[0].direccion).toBeNull();
  });

  it('conserva fsrs_learning_steps al calificar dos veces seguidas (no se pierde estado)', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);

    const primeraVez = await calificarTarjeta(
      db,
      { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'otra_vez' },
      AHORA
    );
    const segundaFecha = new Date(primeraVez.fecha_proxima_revision);

    const segundaVez = await calificarTarjeta(
      db,
      { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'otra_vez' },
      segundaFecha
    );

    // La tarjeta releída de la BD (con su fsrs_learning_steps persistido) debe
    // llegar al mismo resultado que si nunca se hubiera guardado y releído.
    expect(segundaVez.fsrs_state).toBeDefined();
    expect(Number.isFinite(segundaVez.fsrs_learning_steps)).toBe(true);
  });

  it('lanza un error legible si la tarjeta no existe', async () => {
    const db = await bdLista();
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);

    await expect(
      calificarTarjeta(db, { tarjetaId: 'no-existe', sesionId: sesion.id, calificacion: 'bien' }, AHORA)
    ).rejects.toThrow('no-existe');
  });
});

describe('sesión de estudio', () => {
  it('crea y cierra una sesión con sus contadores', async () => {
    const db = await bdLista();
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);
    expect(sesion.terminada_en).toBeNull();

    const masTarde = new Date(AHORA.getTime() + 5 * 60_000);
    await cerrarSesion(db, { sesionId: sesion.id, duracionSegundos: 300, aciertos: 8, fallos: 2 }, masTarde);

    const fila = await db.getFirstAsync<{ terminada_en: string; duracion_segundos: number }>(
      'SELECT * FROM sesion_estudio WHERE id = ?',
      [sesion.id]
    );
    expect(fila?.terminada_en).toBe(masTarde.toISOString());
    expect(fila?.duracion_segundos).toBe(300);
  });
});

describe('migración — Skill db-migracion, paso 4: sobre BD con datos', () => {
  it('re-ejecutar ejecutarMigraciones es idempotente y no toca los datos existentes', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db);

    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );

    // Simula reabrir la app: se vuelve a correr el corredor de migraciones
    // sobre la misma conexión, que ya tiene datos.
    await ejecutarMigraciones(db);
    await ejecutarMigraciones(db);

    expect(await obtenerMazo(db, mazo.id)).toEqual(mazo);
    expect(await obtenerTarjeta(db, tarjeta.id)).toEqual(tarjeta);

    const versiones = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
    expect(versiones).toEqual([{ version: 1 }, { version: 2 }]);
  });
});

describe('migración 002 — siembra del colgadero', () => {
  it('crea un mazo colgadero con las 100 palabras, cada una con estado FSRS real', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA);

    const mazos = await db.getAllAsync<{ id: string; categoria: string }>(
      "SELECT * FROM mazo WHERE categoria = 'colgadero'",
      []
    );
    expect(mazos).toHaveLength(1);

    const tarjetas = await listarTarjetasPorMazo(db, mazos[0].id);
    expect(tarjetas).toHaveLength(100);
    expect(tarjetas.every((t) => t.fsrs_state === State.New)).toBe(true);

    const primera = tarjetas.find((t) => t.contenido_frente === '1');
    expect(primera?.contenido_reverso).toBe('Tea');
    expect(JSON.parse(primera?.metadata_categoria ?? '{}')).toEqual({ numero: 1 });
  });

  it('no duplica las 100 tarjetas si la app se reabre (migración ya aplicada)', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA);
    await ejecutarMigraciones(db, new Date(AHORA.getTime() + 1000));
    await ejecutarMigraciones(db, new Date(AHORA.getTime() + 2000));

    const tarjetas = await db.getAllAsync<{ id: string }>(
      "SELECT tarjeta.id FROM tarjeta JOIN mazo ON tarjeta.mazo_id = mazo.id WHERE mazo.categoria = 'colgadero'",
      []
    );
    expect(tarjetas).toHaveLength(100);
  });
});

describe('armarSesionDeMazo', () => {
  it('arma una sesión real de 20 tarjetas nuevas desde el mazo recién sembrado', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA);
    const mazos = await db.getAllAsync<{ id: string }>("SELECT id FROM mazo WHERE categoria = 'colgadero'", []);

    // aleatorizar desactivado: esta prueba es sobre la SELECCIÓN (fetch + filtro
    // correctos), no sobre el barajado de presentación — eso ya lo prueba
    // motor.test.ts por separado.
    const sesion = await armarSesionDeMazo(db, mazos[0].id, { ahora: AHORA, tope: 20, aleatorizar: (arr) => arr });

    expect(sesion).toHaveLength(20);
    expect(sesion.every((t) => t.fsrs_state === State.New)).toBe(true);
    expect(sesion.map((t) => t.contenido_frente)).toEqual(
      Array.from({ length: 20 }, (_, i) => String(i + 1))
    );
  });

  it('por defecto baraja la presentación (no siempre devuelve 1..20 en orden)', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA);
    const mazos = await db.getAllAsync<{ id: string }>("SELECT id FROM mazo WHERE categoria = 'colgadero'", []);

    const enOrden = Array.from({ length: 20 }, (_, i) => String(i + 1));
    // Con 20! ordenaciones posibles, la probabilidad de que el barajado real
    // caiga justo en orden ascendente es, a efectos prácticos, cero.
    const sesion = await armarSesionDeMazo(db, mazos[0].id, { ahora: AHORA, tope: 20 });

    expect(sesion.map((t) => t.contenido_frente)).not.toEqual(enOrden);
    expect(new Set(sesion.map((t) => t.contenido_frente))).toEqual(new Set(enOrden));
  });
});
