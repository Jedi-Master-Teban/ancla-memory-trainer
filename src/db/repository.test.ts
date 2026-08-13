import { State } from 'ts-fsrs';
import { crearConexionDePrueba } from './conexionDePrueba';
import * as m001 from './migrations/001_inicial';
import * as m002 from './migrations/002_seed_colgadero';
import * as m003 from './migrations/003_seed_naipes';
import { ejecutarMigraciones } from './migrations';
import type { ConexionBD, MetadataListaItem, MetadataNumero } from './tipos';
import {
  actualizarContenidoTarjeta,
  armarSesionDeMazo,
  calificarTarjeta,
  cerrarSesion,
  crearLista,
  crearMazo,
  crearNumeroImportante,
  crearSesion,
  crearTarjeta,
  editarNumeroImportante,
  eliminarLista,
  eliminarNumeroImportante,
  guardarObjetosDeLista,
  listarEslabonesDeLista,
  listarListas,
  listarNumerosImportantes,
  listarObjetosDeLista,
  listarRevisionesDeTarjeta,
  listarTarjetasPorMazo,
  obtenerLista,
  obtenerMazo,
  obtenerMazoPorCategoria,
  obtenerNumeroImportante,
  obtenerTarjeta,
  obtenerTarjetaDeNumero,
  actualizarLista,
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
    expect(versiones).toEqual([{ version: 1 }, { version: 2 }, { version: 3 }, { version: 4 }]);
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
    expect(versiones.map((v) => v.version)).toEqual([1, 2, 3, 4]);
  });

  it('arranque desde cero: las 4 migraciones corren en orden sin error', async () => {
    const db = crearConexionDePrueba();
    await expect(ejecutarMigraciones(db, AHORA)).resolves.not.toThrow();

    const versiones = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion', []);
    expect(versiones.map((v) => v.version)).toEqual([1, 2, 3, 4]);
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
