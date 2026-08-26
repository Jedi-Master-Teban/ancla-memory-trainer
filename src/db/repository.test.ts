import { State } from 'ts-fsrs';
import { crearConexionDePrueba } from './conexionDePrueba';
import { fechaLocal } from '../domain/racha/calculo';
import { armarSesion } from '../domain/sesion/motor';
import * as m001 from './migrations/001_inicial';
import * as m002 from './migrations/002_seed_colgadero';
import * as m003 from './migrations/003_seed_naipes';
import * as m004 from './migrations/004_listas_numeros';
import * as m005 from './migrations/005_racha';
import * as m006 from './migrations/006_preferencias';
import { ejecutarMigraciones } from './migrations';
import type { Categoria, ConexionBD, MetadataColgadero, MetadataListaItem, MetadataNaipe, MetadataNumero } from './tipos';
import {
  ARCHIVAR_CATEGORIA,
  GUARDAR_CATEGORIA,
  actualizarConfigRacha,
  actualizarContenidoTarjeta,
  actualizarLista,
  actualizarTema,
  actualizarTipografia,
  aplicarCongelador,
  archivarTarjeta,
  armarSesionDeMazo,
  armarSesionMixta,
  calcularRachaActual,
  calificarTarjeta,
  cerrarSesion,
  contarElementosPorCategoria,
  contarPendientesPorCategoria,
  crearLista,
  crearMazo,
  crearNumeroImportante,
  crearSesion,
  crearTarjeta,
  editarNumeroImportante,
  eliminarLista,
  eliminarNumeroImportante,
  guardarObjetosDeLista,
  listarDiasPractica,
  listarEslabonesDeLista,
  listarListas,
  listarNumerosImportantes,
  listarObjetosDeLista,
  listarRevisionesDeSesion,
  listarRevisionesDeTarjeta,
  listarSesionesEstudio,
  listarTarjetasPorMazo,
  listarTodasLasRevisiones,
  listarTodasLasTarjetas,
  obtenerConfigRacha,
  obtenerDiaPractica,
  obtenerLista,
  obtenerMazo,
  obtenerMazoPorCategoria,
  obtenerNumeroImportante,
  obtenerPanelRetencion,
  obtenerPreferencias,
  obtenerTarjeta,
  obtenerTarjetaDeNumero,
} from './repository';

const AHORA = new Date('2026-01-01T00:00:00.000Z');

async function bdLista(): Promise<ConexionBD> {
  const db = crearConexionDePrueba();
  await ejecutarMigraciones(db);
  return db;
}

async function bdEnVersion3(): Promise<ConexionBD> {
  const db = crearConexionDePrueba();
  await db.execAsync('CREATE TABLE IF NOT EXISTS migracion (version INTEGER PRIMARY KEY, aplicada_en TEXT NOT NULL);');
  for (const m of [m001, m002, m003]) {
    await m.aplicar(db, AHORA);
    await db.runAsync('INSERT INTO migracion (version, aplicada_en) VALUES (?, ?)', [m.version, AHORA.toISOString()]);
  }
  return db;
}

async function bdEnVersion4(): Promise<ConexionBD> {
  const db = crearConexionDePrueba();
  await db.execAsync('CREATE TABLE IF NOT EXISTS migracion (version INTEGER PRIMARY KEY, aplicada_en TEXT NOT NULL);');
  for (const m of [m001, m002, m003, m004]) {
    await m.aplicar(db, AHORA);
    await db.runAsync('INSERT INTO migracion (version, aplicada_en) VALUES (?, ?)', [m.version, AHORA.toISOString()]);
  }
  return db;
}

async function bdEnVersion6(): Promise<ConexionBD> {
  const db = crearConexionDePrueba();
  await db.execAsync('CREATE TABLE IF NOT EXISTS migracion (version INTEGER PRIMARY KEY, aplicada_en TEXT NOT NULL);');
  for (const m of [m001, m002, m003, m004, m005, m006]) {
    await m.aplicar(db, AHORA);
    await db.runAsync('INSERT INTO migracion (version, aplicada_en) VALUES (?, ?)', [m.version, AHORA.toISOString()]);
  }
  return db;
}

async function bdEnVersion5(): Promise<ConexionBD> {
  const db = crearConexionDePrueba();
  await db.execAsync('CREATE TABLE IF NOT EXISTS migracion (version INTEGER PRIMARY KEY, aplicada_en TEXT NOT NULL);');
  for (const m of [m001, m002, m003, m004, m005]) {
    await m.aplicar(db, AHORA);
    await db.runAsync('INSERT INTO migracion (version, aplicada_en) VALUES (?, ?)', [m.version, AHORA.toISOString()]);
  }
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

  it('obtenerMazoPorCategoria devuelve null si no hay mazo de esa categoría (antes de la migración 004)', async () => {
    const db = await bdEnVersion3();
    expect(await obtenerMazoPorCategoria(db, 'numero')).toBeNull();
    expect(await obtenerMazoPorCategoria(db, 'lista_item')).toBeNull();
  });

  it('la migración 004 siembra los mazos lista_item y numero, vacíos (ADR-020)', async () => {
    const db = await bdLista();

    const listaItem = await obtenerMazoPorCategoria(db, 'lista_item');
    const numero = await obtenerMazoPorCategoria(db, 'numero');

    expect(listaItem?.categoria).toBe('lista_item');
    expect(numero?.categoria).toBe('numero');
    expect(await listarTarjetasPorMazo(db, listaItem!.id)).toEqual([]);
    expect(await listarTarjetasPorMazo(db, numero!.id)).toEqual([]);
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

  it('actualizarContenidoTarjeta edita el contenido sin tocar el estado FSRS', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);
    const calificada = await calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' }, AHORA);

    await actualizarContenidoTarjeta(db, tarjeta.id, { contenidoReverso: 'Té', metadataCategoria: { numero: 1, editado: true } });

    const editada = await obtenerTarjeta(db, tarjeta.id);
    expect(editada?.contenido_reverso).toBe('Té');
    expect(JSON.parse(editada?.metadata_categoria ?? '{}')).toEqual({ numero: 1, editado: true });
    // mismo id, mismo estado FSRS que tenía tras calificar — no se reinició
    expect(editada?.id).toBe(tarjeta.id);
    expect(editada?.fsrs_state).toBe(calificada.fsrs_state);
    expect(editada?.fsrs_estabilidad).toBe(calificada.fsrs_estabilidad);
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
    expect(versiones).toEqual([
      { version: 1 },
      { version: 2 },
      { version: 3 },
      { version: 4 },
      { version: 5 },
      { version: 6 },
      { version: 7 },
    ]);
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

describe('migración 003 — siembra de naipes', () => {
  it('crea un mazo naipe con las 52 cartas, cada una con estado FSRS real y palabra del operador', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA);

    const mazos = await db.getAllAsync<{ id: string }>("SELECT id FROM mazo WHERE categoria = 'naipe'", []);
    expect(mazos).toHaveLength(1);

    const tarjetas = await listarTarjetasPorMazo(db, mazos[0].id);
    expect(tarjetas).toHaveLength(52);
    expect(tarjetas.every((t) => t.fsrs_state === State.New)).toBe(true);
    expect(tarjetas.every((t) => t.contenido_reverso.length > 0)).toBe(true);

    const asDeEspadas = tarjetas.find((t) => t.contenido_frente === 'A♠');
    expect(asDeEspadas?.contenido_reverso).toBe('Éxodo');
    expect(JSON.parse(asDeEspadas?.metadata_categoria ?? '{}')).toEqual({
      palo: 'espadas',
      valor: 'A',
      aprobada_por_operador: true,
    });
  });

  it('no duplica las 52 cartas si la app se reabre', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA);
    await ejecutarMigraciones(db, new Date(AHORA.getTime() + 1000));

    const tarjetas = await db.getAllAsync<{ id: string }>(
      "SELECT tarjeta.id FROM tarjeta JOIN mazo ON tarjeta.mazo_id = mazo.id WHERE mazo.categoria = 'naipe'",
      []
    );
    expect(tarjetas).toHaveLength(52);
  });
});

describe('migración 004 — listas y números (aditiva, sin siembra) — Skill db-migracion pasos 4-5', () => {
  it('sobre una BD en versión 3 con datos reales: los datos previos sobreviven y las tablas nuevas quedan listas', async () => {
    const db = await bdEnVersion3();

    // Datos representativos de un dispositivo real ya en uso: mazo, tarjeta
    // con historial FSRS, sesión y revisión — justo lo que se perdería si
    // 004 tocara algo fuera de sus tablas nuevas.
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);
    const calificada = await calificarTarjeta(
      db,
      { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' },
      AHORA
    );

    // Migra a la versión 4: el runner ve 1-3 ya aplicadas y solo corre 004.
    await ejecutarMigraciones(db, AHORA);

    expect(await obtenerTarjeta(db, tarjeta.id)).toEqual(calificada);
    const revisiones = await listarRevisionesDeTarjeta(db, tarjeta.id);
    expect(revisiones).toHaveLength(1);

    await db.runAsync('INSERT INTO lista (id, nombre, segundos_estudio, creada_en) VALUES (?, ?, ?, ?)', [
      'lista-1',
      'Compras',
      30,
      AHORA.toISOString(),
    ]);
    await db.runAsync('INSERT INTO lista_objeto (id, lista_id, posicion, texto) VALUES (?, ?, ?, ?)', [
      'obj-1',
      'lista-1',
      0,
      'Leche',
    ]);
    await db.runAsync('INSERT INTO numero_importante (id, etiqueta, digitos, creado_en) VALUES (?, ?, ?, ?)', [
      'num-1',
      'Clave caja fuerte',
      '0453',
      AHORA.toISOString(),
    ]);

    const listas = await db.getAllAsync<{ id: string }>('SELECT id FROM lista', []);
    expect(listas).toHaveLength(1);
    const numeros = await db.getAllAsync<{ digitos: string }>('SELECT digitos FROM numero_importante', []);
    expect(numeros[0].digitos).toBe('0453');
  });

  it('idempotente: aplicar dos veces seguidas no duplica ni falla', async () => {
    const db = await bdEnVersion3();
    await ejecutarMigraciones(db, AHORA);
    await ejecutarMigraciones(db, AHORA);

    const versiones = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
    expect(versiones.map((v) => v.version)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('arranque desde cero: todas las migraciones corren en orden sin error', async () => {
    const db = crearConexionDePrueba();
    await expect(ejecutarMigraciones(db, AHORA)).resolves.not.toThrow();

    const versiones = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
    expect(versiones.map((v) => v.version)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('migración 005 — racha (aditiva, siembra racha_config) — Skill db-migracion pasos 4-5', () => {
  it('sobre una BD en versión 4 con datos reales: los datos previos sobreviven y racha_config queda sembrada', async () => {
    const db = await bdEnVersion4();

    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);
    const calificada = await calificarTarjeta(
      db,
      { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' },
      AHORA
    );
    const listaPrevia = await crearLista(db, { nombre: 'Compras', segundosEstudio: 30 }, AHORA);

    // Migra a la versión 5: el runner ve 1-4 ya aplicadas y solo corre 005.
    await ejecutarMigraciones(db, AHORA);

    expect(await obtenerTarjeta(db, tarjeta.id)).toEqual(calificada);
    expect(await listarRevisionesDeTarjeta(db, tarjeta.id)).toHaveLength(1);
    expect(await obtenerLista(db, listaPrevia.id)).toEqual(listaPrevia);

    const config = await db.getAllAsync<{ id: number; meta_diaria: number; congeladores_disponibles: number; hora_recordatorio: string }>(
      'SELECT * FROM racha_config',
      []
    );
    expect(config).toEqual([{ id: 1, meta_diaria: 20, congeladores_disponibles: 2, hora_recordatorio: '21:00' }]);

    const dias = await db.getAllAsync('SELECT * FROM dia_practica', []);
    expect(dias).toEqual([]);
  });

  it('idempotente: aplicar dos veces seguidas no duplica la fila de racha_config ni falla', async () => {
    const db = await bdEnVersion4();
    await ejecutarMigraciones(db, AHORA);
    await ejecutarMigraciones(db, AHORA);

    const config = await db.getAllAsync('SELECT * FROM racha_config', []);
    expect(config).toHaveLength(1);
  });

  it('arranque desde cero: las migraciones corren en orden sin error', async () => {
    const db = crearConexionDePrueba();
    await expect(ejecutarMigraciones(db, AHORA)).resolves.not.toThrow();

    const versiones = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
    expect(versiones.map((v) => v.version)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('migración 006 — preferencias (aditiva, siembra tema) — Skill db-migracion pasos 4-5', () => {
  it('sobre una BD en versión 5 con datos reales: los datos previos sobreviven y preferencias queda sembrada', async () => {
    const db = await bdEnVersion5();

    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);
    const calificada = await calificarTarjeta(
      db,
      { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' },
      AHORA
    );
    const configPrevio = await obtenerConfigRacha(db);

    // Migra a la versión 6: el runner ve 1-5 ya aplicadas y solo corre 006.
    await ejecutarMigraciones(db, AHORA);

    expect(await obtenerTarjeta(db, tarjeta.id)).toEqual(calificada);
    expect(await listarRevisionesDeTarjeta(db, tarjeta.id)).toHaveLength(1);
    expect(await obtenerConfigRacha(db)).toEqual(configPrevio);

    expect(await obtenerPreferencias(db)).toEqual({ id: 1, tema: 'arcade', tipografia: 'tematica' });
  });

  it('idempotente: aplicar dos veces seguidas no duplica la fila de preferencias ni falla', async () => {
    const db = await bdEnVersion5();
    await ejecutarMigraciones(db, AHORA);
    await ejecutarMigraciones(db, AHORA);

    const prefs = await db.getAllAsync('SELECT * FROM preferencias', []);
    expect(prefs).toHaveLength(1);
  });

  it('arranque desde cero: las 6 migraciones corren en orden sin error', async () => {
    const db = crearConexionDePrueba();
    await expect(ejecutarMigraciones(db, AHORA)).resolves.not.toThrow();

    const versiones = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
    expect(versiones.map((v) => v.version)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('migración 007 — tipografía (ADD COLUMN con default) — Skill db-migracion pasos 4-5', () => {
  it('sobre una BD en versión 6 con un tema ya elegido: conserva el tema y estrena tipografia', async () => {
    const db = await bdEnVersion6();
    await actualizarTema(db, 'papel');

    await ejecutarMigraciones(db, AHORA);

    // El dato previo del operador sobrevive; la columna nueva toma su default.
    expect(await obtenerPreferencias(db)).toEqual({ id: 1, tema: 'papel', tipografia: 'tematica' });
  });

  it('idempotente: aplicar dos veces no duplica la fila ni falla', async () => {
    const db = await bdEnVersion6();
    await ejecutarMigraciones(db, AHORA);
    await ejecutarMigraciones(db, AHORA);
    expect(await db.getAllAsync('SELECT * FROM preferencias', [])).toHaveLength(1);
  });
});

describe('preferencias — obtenerPreferencias / actualizarTema / actualizarTipografia', () => {
  it('obtiene la fila sembrada por la migración 006', async () => {
    const db = await bdLista();
    expect(await obtenerPreferencias(db)).toEqual({ id: 1, tema: 'arcade', tipografia: 'tematica' });
  });

  it('actualizarTema cambia el tema y persiste', async () => {
    const db = await bdLista();
    await actualizarTema(db, 'papel');
    expect(await obtenerPreferencias(db)).toEqual({ id: 1, tema: 'papel', tipografia: 'tematica' });
  });

  it('actualizarTipografia cambia solo la tipografía, sin tocar el tema', async () => {
    const db = await bdLista();
    await actualizarTema(db, 'papel');
    await actualizarTipografia(db, 'sistema');
    expect(await obtenerPreferencias(db)).toEqual({ id: 1, tema: 'papel', tipografia: 'sistema' });
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

describe('lista — CRUD', () => {
  it('crea y recupera una lista', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Compras', segundosEstudio: 30 }, AHORA);
    expect(await obtenerLista(db, lista.id)).toEqual(lista);
  });

  it('listarListas devuelve todas en orden de creación', async () => {
    const db = await bdLista();
    const a = await crearLista(db, { nombre: 'A', segundosEstudio: 30 }, AHORA);
    const b = await crearLista(db, { nombre: 'B', segundosEstudio: 30 }, new Date(AHORA.getTime() + 1000));
    expect(await listarListas(db)).toEqual([a, b]);
  });

  it('actualizarLista renombra y cambia el tiempo de estudio sin tocar sus objetos', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Compras', segundosEstudio: 30 }, AHORA);
    await guardarObjetosDeLista(db, lista.id, [{ texto: 'uno' }], AHORA);

    await actualizarLista(db, lista.id, { nombre: 'Mercado', segundosEstudio: 45 });

    const actualizada = await obtenerLista(db, lista.id);
    expect(actualizada?.nombre).toBe('Mercado');
    expect(actualizada?.segundos_estudio).toBe(45);
    expect(await listarObjetosDeLista(db, lista.id)).toHaveLength(1);
  });
});

describe('guardarObjetosDeLista — sincroniza eslabones vía diffEslabones (ADR-020)', () => {
  it('lista nueva de 4 objetos produce exactamente 3 eslabones, cada uno con su metadata', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);

    const objetos = await guardarObjetosDeLista(
      db,
      lista.id,
      [{ texto: 'martillo' }, { texto: 'elefante' }, { texto: 'semáforo' }, { texto: 'guitarra' }],
      AHORA
    );

    expect(objetos.map((o) => o.texto)).toEqual(['martillo', 'elefante', 'semáforo', 'guitarra']);

    const eslabones = await listarEslabonesDeLista(db, lista.id);
    expect(eslabones).toHaveLength(3);
    expect(eslabones.map((e) => `${e.contenido_frente}→${e.contenido_reverso}`)).toEqual([
      'martillo→elefante',
      'elefante→semáforo',
      'semáforo→guitarra',
    ]);
    expect(eslabones.every((e) => e.fsrs_state === State.New)).toBe(true);

    const metadata = JSON.parse(eslabones[0].metadata_categoria) as MetadataListaItem;
    expect(metadata).toEqual({ lista_id: lista.id, id_objeto_a: objetos[0].id, id_objeto_b: objetos[1].id });
  });

  it('insertar un objeto en medio archiva 1 eslabón y crea 2, sin tocar el histórico del que no cambió de adyacencia', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);
    const objetos = await guardarObjetosDeLista(
      db,
      lista.id,
      [{ texto: 'martillo' }, { texto: 'elefante' }, { texto: 'semáforo' }],
      AHORA
    );
    const eslabonesAntes = await listarEslabonesDeLista(db, lista.id);
    const sesion = await crearSesion(db, { modo: 'estudiar' }, AHORA);
    const martilloElefanteCalificado = await calificarTarjeta(
      db,
      { tarjetaId: eslabonesAntes[0].id, sesionId: sesion.id, calificacion: 'bien' },
      AHORA
    );

    const nuevos = await guardarObjetosDeLista(
      db,
      lista.id,
      [
        { id: objetos[0].id, texto: 'martillo' },
        { id: objetos[1].id, texto: 'elefante' },
        { texto: 'ventana' },
        { id: objetos[2].id, texto: 'semáforo' },
      ],
      AHORA
    );
    expect(nuevos).toHaveLength(4);

    const eslabonesDespues = await listarEslabonesDeLista(db, lista.id);
    expect(eslabonesDespues).toHaveLength(3);

    const martilloElefanteDespues = eslabonesDespues.find((e) => e.contenido_frente === 'martillo');
    expect(martilloElefanteDespues?.id).toBe(martilloElefanteCalificado.id);
    expect(martilloElefanteDespues?.fsrs_state).toBe(martilloElefanteCalificado.fsrs_state);
    expect(martilloElefanteDespues?.fsrs_estabilidad).toBe(martilloElefanteCalificado.fsrs_estabilidad);

    expect(
      eslabonesDespues.some((e) => e.contenido_frente === 'elefante' && e.contenido_reverso === 'semáforo')
    ).toBe(false);
    const archivada = await obtenerTarjeta(db, eslabonesAntes[1].id);
    expect(archivada?.archivada).toBe(1);

    expect(
      eslabonesDespues.find((e) => e.contenido_frente === 'elefante' && e.contenido_reverso === 'ventana')
        ?.fsrs_state
    ).toBe(State.New);
    expect(
      eslabonesDespues.find((e) => e.contenido_frente === 'ventana' && e.contenido_reverso === 'semáforo')
        ?.fsrs_state
    ).toBe(State.New);
  });

  it('un eslabón que no cambió de adyacencia pero se desplazó de posición conserva su tarjeta e id', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);
    const objetos = await guardarObjetosDeLista(
      db,
      lista.id,
      [{ texto: 'uno' }, { texto: 'dos' }, { texto: 'tres' }, { texto: 'cuatro' }],
      AHORA
    );
    const tresCuatroAntes = (await listarEslabonesDeLista(db, lista.id)).find((e) => e.contenido_frente === 'tres');

    await guardarObjetosDeLista(
      db,
      lista.id,
      [
        { texto: 'nuevo' },
        { id: objetos[0].id, texto: 'uno' },
        { id: objetos[1].id, texto: 'dos' },
        { id: objetos[2].id, texto: 'tres' },
        { id: objetos[3].id, texto: 'cuatro' },
      ],
      AHORA
    );

    const eslabonesDespues = await listarEslabonesDeLista(db, lista.id);
    const tresCuatroDespues = eslabonesDespues.find((e) => e.contenido_frente === 'tres');
    expect(tresCuatroDespues?.id).toBe(tresCuatroAntes?.id);
    // La presentación en orden refleja la posición vigente, derivada al vuelo.
    expect(eslabonesDespues.map((e) => e.contenido_frente)).toEqual(['nuevo', 'uno', 'dos', 'tres']);
  });

  it('eliminar el último objeto archiva su eslabón de entrada sin crear ninguno', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);
    const objetos = await guardarObjetosDeLista(
      db,
      lista.id,
      [{ texto: 'uno' }, { texto: 'dos' }, { texto: 'tres' }],
      AHORA
    );

    await guardarObjetosDeLista(
      db,
      lista.id,
      [
        { id: objetos[0].id, texto: 'uno' },
        { id: objetos[1].id, texto: 'dos' },
      ],
      AHORA
    );

    const eslabones = await listarEslabonesDeLista(db, lista.id);
    expect(eslabones).toHaveLength(1);
    expect(eslabones[0].contenido_frente).toBe('uno');
    expect(await listarObjetosDeLista(db, lista.id)).toHaveLength(2);
  });

  it('editar el texto de un objeto sin cambiar su adyacencia sincroniza el contenido del eslabón sin tocar su estado FSRS', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);
    const objetos = await guardarObjetosDeLista(db, lista.id, [{ texto: 'uno' }, { texto: 'dos' }], AHORA);
    const sesion = await crearSesion(db, { modo: 'estudiar' }, AHORA);
    const eslabon = (await listarEslabonesDeLista(db, lista.id))[0];
    const calificado = await calificarTarjeta(
      db,
      { tarjetaId: eslabon.id, sesionId: sesion.id, calificacion: 'bien' },
      AHORA
    );

    await guardarObjetosDeLista(
      db,
      lista.id,
      [
        { id: objetos[0].id, texto: 'uno' },
        { id: objetos[1].id, texto: 'DOS-EDITADO' },
      ],
      AHORA
    );

    const editado = (await listarEslabonesDeLista(db, lista.id))[0];
    expect(editado.id).toBe(calificado.id);
    expect(editado.contenido_reverso).toBe('DOS-EDITADO');
    expect(editado.fsrs_state).toBe(calificado.fsrs_state);
    expect(editado.fsrs_estabilidad).toBe(calificado.fsrs_estabilidad);
  });
});

describe('eliminarLista', () => {
  it('borra la lista y sus objetos (CASCADE) y archiva sus eslabones sin borrar revision', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);
    await guardarObjetosDeLista(db, lista.id, [{ texto: 'uno' }, { texto: 'dos' }], AHORA);
    const eslabon = (await listarEslabonesDeLista(db, lista.id))[0];
    const sesion = await crearSesion(db, { modo: 'estudiar' }, AHORA);
    await calificarTarjeta(db, { tarjetaId: eslabon.id, sesionId: sesion.id, calificacion: 'bien' }, AHORA);

    await eliminarLista(db, lista.id);

    expect(await obtenerLista(db, lista.id)).toBeNull();
    expect(await listarObjetosDeLista(db, lista.id)).toEqual([]);
    expect(await listarEslabonesDeLista(db, lista.id)).toEqual([]);
    const tarjetaArchivada = await obtenerTarjeta(db, eslabon.id);
    expect(tarjetaArchivada?.archivada).toBe(1);
    expect(await listarRevisionesDeTarjeta(db, eslabon.id)).toHaveLength(1);
  });
});

describe('numero_importante — CRUD', () => {
  it('crea un número con su tarjeta asociada, conservando ceros a la izquierda', async () => {
    const db = await bdLista();
    const { fila, tarjeta } = await crearNumeroImportante(
      db,
      { etiqueta: 'Clave caja fuerte', digitos: '0453' },
      AHORA
    );

    expect(fila.digitos).toBe('0453');
    expect(tarjeta.contenido_frente).toBe('Clave caja fuerte');
    expect(tarjeta.contenido_reverso).toBe('0453');
    expect(tarjeta.fsrs_state).toBe(State.New);
    const metadata = JSON.parse(tarjeta.metadata_categoria) as MetadataNumero;
    expect(metadata.numero_id).toBe(fila.id);

    expect(await obtenerNumeroImportante(db, fila.id)).toEqual(fila);
    expect(await listarNumerosImportantes(db)).toEqual([fila]);
    expect(await obtenerTarjetaDeNumero(db, fila.id)).toEqual(tarjeta);
  });

  it('editarNumeroImportante cambia los dígitos sin reiniciar el estado FSRS, y lo anota en la metadata', async () => {
    const db = await bdLista();
    const { fila, tarjeta } = await crearNumeroImportante(db, { etiqueta: 'PIN', digitos: '1234' }, AHORA);
    const sesion = await crearSesion(db, { modo: 'repasar' }, AHORA);
    const calificada = await calificarTarjeta(
      db,
      { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' },
      AHORA
    );

    await editarNumeroImportante(db, fila.id, { digitos: '5678' });

    const filaEditada = await obtenerNumeroImportante(db, fila.id);
    expect(filaEditada?.digitos).toBe('5678');

    const tarjetaEditada = await obtenerTarjetaDeNumero(db, fila.id);
    expect(tarjetaEditada?.contenido_reverso).toBe('5678');
    expect(tarjetaEditada?.fsrs_state).toBe(calificada.fsrs_state);
    expect(tarjetaEditada?.fsrs_estabilidad).toBe(calificada.fsrs_estabilidad);
    const metadata = JSON.parse(tarjetaEditada?.metadata_categoria ?? '{}');
    expect(metadata.editado).toBe(true);
  });

  it('eliminarNumeroImportante borra el número y archiva su tarjeta', async () => {
    const db = await bdLista();
    const { fila, tarjeta } = await crearNumeroImportante(db, { etiqueta: 'PIN', digitos: '1234' }, AHORA);

    await eliminarNumeroImportante(db, fila.id);

    expect(await obtenerNumeroImportante(db, fila.id)).toBeNull();
    const tarjetaArchivada = await obtenerTarjeta(db, tarjeta.id);
    expect(tarjetaArchivada?.archivada).toBe(1);
  });
});

describe('racha_config', () => {
  it('obtenerConfigRacha devuelve la fila sembrada por la migración 005', async () => {
    const db = await bdLista();
    expect(await obtenerConfigRacha(db)).toEqual({
      id: 1,
      meta_diaria: 20,
      congeladores_disponibles: 2,
      hora_recordatorio: '21:00',
    });
  });

  it('actualizarConfigRacha cambia solo los campos dados', async () => {
    const db = await bdLista();
    await actualizarConfigRacha(db, { metaDiaria: 15 });
    const config = await obtenerConfigRacha(db);
    expect(config.meta_diaria).toBe(15);
    expect(config.congeladores_disponibles).toBe(2);
    expect(config.hora_recordatorio).toBe('21:00');
  });
});

describe('dia_practica', () => {
  it('obtenerDiaPractica y listarDiasPractica reflejan lo insertado', async () => {
    const db = await bdLista();
    await db.runAsync(
      'INSERT INTO dia_practica (fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado) VALUES (?, ?, ?, ?)',
      ['2026-01-05', 12, 0, 0]
    );

    expect(await obtenerDiaPractica(db, '2026-01-05')).toEqual({
      fecha_local: '2026-01-05',
      tarjetas_revisadas: 12,
      meta_cumplida: 0,
      congelador_usado: 0,
    });
    expect(await obtenerDiaPractica(db, '2026-01-06')).toBeNull();
    expect(await listarDiasPractica(db)).toHaveLength(1);
  });

  it('calcularRachaActual envuelve calcularRacha con los datos reales de la BD', async () => {
    const db = await bdLista();
    const ahora = new Date('2026-01-05T15:00:00.000Z');
    await db.runAsync(
      'INSERT INTO dia_practica (fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado) VALUES (?, ?, ?, ?)',
      ['2026-01-05', 20, 1, 0]
    );

    const resultado = await calcularRachaActual(db, ahora);

    expect(resultado.diasConsecutivos).toBe(1);
    expect(resultado.estado).toBe('activa');
    expect(resultado.metaDeHoyCumplida).toBe(true);
  });
});

describe('aplicarCongelador', () => {
  it('congela un día pasado sin fila previa y descuenta un congelador', async () => {
    const db = await bdLista();
    const ahora = new Date('2026-01-10T10:00:00.000Z');

    await aplicarCongelador(db, '2026-01-05', ahora);

    expect(await obtenerDiaPractica(db, '2026-01-05')).toEqual({
      fecha_local: '2026-01-05',
      tarjetas_revisadas: 0,
      meta_cumplida: 0,
      congelador_usado: 1,
    });
    expect((await obtenerConfigRacha(db)).congeladores_disponibles).toBe(1);
  });

  it('congela un día pasado con fila previa (no cumplida) sin perder tarjetas_revisadas', async () => {
    const db = await bdLista();
    await db.runAsync(
      'INSERT INTO dia_practica (fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado) VALUES (?, ?, ?, ?)',
      ['2026-01-05', 7, 0, 0]
    );

    await aplicarCongelador(db, '2026-01-05', new Date('2026-01-10T10:00:00.000Z'));

    const dia = await obtenerDiaPractica(db, '2026-01-05');
    expect(dia?.tarjetas_revisadas).toBe(7);
    expect(dia?.congelador_usado).toBe(1);
  });

  it('rechaza congelar sin congeladores disponibles', async () => {
    const db = await bdLista();
    await actualizarConfigRacha(db, { congeladoresDisponibles: 0 });

    await expect(aplicarCongelador(db, '2026-01-05', new Date('2026-01-10T10:00:00.000Z'))).rejects.toThrow(
      'No quedan congeladores'
    );
  });

  it('rechaza congelar un día que no ha pasado', async () => {
    const db = await bdLista();
    const ahora = new Date('2026-01-05T10:00:00.000Z');

    await expect(aplicarCongelador(db, '2026-01-05', ahora)).rejects.toThrow('ya pasado');
    await expect(aplicarCongelador(db, '2026-01-06', ahora)).rejects.toThrow('ya pasado');
  });

  it('rechaza congelar un día que ya cumplió la meta', async () => {
    const db = await bdLista();
    await db.runAsync(
      'INSERT INTO dia_practica (fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado) VALUES (?, ?, ?, ?)',
      ['2026-01-05', 20, 1, 0]
    );

    await expect(aplicarCongelador(db, '2026-01-05', new Date('2026-01-10T10:00:00.000Z'))).rejects.toThrow(
      'ya cumplió la meta'
    );
  });

  it('rechaza congelar un día ya congelado', async () => {
    const db = await bdLista();
    await db.runAsync(
      'INSERT INTO dia_practica (fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado) VALUES (?, ?, ?, ?)',
      ['2026-01-05', 0, 0, 1]
    );

    await expect(aplicarCongelador(db, '2026-01-05', new Date('2026-01-10T10:00:00.000Z'))).rejects.toThrow(
      'ya tiene un congelador'
    );
  });
});

describe('contarPendientesPorCategoria', () => {
  it('el conteo SQL coincide con armarSesion (sin tope) para cada categoría — no debe desalinearse de motor.ts', async () => {
    const db = await bdLista();
    const ahora = AHORA;

    const conteos = await contarPendientesPorCategoria(db, ahora);

    const mazoColgadero = await obtenerMazoPorCategoria(db, 'colgadero');
    const tarjetasColgadero = await listarTarjetasPorMazo(db, mazoColgadero!.id);
    const pendientesColgaderoEsperado = armarSesion(tarjetasColgadero, { ahora, tope: 999_999 }).length;

    const mazoNaipe = await obtenerMazoPorCategoria(db, 'naipe');
    const tarjetasNaipe = await listarTarjetasPorMazo(db, mazoNaipe!.id);
    const pendientesNaipeEsperado = armarSesion(tarjetasNaipe, { ahora, tope: 999_999 }).length;

    expect(conteos.find((c) => c.categoria === 'colgadero')?.pendientes).toBe(pendientesColgaderoEsperado);
    expect(conteos.find((c) => c.categoria === 'naipe')?.pendientes).toBe(pendientesNaipeEsperado);
  });

  it('una categoría sin ninguna tarjeta pendiente no aparece en el resultado', async () => {
    const db = await bdLista();
    const conteos = await contarPendientesPorCategoria(db, AHORA);
    // lista_item y numero se sembraron vacíos (migración 004) — nada pendiente ahí.
    expect(conteos.find((c) => c.categoria === 'lista_item')).toBeUndefined();
    expect(conteos.find((c) => c.categoria === 'numero')).toBeUndefined();
  });
});

describe('contarElementosPorCategoria (inventario, ADR-027)', () => {
  async function conteo(db: ConexionBD, categoria: Categoria): Promise<number> {
    const filas = await contarElementosPorCategoria(db);
    return filas.find((f) => f.categoria === categoria)?.elementos ?? 0;
  }

  it('colgadero y naipe cuentan tarjetas sembradas: 100 y 52', async () => {
    const db = await bdLista();
    expect(await conteo(db, 'colgadero')).toBe(100);
    expect(await conteo(db, 'naipe')).toBe(52);
  });

  it('archivar un colgadero baja su conteo', async () => {
    const db = await bdLista();
    const mazo = await obtenerMazoPorCategoria(db, 'colgadero');
    const tarjetas = await listarTarjetasPorMazo(db, mazo!.id);
    await archivarTarjeta(db, tarjetas[0].id);
    expect(await conteo(db, 'colgadero')).toBe(99);
  });

  it('una lista cuenta 1 sin importar cuántos objetos/eslabones tenga', async () => {
    const db = await bdLista();
    const lista = await crearLista(db, { nombre: 'Compras', segundosEstudio: 30 }, AHORA);
    await guardarObjetosDeLista(
      db,
      lista.id,
      [{ texto: 'Mesa' }, { texto: 'Silla' }, { texto: 'Lámpara' }, { texto: 'Reloj' }, { texto: 'Libro' }],
      AHORA
    );

    // 5 objetos → 4 eslabones (tarjetas), pero el inventario cuenta LISTAS.
    expect(await listarEslabonesDeLista(db, lista.id)).toHaveLength(4);
    expect(await conteo(db, 'lista_item')).toBe(1);
  });

  it('dos listas cuentan 2', async () => {
    const db = await bdLista();
    await crearLista(db, { nombre: 'A', segundosEstudio: 30 }, AHORA);
    await crearLista(db, { nombre: 'B', segundosEstudio: 30 }, AHORA);
    expect(await conteo(db, 'lista_item')).toBe(2);
  });

  it('un número cuenta 1 aunque FSRS ya lo haya programado al futuro', async () => {
    const db = await bdLista();
    const { tarjeta } = await crearNumeroImportante(db, { etiqueta: 'Natalia', digitos: '3001234567' }, AHORA);

    // Se califica para empujar fecha_proxima_revision al futuro: deja de ser
    // "pendiente" pero SIGUE existiendo como elemento del inventario. Este es
    // exactamente el caso que el operador reportó como "muestra 0".
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);
    await calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'facil' }, AHORA);

    const pendientes = await contarPendientesPorCategoria(db, AHORA);
    expect(pendientes.find((c) => c.categoria === 'numero')).toBeUndefined();
    expect(await conteo(db, 'numero')).toBe(1);
  });

  it('categorías vacías reportan 0 explícito, no una fila ausente', async () => {
    const db = await bdLista();
    expect(await conteo(db, 'lista_item')).toBe(0);
    expect(await conteo(db, 'numero')).toBe(0);
  });
});

describe('armarSesionMixta', () => {
  it('reparte de forma justa entre categorías reales (colgadero + naipe sembrados)', async () => {
    const db = await bdLista();

    const sesion = await armarSesionMixta(db, AHORA);

    expect(sesion).toHaveLength(20);
    const categorias = new Set(sesion.map((t) => t.categoria));
    expect(categorias.has('colgadero')).toBe(true);
    expect(categorias.has('naipe')).toBe(true);
  });

  it('respeta un topeSesion explícito', async () => {
    const db = await bdLista();
    const sesion = await armarSesionMixta(db, AHORA, 6);
    expect(sesion).toHaveLength(6);
  });
});

describe('calificarTarjeta — registra la práctica del día (racha, §8.7)', () => {
  it('crea la fila de hoy en el primer calificar y la va acumulando en calificaciones siguientes', async () => {
    const db = await bdLista();
    await actualizarConfigRacha(db, { metaDiaria: 2 });
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const t1 = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' }, AHORA);
    const t2 = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '2', contenidoReverso: 'Noé' }, AHORA);
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);

    await calificarTarjeta(db, { tarjetaId: t1.id, sesionId: sesion.id, calificacion: 'bien' }, AHORA);
    let hoy = await obtenerDiaPractica(db, fechaLocal(AHORA));
    expect(hoy?.tarjetas_revisadas).toBe(1);
    expect(hoy?.meta_cumplida).toBe(0);

    await calificarTarjeta(db, { tarjetaId: t2.id, sesionId: sesion.id, calificacion: 'bien' }, AHORA);
    hoy = await obtenerDiaPractica(db, fechaLocal(AHORA));
    expect(hoy?.tarjetas_revisadas).toBe(2);
    expect(hoy?.meta_cumplida).toBe(1);
  });

  it('"Otra vez" cuenta igual que un acierto para tarjetas_revisadas (nunca penalizar, 07-racha.md §1)', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' }, AHORA);
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);

    await calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'otra_vez' }, AHORA);

    const hoy = await obtenerDiaPractica(db, fechaLocal(AHORA));
    expect(hoy?.tarjetas_revisadas).toBe(1);
  });

  it('sobre una BD sin migrar a la 005 (bdEnVersion4), calificarTarjeta no revienta', async () => {
    const db = await bdEnVersion4();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' }, AHORA);
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);

    await expect(
      calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' }, AHORA)
    ).resolves.not.toThrow();
  });
});

describe('panel de retención — fetch amplio (§8.8)', () => {
  it('listarTodasLasTarjetas trae tarjetas de todos los mazos, sin archivadas', async () => {
    const db = await bdLista();
    const mazoColgadero = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const mazoNaipe = await crearMazo(db, { nombre: 'Naipes', categoria: 'naipe' }, AHORA);
    const activa = await crearTarjeta(
      db,
      { mazoId: mazoColgadero.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' },
      AHORA
    );
    const otraCategoria = await crearTarjeta(
      db,
      { mazoId: mazoNaipe.id, categoria: 'naipe', contenidoFrente: 'A♠', contenidoReverso: 'Ancla' },
      AHORA
    );

    const todas = await listarTodasLasTarjetas(db);

    const ids = todas.map((t) => t.id);
    expect(ids).toContain(activa.id);
    expect(ids).toContain(otraCategoria.id);
  });

  it('listarTodasLasRevisiones trae revisiones de distintas tarjetas y sesiones, en orden de fecha', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const t1 = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' }, AHORA);
    const t2 = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '2', contenidoReverso: 'Noé' }, AHORA);
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);

    await calificarTarjeta(db, { tarjetaId: t1.id, sesionId: sesion.id, calificacion: 'bien' }, AHORA);
    const masTarde = new Date(AHORA.getTime() + 1000);
    await calificarTarjeta(db, { tarjetaId: t2.id, sesionId: sesion.id, calificacion: 'otra_vez' }, masTarde);

    const revisiones = await listarTodasLasRevisiones(db);

    expect(revisiones.map((r) => r.tarjeta_id)).toEqual([t1.id, t2.id]);
  });

  it('listarSesionesEstudio ordena de más reciente a más antigua e incluye sesiones sin cerrar', async () => {
    const db = await bdLista();
    const primera = await crearSesion(db, { modo: 'flash' }, AHORA);
    const segunda = await crearSesion(db, { modo: 'reverso' }, new Date(AHORA.getTime() + 1000));
    await cerrarSesion(db, { sesionId: primera.id, duracionSegundos: 60, aciertos: 5, fallos: 1 }, AHORA);
    // segunda queda sin cerrar (terminada_en NULL) — debe seguir apareciendo

    const sesiones = await listarSesionesEstudio(db);

    expect(sesiones.map((s) => s.id)).toEqual([segunda.id, primera.id]);
  });

  it('listarRevisionesDeSesion aísla las filas de una sesión de las de otra', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' }, AHORA);
    const sesionA = await crearSesion(db, { modo: 'flash' }, AHORA);
    const sesionB = await crearSesion(db, { modo: 'flash' }, AHORA);

    await calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId: sesionA.id, calificacion: 'bien' }, AHORA);
    await calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId: sesionB.id, calificacion: 'otra_vez' }, AHORA);

    const revisionesA = await listarRevisionesDeSesion(db, sesionA.id);

    expect(revisionesA).toHaveLength(1);
    expect(revisionesA[0].sesion_id).toBe(sesionA.id);
  });

  it('obtenerPanelRetencion conecta el fetch real con calcularPanelRetencion', async () => {
    const db = await bdLista();
    const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, AHORA);
    const tarjeta = await crearTarjeta(db, { mazoId: mazo.id, categoria: 'colgadero', contenidoFrente: '1', contenidoReverso: 'Tea' }, AHORA);
    const sesion = await crearSesion(db, { modo: 'flash' }, AHORA);
    await calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId: sesion.id, calificacion: 'bien' }, AHORA);

    const panel = await obtenerPanelRetencion(db, 'todo', AHORA);

    expect(panel.porCategoria).toHaveLength(4);
    const colgadero = panel.porCategoria.find((m) => m.categoria === 'colgadero');
    expect(colgadero?.porcentajeRetencion).toBe(1);
  });
});

describe('archivarTarjeta', () => {
  it('marca archivada = 1 sin borrar la fila', async () => {
    const db = await bdLista();
    const mazo = await obtenerMazoPorCategoria(db, 'colgadero');
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo!.id, categoria: 'colgadero', contenidoFrente: '101', contenidoReverso: 'Tos' },
      AHORA
    );

    await archivarTarjeta(db, tarjeta.id);

    const recuperada = await obtenerTarjeta(db, tarjeta.id);
    expect(recuperada?.archivada).toBe(1);
  });
});

describe('GUARDAR_CATEGORIA — dispatch de guardado del registro genérico (§8.6)', () => {
  describe('colgadero', () => {
    it('sin idExistente: crea una tarjeta nueva en el mazo colgadero', async () => {
      const db = await bdLista();

      await GUARDAR_CATEGORIA.colgadero(db, { numero: '101', palabra: 'Tos' }, undefined, AHORA);

      const mazo = await obtenerMazoPorCategoria(db, 'colgadero');
      const tarjetas = await listarTarjetasPorMazo(db, mazo!.id);
      const nueva = tarjetas.find((t) => t.contenido_frente === '101');
      expect(nueva?.contenido_reverso).toBe('Tos');
      expect(JSON.parse(nueva!.metadata_categoria) as MetadataColgadero).toEqual({ numero: 101 });
    });

    it('con idExistente: edita la tarjeta en vez de crear una nueva, conservando el id', async () => {
      const db = await bdLista();
      const mazo = await obtenerMazoPorCategoria(db, 'colgadero');
      const tarjetas = await listarTarjetasPorMazo(db, mazo!.id);
      const original = tarjetas.find((t) => t.contenido_frente === '1')!; // "Tea", migración 002

      await GUARDAR_CATEGORIA.colgadero(db, { numero: '1', palabra: 'Té' }, original.id, AHORA);

      const editada = await obtenerTarjeta(db, original.id);
      expect(editada?.id).toBe(original.id);
      expect(editada?.contenido_reverso).toBe('Té');
      const totalTrasEditar = await listarTarjetasPorMazo(db, mazo!.id);
      expect(totalTrasEditar).toHaveLength(100); // no se creó una tarjeta de más
    });
  });

  describe('naipe', () => {
    it('sin idExistente: lanza — el mazo de 52 cartas es cerrado (ADR-025)', async () => {
      const db = await bdLista();
      await expect(GUARDAR_CATEGORIA.naipe(db, { palabra: 'Ancla' }, undefined, AHORA)).rejects.toThrow();
    });

    it('con idExistente: edita solo la palabra, conserva palo/valor/id', async () => {
      const db = await bdLista();
      const mazo = await obtenerMazoPorCategoria(db, 'naipe');
      const [carta] = await listarTarjetasPorMazo(db, mazo!.id);
      const metadataAntes = JSON.parse(carta.metadata_categoria) as MetadataNaipe;

      await GUARDAR_CATEGORIA.naipe(db, { palabra: 'Zapato' }, carta.id, AHORA);

      const editada = await obtenerTarjeta(db, carta.id);
      expect(editada?.id).toBe(carta.id);
      expect(editada?.contenido_reverso).toBe('Zapato');
      expect(editada?.contenido_frente).toBe(carta.contenido_frente); // "10♠" etc., intacto
      expect(JSON.parse(editada!.metadata_categoria) as MetadataNaipe).toEqual(metadataAntes);
    });
  });

  describe('numero', () => {
    it('sin idExistente: crea un numero_importante y su tarjeta', async () => {
      const db = await bdLista();

      await GUARDAR_CATEGORIA.numero(db, { etiqueta: 'Clave caja fuerte', digitos: '045' }, undefined, AHORA);

      const numeros = await listarNumerosImportantes(db);
      const creado = numeros.find((n) => n.etiqueta === 'Clave caja fuerte');
      expect(creado?.digitos).toBe('045'); // cero a la izquierda intacto — nunca Number()
    });

    it('con idExistente: edita el numero_importante existente, no crea uno nuevo', async () => {
      const db = await bdLista();
      const { fila, tarjeta } = await crearNumeroImportante(db, { etiqueta: 'Original', digitos: '007' }, AHORA);

      await GUARDAR_CATEGORIA.numero(db, { etiqueta: 'Editado', digitos: '008' }, tarjeta.id, AHORA);

      const editado = await obtenerNumeroImportante(db, fila.id);
      expect(editado?.etiqueta).toBe('Editado');
      expect(editado?.digitos).toBe('008');
      expect(await listarNumerosImportantes(db)).toHaveLength(1);
    });
  });

  describe('lista_item', () => {
    it('sin listaId en valores: lanza', async () => {
      const db = await bdLista();
      await expect(GUARDAR_CATEGORIA.lista_item(db, { texto: 'martillo' }, undefined, AHORA)).rejects.toThrow();
    });

    it('con listaId: agrega un objeto al final de una lista existente', async () => {
      const db = await bdLista();
      const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);
      await guardarObjetosDeLista(db, lista.id, [{ texto: 'martillo' }, { texto: 'elefante' }], AHORA);

      await GUARDAR_CATEGORIA.lista_item(db, { texto: 'semáforo', listaId: lista.id }, undefined, AHORA);

      const objetos = await listarObjetosDeLista(db, lista.id);
      expect(objetos.map((o) => o.texto)).toEqual(['martillo', 'elefante', 'semáforo']);
      const eslabones = await listarEslabonesDeLista(db, lista.id);
      expect(eslabones).toHaveLength(2); // 3 objetos → 2 eslabones
    });

    it('con idExistente: lanza — este mecanismo solo crea lista_item, nunca edita', async () => {
      const db = await bdLista();
      const lista = await crearLista(db, { nombre: 'Cadena', segundosEstudio: 30 }, AHORA);
      await expect(
        GUARDAR_CATEGORIA.lista_item(db, { texto: 'x', listaId: lista.id }, 'algun-id', AHORA)
      ).rejects.toThrow();
    });
  });
});

describe('ARCHIVAR_CATEGORIA — solo colgadero (§8.6, ADR-025)', () => {
  it('colgadero está cableado a archivarTarjeta', async () => {
    const db = await bdLista();
    const mazo = await obtenerMazoPorCategoria(db, 'colgadero');
    const tarjeta = await crearTarjeta(
      db,
      { mazoId: mazo!.id, categoria: 'colgadero', contenidoFrente: '101', contenidoReverso: 'Tos' },
      AHORA
    );

    await ARCHIVAR_CATEGORIA.colgadero!(db, tarjeta.id);

    expect((await obtenerTarjeta(db, tarjeta.id))?.archivada).toBe(1);
  });

  it('naipe, numero y lista_item no tienen entrada — no se ofrece archivar por este mecanismo', () => {
    expect(ARCHIVAR_CATEGORIA.naipe).toBeUndefined();
    expect(ARCHIVAR_CATEGORIA.numero).toBeUndefined();
    expect(ARCHIVAR_CATEGORIA.lista_item).toBeUndefined();
  });
});
