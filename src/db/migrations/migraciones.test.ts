import { crearConexionDePrueba } from '../conexionDePrueba';
import type { ConexionBD } from '../tipos';
import { ejecutarMigraciones, MIGRACIONES, ULTIMA_VERSION, type Migracion } from './index';

const AHORA = new Date('2026-09-28T12:00:00Z');

const crearTabla = (version: number, tabla: string): Migracion => ({
  version,
  aplicar: async (db) => {
    await db.execAsync(`CREATE TABLE ${tabla} (id INTEGER PRIMARY KEY, valor TEXT);`);
  },
});

/** Crea su tabla, escribe una fila y SOLO DESPUÉS falla: el peor caso para una migración a medias. */
const fallaAMedias = (version: number): Migracion => ({
  version,
  aplicar: async (db) => {
    await db.execAsync('CREATE TABLE a_medias (id INTEGER PRIMARY KEY);');
    await db.runAsync('INSERT INTO a_medias (id) VALUES (?)', [1]);
    throw new Error('la migración se interrumpe');
  },
});

async function versiones(db: ConexionBD): Promise<number[]> {
  const filas = await db.getAllAsync<{ version: number }>('SELECT version FROM migracion ORDER BY version', []);
  return filas.map((f) => f.version);
}

async function existeTabla(db: ConexionBD, nombre: string): Promise<boolean> {
  const fila = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = ?",
    [nombre],
  );
  return (fila?.n ?? 0) > 0;
}

describe('ejecutarMigraciones', () => {
  it('una migración que falla no deja nada a medias: ni su tabla ni su registro', async () => {
    const db = crearConexionDePrueba();
    await expect(
      ejecutarMigraciones(db, AHORA, { migraciones: [crearTabla(1, 'uno'), fallaAMedias(2)] }),
    ).rejects.toThrow('la migración se interrumpe');

    expect(await versiones(db)).toEqual([1]);
    expect(await existeTabla(db, 'uno')).toBe(true);
    expect(await existeTabla(db, 'a_medias')).toBe(false);
  });

  it('antes de migrar una base que ya tenía datos, avisa con las versiones pendientes', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA, { migraciones: [crearTabla(1, 'uno')] });

    const avisos: number[][] = [];
    await ejecutarMigraciones(db, AHORA, {
      migraciones: [crearTabla(1, 'uno'), crearTabla(2, 'dos'), crearTabla(3, 'tres')],
      antesDeMigrar: async (pendientes) => {
        // En el momento del aviso todavía no se ha tocado nada: es cuando se copia la base.
        expect(await existeTabla(db, 'dos')).toBe(false);
        avisos.push(pendientes);
      },
    });

    expect(avisos).toEqual([[2, 3]]);
    expect(await versiones(db)).toEqual([1, 2, 3]);
  });

  it('una base recién creada no avisa: no hay nada que copiar', async () => {
    const db = crearConexionDePrueba();
    const antesDeMigrar = jest.fn();
    await ejecutarMigraciones(db, AHORA, { migraciones: [crearTabla(1, 'uno')], antesDeMigrar });
    expect(antesDeMigrar).not.toHaveBeenCalled();
  });

  it('sin migraciones pendientes tampoco avisa', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA, { migraciones: [crearTabla(1, 'uno')] });
    const antesDeMigrar = jest.fn();
    await ejecutarMigraciones(db, AHORA, { migraciones: [crearTabla(1, 'uno')], antesDeMigrar });
    expect(antesDeMigrar).not.toHaveBeenCalled();
  });

  // El corredor no se traga errores: si el aviso falla, no migra. Es quien avisa
  // (client.ts) el que decide si su propio fallo es fatal.
  it('si el aviso previo falla, no migra nada', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA, { migraciones: [crearTabla(1, 'uno')] });
    await expect(
      ejecutarMigraciones(db, AHORA, {
        migraciones: [crearTabla(1, 'uno'), crearTabla(2, 'dos')],
        antesDeMigrar: async () => {
          throw new Error('sin espacio para la copia');
        },
      }),
    ).rejects.toThrow('sin espacio para la copia');
    expect(await versiones(db)).toEqual([1]);
  });

  it('las migraciones reales se aplican todas y ULTIMA_VERSION es la última', async () => {
    const db = crearConexionDePrueba();
    await ejecutarMigraciones(db, AHORA);
    expect(await versiones(db)).toEqual(MIGRACIONES.map((m) => m.version));
    expect(ULTIMA_VERSION).toBe(Math.max(...MIGRACIONES.map((m) => m.version)));
  });
});
