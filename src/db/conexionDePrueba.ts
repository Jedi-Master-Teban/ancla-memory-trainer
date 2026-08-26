import { DatabaseSync } from 'node:sqlite';
import type { ConexionBD, ValorBD } from './tipos';

/**
 * Adaptador de `node:sqlite` (built-in de Node) que implementa `ConexionBD`,
 * usado solo en tests. `expo-sqlite` es un módulo nativo real: no corre bajo
 * Jest/Node (confirmado empíricamente — `NativeDatabase is not a constructor`).
 * Este adaptador ejecuta el mismo SQL contra un motor SQLite real, no un mock
 * en memoria, así que sí prueba el DDL/DML de verdad (ADR-014).
 */
export function crearConexionDePrueba(): ConexionBD {
  const db = new DatabaseSync(':memory:');

  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, params: ValorBD[]) {
      const resultado = db.prepare(sql).run(...params);
      return {
        changes: Number(resultado.changes),
        lastInsertRowId: Number(resultado.lastInsertRowid),
      };
    },
    async getAllAsync<T>(sql: string, params: ValorBD[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, params: ValorBD[]) {
      const fila = db.prepare(sql).get(...params);
      return (fila ?? null) as T | null;
    },
    async withTransactionAsync(tarea) {
      db.exec('BEGIN');
      try {
        await tarea();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
