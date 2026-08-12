import type { ConexionBD } from '../tipos';

export const version = 1;

export async function aplicar(db: ConexionBD): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS mazo (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      creado_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tarjeta (
      id TEXT PRIMARY KEY,
      mazo_id TEXT NOT NULL REFERENCES mazo(id) ON DELETE CASCADE,
      categoria TEXT NOT NULL,
      contenido_frente TEXT NOT NULL,
      contenido_reverso TEXT NOT NULL,
      fsrs_state INTEGER NOT NULL,
      fsrs_dificultad REAL NOT NULL,
      fsrs_estabilidad REAL NOT NULL,
      fsrs_reps INTEGER NOT NULL,
      fsrs_lapses INTEGER NOT NULL,
      fsrs_scheduled_days INTEGER NOT NULL,
      fsrs_learning_steps INTEGER NOT NULL DEFAULT 0,
      fecha_ultima_revision TEXT,
      fecha_proxima_revision TEXT NOT NULL,
      metadata_categoria TEXT NOT NULL DEFAULT '{}',
      creada_en TEXT NOT NULL,
      archivada INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tarjeta_proxima_revision ON tarjeta (fecha_proxima_revision, archivada);
    CREATE INDEX IF NOT EXISTS idx_tarjeta_categoria ON tarjeta (categoria, archivada);

    CREATE TABLE IF NOT EXISTS sesion_estudio (
      id TEXT PRIMARY KEY,
      iniciada_en TEXT NOT NULL,
      terminada_en TEXT,
      duracion_segundos INTEGER NOT NULL DEFAULT 0,
      aciertos INTEGER NOT NULL DEFAULT 0,
      fallos INTEGER NOT NULL DEFAULT 0,
      modo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS revision (
      id TEXT PRIMARY KEY,
      tarjeta_id TEXT NOT NULL REFERENCES tarjeta(id),
      sesion_id TEXT NOT NULL REFERENCES sesion_estudio(id),
      calificacion INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      estabilidad_antes REAL NOT NULL,
      estabilidad_despues REAL NOT NULL,
      elapsed_days INTEGER NOT NULL,
      direccion TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_revision_tarjeta ON revision (tarjeta_id);
  `);
}
