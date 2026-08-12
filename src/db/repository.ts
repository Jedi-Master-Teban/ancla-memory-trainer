import type { CardInput } from 'ts-fsrs';
import { crearTarjetaNueva, programar, type Calificacion } from '../domain/fsrs/scheduler';
import type {
  Categoria,
  ConexionBD,
  Direccion,
  FilaMazo,
  FilaRevision,
  FilaSesionEstudio,
  FilaTarjeta,
} from './tipos';

function generarId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// --- Mazo ---

export async function crearMazo(
  db: ConexionBD,
  datos: { nombre: string; categoria: Categoria },
  ahora: Date
): Promise<FilaMazo> {
  const fila: FilaMazo = {
    id: generarId(),
    nombre: datos.nombre,
    categoria: datos.categoria,
    creado_en: ahora.toISOString(),
  };
  await db.runAsync('INSERT INTO mazo (id, nombre, categoria, creado_en) VALUES (?, ?, ?, ?)', [
    fila.id,
    fila.nombre,
    fila.categoria,
    fila.creado_en,
  ]);
  return fila;
}

export async function obtenerMazo(db: ConexionBD, id: string): Promise<FilaMazo | null> {
  return db.getFirstAsync<FilaMazo>('SELECT * FROM mazo WHERE id = ?', [id]);
}

export async function listarMazos(db: ConexionBD): Promise<FilaMazo[]> {
  return db.getAllAsync<FilaMazo>('SELECT * FROM mazo ORDER BY creado_en', []);
}

// --- Tarjeta ---

export async function crearTarjeta(
  db: ConexionBD,
  datos: {
    mazoId: string;
    categoria: Categoria;
    contenidoFrente: string;
    contenidoReverso: string;
    metadataCategoria?: Record<string, unknown>;
  },
  ahora: Date
): Promise<FilaTarjeta> {
  const nueva = crearTarjetaNueva(ahora);
  const fila: FilaTarjeta = {
    id: generarId(),
    mazo_id: datos.mazoId,
    categoria: datos.categoria,
    contenido_frente: datos.contenidoFrente,
    contenido_reverso: datos.contenidoReverso,
    fsrs_state: nueva.state,
    fsrs_dificultad: nueva.difficulty,
    fsrs_estabilidad: nueva.stability,
    fsrs_reps: nueva.reps,
    fsrs_lapses: nueva.lapses,
    fsrs_scheduled_days: nueva.scheduled_days,
    fsrs_learning_steps: nueva.learning_steps,
    fecha_ultima_revision: nueva.last_review ? nueva.last_review.toISOString() : null,
    fecha_proxima_revision: nueva.due.toISOString(),
    metadata_categoria: JSON.stringify(datos.metadataCategoria ?? {}),
    creada_en: ahora.toISOString(),
    archivada: 0,
  };
  await db.runAsync(
    `INSERT INTO tarjeta (
      id, mazo_id, categoria, contenido_frente, contenido_reverso,
      fsrs_state, fsrs_dificultad, fsrs_estabilidad, fsrs_reps, fsrs_lapses,
      fsrs_scheduled_days, fsrs_learning_steps,
      fecha_ultima_revision, fecha_proxima_revision, metadata_categoria, creada_en, archivada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fila.id,
      fila.mazo_id,
      fila.categoria,
      fila.contenido_frente,
      fila.contenido_reverso,
      fila.fsrs_state,
      fila.fsrs_dificultad,
      fila.fsrs_estabilidad,
      fila.fsrs_reps,
      fila.fsrs_lapses,
      fila.fsrs_scheduled_days,
      fila.fsrs_learning_steps,
      fila.fecha_ultima_revision,
      fila.fecha_proxima_revision,
      fila.metadata_categoria,
      fila.creada_en,
      fila.archivada,
    ]
  );
  return fila;
}

export async function obtenerTarjeta(db: ConexionBD, id: string): Promise<FilaTarjeta | null> {
  return db.getFirstAsync<FilaTarjeta>('SELECT * FROM tarjeta WHERE id = ?', [id]);
}

export async function listarTarjetasPorMazo(db: ConexionBD, mazoId: string): Promise<FilaTarjeta[]> {
  return db.getAllAsync<FilaTarjeta>(
    'SELECT * FROM tarjeta WHERE mazo_id = ? AND archivada = 0 ORDER BY fecha_proxima_revision',
    [mazoId]
  );
}

function filaACardInput(fila: FilaTarjeta): CardInput {
  return {
    due: fila.fecha_proxima_revision,
    stability: fila.fsrs_estabilidad,
    difficulty: fila.fsrs_dificultad,
    elapsed_days: 0,
    scheduled_days: fila.fsrs_scheduled_days,
    learning_steps: fila.fsrs_learning_steps,
    reps: fila.fsrs_reps,
    lapses: fila.fsrs_lapses,
    state: fila.fsrs_state,
    last_review: fila.fecha_ultima_revision,
  };
}

/**
 * Califica una tarjeta: la programa vía `scheduler.ts` (invariante I-1),
 * persiste el nuevo estado FSRS y escribe una fila en `revision` (invariante
 * I-4) — siempre juntas, nunca una sin la otra.
 */
export async function calificarTarjeta(
  db: ConexionBD,
  datos: { tarjetaId: string; sesionId: string; calificacion: Calificacion; direccion?: Direccion },
  ahora: Date
): Promise<FilaTarjeta> {
  const filaActual = await obtenerTarjeta(db, datos.tarjetaId);
  if (!filaActual) {
    throw new Error(`No existe la tarjeta ${datos.tarjetaId}`);
  }

  const cardInput = filaACardInput(filaActual);
  const estabilidadAntes = filaActual.fsrs_estabilidad;
  const { card, log } = programar(cardInput, datos.calificacion, ahora);

  const filaNueva: FilaTarjeta = {
    ...filaActual,
    fsrs_state: card.state,
    fsrs_dificultad: card.difficulty,
    fsrs_estabilidad: card.stability,
    fsrs_reps: card.reps,
    fsrs_lapses: card.lapses,
    fsrs_scheduled_days: card.scheduled_days,
    fsrs_learning_steps: card.learning_steps,
    fecha_ultima_revision: ahora.toISOString(),
    fecha_proxima_revision: card.due.toISOString(),
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE tarjeta SET
        fsrs_state = ?, fsrs_dificultad = ?, fsrs_estabilidad = ?, fsrs_reps = ?, fsrs_lapses = ?,
        fsrs_scheduled_days = ?, fsrs_learning_steps = ?, fecha_ultima_revision = ?, fecha_proxima_revision = ?
      WHERE id = ?`,
      [
        filaNueva.fsrs_state,
        filaNueva.fsrs_dificultad,
        filaNueva.fsrs_estabilidad,
        filaNueva.fsrs_reps,
        filaNueva.fsrs_lapses,
        filaNueva.fsrs_scheduled_days,
        filaNueva.fsrs_learning_steps,
        filaNueva.fecha_ultima_revision,
        filaNueva.fecha_proxima_revision,
        filaNueva.id,
      ]
    );

    await db.runAsync(
      `INSERT INTO revision (
        id, tarjeta_id, sesion_id, calificacion, fecha,
        estabilidad_antes, estabilidad_despues, elapsed_days, direccion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generarId(),
        filaActual.id,
        datos.sesionId,
        log.rating,
        ahora.toISOString(),
        estabilidadAntes,
        card.stability,
        log.elapsed_days,
        datos.direccion ?? null,
      ]
    );
  });

  return filaNueva;
}

export async function listarRevisionesDeTarjeta(db: ConexionBD, tarjetaId: string): Promise<FilaRevision[]> {
  return db.getAllAsync<FilaRevision>(
    'SELECT * FROM revision WHERE tarjeta_id = ? ORDER BY fecha',
    [tarjetaId]
  );
}

// --- Sesión de estudio ---

export async function crearSesion(db: ConexionBD, datos: { modo: string }, ahora: Date): Promise<FilaSesionEstudio> {
  const fila: FilaSesionEstudio = {
    id: generarId(),
    iniciada_en: ahora.toISOString(),
    terminada_en: null,
    duracion_segundos: 0,
    aciertos: 0,
    fallos: 0,
    modo: datos.modo,
  };
  await db.runAsync(
    'INSERT INTO sesion_estudio (id, iniciada_en, terminada_en, duracion_segundos, aciertos, fallos, modo) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [fila.id, fila.iniciada_en, fila.terminada_en, fila.duracion_segundos, fila.aciertos, fila.fallos, fila.modo]
  );
  return fila;
}

export async function cerrarSesion(
  db: ConexionBD,
  datos: { sesionId: string; duracionSegundos: number; aciertos: number; fallos: number },
  ahora: Date
): Promise<void> {
  await db.runAsync(
    'UPDATE sesion_estudio SET terminada_en = ?, duracion_segundos = ?, aciertos = ?, fallos = ? WHERE id = ?',
    [ahora.toISOString(), datos.duracionSegundos, datos.aciertos, datos.fallos, datos.sesionId]
  );
}
