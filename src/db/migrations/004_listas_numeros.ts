import { crearMazo } from '../repository';
import type { ConexionBD } from '../tipos';

export const version = 4;

/**
 * Tablas para Listas Encadenadas (§8.4) y Números Importantes (§8.5) — aditivo,
 * sin siembra de contenido: a diferencia de colgadero/naipes, este contenido lo
 * crea el operador desde la app, no viene de una lista fija. Los eslabones de
 * una lista son filas de `tarjeta` (categoria='lista_item'), ya soportado desde
 * 001_inicial.ts — MODELO-DATOS.md §2.5.
 *
 * Sí siembra los mazos `lista_item`/`numero` (vacíos): mismo criterio de "un
 * mazo por categoría" que ya rige colgadero/naipe (ADR-020) — evita que cada
 * función de CRUD tenga que comprobar y crear el mazo bajo demanda.
 */
export async function aplicar(db: ConexionBD, ahora: Date): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lista (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      segundos_estudio INTEGER NOT NULL,
      creada_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lista_objeto (
      id TEXT PRIMARY KEY,
      lista_id TEXT NOT NULL REFERENCES lista(id) ON DELETE CASCADE,
      posicion INTEGER NOT NULL,
      texto TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_lista_objeto_lista ON lista_objeto (lista_id, posicion);

    CREATE TABLE IF NOT EXISTS numero_importante (
      id TEXT PRIMARY KEY,
      etiqueta TEXT NOT NULL,
      digitos TEXT NOT NULL,
      creado_en TEXT NOT NULL
    );
  `);

  await crearMazo(db, { nombre: 'Listas', categoria: 'lista_item' }, ahora);
  await crearMazo(db, { nombre: 'Números', categoria: 'numero' }, ahora);
}
