import { Rating, State } from 'ts-fsrs';
import { diffEslabones, type ObjetoLista } from '../domain/cadena/eslabones';
import { crearTarjetaNueva, filaTarjetaACardInput, programar, type Calificacion } from '../domain/fsrs/scheduler';
import { estadoVisual, type EstadoVisual } from '../domain/fsrs/estado';
import { calcularRacha, fechaLocal, type ResultadoRacha } from '../domain/racha/calculo';
import { mezclarSesion } from '../domain/sesion/mezcla';
import { armarSesion, type OpcionesSesion } from '../domain/sesion/motor';
import type {
  Categoria,
  ConexionBD,
  Direccion,
  FilaDiaPractica,
  FilaLista,
  FilaListaObjeto,
  FilaMazo,
  FilaNumeroImportante,
  FilaRachaConfig,
  FilaRevision,
  FilaSesionEstudio,
  FilaTarjeta,
  MetadataListaItem,
  MetadataNumero,
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

export async function obtenerMazoPorCategoria(db: ConexionBD, categoria: Categoria): Promise<FilaMazo | null> {
  return db.getFirstAsync<FilaMazo>('SELECT * FROM mazo WHERE categoria = ? ORDER BY creado_en LIMIT 1', [categoria]);
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

/**
 * Arma una sesión de práctica para un mazo: trae sus tarjetas y delega la
 * selección/orden a la lógica pura de `domain/sesion/motor.ts`.
 */
export async function armarSesionDeMazo(
  db: ConexionBD,
  mazoId: string,
  opciones: OpcionesSesion
): Promise<FilaTarjeta[]> {
  const tarjetas = await listarTarjetasPorMazo(db, mazoId);
  return armarSesion(tarjetas, opciones);
}

async function tablaExiste(db: ConexionBD, nombre: string): Promise<boolean> {
  const fila = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [nombre]
  );
  return fila !== null;
}

/**
 * Registra la práctica de hoy en `dia_practica` (§8.7, ADR-020-style: se
 * llama desde `calificarTarjeta`, no desde cada pantalla, para que las
 * cuatro categorías alimenten la racha con cero cambios en las pantallas ya
 * escritas). Guarda contra una BD anterior a la migración 005: el test de
 * migración 004 (`repository.test.ts`, `bdEnVersion3`) califica tarjetas
 * sobre un esquema real de esa época — en producción esto nunca ocurre
 * (`client.ts` siempre migra antes de entregar la conexión).
 */
async function registrarPracticaDelDia(db: ConexionBD, ahora: Date): Promise<void> {
  if (!(await tablaExiste(db, 'racha_config'))) return;

  const config = await obtenerConfigRacha(db);
  const fecha = fechaLocal(ahora);
  const actual = await obtenerDiaPractica(db, fecha);
  const tarjetasRevisadas = (actual?.tarjetas_revisadas ?? 0) + 1;
  const metaCumplida = tarjetasRevisadas >= config.meta_diaria ? 1 : 0;

  if (actual) {
    await db.runAsync('UPDATE dia_practica SET tarjetas_revisadas = ?, meta_cumplida = ? WHERE fecha_local = ?', [
      tarjetasRevisadas,
      metaCumplida,
      fecha,
    ]);
  } else {
    await db.runAsync(
      'INSERT INTO dia_practica (fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado) VALUES (?, ?, ?, 0)',
      [fecha, tarjetasRevisadas, metaCumplida]
    );
  }
}

/**
 * Califica una tarjeta: la programa vía `scheduler.ts` (invariante I-1),
 * persiste el nuevo estado FSRS y escribe una fila en `revision` (invariante
 * I-4) — siempre juntas, nunca una sin la otra. También registra la
 * práctica de hoy (racha, §8.7) en la misma transacción: nunca penaliza,
 * cualquier calificación cuenta igual para `tarjetas_revisadas`.
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

  const cardInput = filaTarjetaACardInput(filaActual);
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

    await registrarPracticaDelDia(db, ahora);
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

// --- Estadísticas por tarjeta (modulos/02-colgadero.md §4) ---

export interface ResumenTarjeta {
  vecesRevisada: number;
  tasaAciertos: number | null;
  proximaFecha: string;
  estadoVisual: EstadoVisual;
}

/**
 * Todo derivado de `revision`/`tarjeta` — nada de contadores paralelos que
 * puedan desincronizarse (modulos/02-colgadero.md §4). "Acierto" = cualquier
 * calificación distinta de "Otra vez" (mismo criterio que stores/sesion.ts).
 */
export async function resumenDeTarjeta(db: ConexionBD, tarjetaId: string, ahora: Date): Promise<ResumenTarjeta | null> {
  const tarjeta = await obtenerTarjeta(db, tarjetaId);
  if (!tarjeta) return null;

  const revisiones = await listarRevisionesDeTarjeta(db, tarjetaId);
  const aciertos = revisiones.filter((r) => r.calificacion !== Rating.Again).length;

  return {
    vecesRevisada: revisiones.length,
    tasaAciertos: revisiones.length > 0 ? aciertos / revisiones.length : null,
    proximaFecha: tarjeta.fecha_proxima_revision,
    estadoVisual: estadoVisual(filaTarjetaACardInput(tarjeta), ahora),
  };
}

/**
 * Edita el contenido de una tarjeta (p. ej. EditorNaipe.tsx, eslabones de
 * lista, dígitos de un número) sin tocar su estado FSRS — mismo `id`, mismo
 * historial (seeds/colgadero-100.md: "editar una palabra no reinicia el
 * estado FSRS de su tarjeta").
 */
export async function actualizarContenidoTarjeta(
  db: ConexionBD,
  tarjetaId: string,
  datos: { contenidoFrente?: string; contenidoReverso?: string; metadataCategoria?: Record<string, unknown> }
): Promise<void> {
  const campos: string[] = [];
  const valores: (string | null)[] = [];

  if (datos.contenidoFrente !== undefined) {
    campos.push('contenido_frente = ?');
    valores.push(datos.contenidoFrente);
  }
  if (datos.contenidoReverso !== undefined) {
    campos.push('contenido_reverso = ?');
    valores.push(datos.contenidoReverso);
  }
  if (datos.metadataCategoria !== undefined) {
    campos.push('metadata_categoria = ?');
    valores.push(JSON.stringify(datos.metadataCategoria));
  }
  if (campos.length === 0) return;

  await db.runAsync(`UPDATE tarjeta SET ${campos.join(', ')} WHERE id = ?`, [...valores, tarjetaId]);
}

// --- Lista / lista_objeto / eslabones (§8.4, ADR-020) ---

export async function crearLista(
  db: ConexionBD,
  datos: { nombre: string; segundosEstudio: number },
  ahora: Date
): Promise<FilaLista> {
  const fila: FilaLista = {
    id: generarId(),
    nombre: datos.nombre,
    segundos_estudio: datos.segundosEstudio,
    creada_en: ahora.toISOString(),
  };
  await db.runAsync('INSERT INTO lista (id, nombre, segundos_estudio, creada_en) VALUES (?, ?, ?, ?)', [
    fila.id,
    fila.nombre,
    fila.segundos_estudio,
    fila.creada_en,
  ]);
  return fila;
}

export async function obtenerLista(db: ConexionBD, id: string): Promise<FilaLista | null> {
  return db.getFirstAsync<FilaLista>('SELECT * FROM lista WHERE id = ?', [id]);
}

export async function listarListas(db: ConexionBD): Promise<FilaLista[]> {
  return db.getAllAsync<FilaLista>('SELECT * FROM lista ORDER BY creada_en', []);
}

export async function actualizarLista(
  db: ConexionBD,
  id: string,
  datos: { nombre?: string; segundosEstudio?: number }
): Promise<void> {
  const campos: string[] = [];
  const valores: (string | number)[] = [];
  if (datos.nombre !== undefined) {
    campos.push('nombre = ?');
    valores.push(datos.nombre);
  }
  if (datos.segundosEstudio !== undefined) {
    campos.push('segundos_estudio = ?');
    valores.push(datos.segundosEstudio);
  }
  if (campos.length === 0) return;
  await db.runAsync(`UPDATE lista SET ${campos.join(', ')} WHERE id = ?`, [...valores, id]);
}

export async function listarObjetosDeLista(db: ConexionBD, listaId: string): Promise<FilaListaObjeto[]> {
  return db.getAllAsync<FilaListaObjeto>('SELECT * FROM lista_objeto WHERE lista_id = ? ORDER BY posicion', [
    listaId,
  ]);
}

/**
 * Reemplaza el conjunto de objetos de una lista por `objetos` (nuevo orden y
 * contenido) y sincroniza sus eslabones vía `diffEslabones` (identidad por id
 * de objeto, ADR-020): nunca reescribe el contenido de un eslabón existente
 * conservando su estado FSRS (04-listas-cadena.md §3) — lo que no cambió de
 * adyacencia se conserva íntegro; solo su contenido de texto se resincroniza
 * si el objeto fue editado.
 */
export async function guardarObjetosDeLista(
  db: ConexionBD,
  listaId: string,
  objetos: { id?: string; texto: string }[],
  ahora: Date
): Promise<FilaListaObjeto[]> {
  const anterioresFilas = await listarObjetosDeLista(db, listaId);
  const anteriores: ObjetoLista[] = anterioresFilas.map((f) => ({ id: f.id, posicion: f.posicion, texto: f.texto }));

  const nuevasFilas: FilaListaObjeto[] = objetos.map((o, i) => ({
    id: o.id ?? generarId(),
    lista_id: listaId,
    posicion: i,
    texto: o.texto,
  }));
  const nuevos: ObjetoLista[] = nuevasFilas.map((f) => ({ id: f.id, posicion: f.posicion, texto: f.texto }));

  const diff = diffEslabones(anteriores, nuevos);
  const idsAntes = new Set(anterioresFilas.map((f) => f.id));
  const idsDespues = new Set(nuevasFilas.map((f) => f.id));
  const mazo = await obtenerMazoPorCategoria(db, 'lista_item');
  if (!mazo) {
    throw new Error('No existe el mazo lista_item — falta correr la migración 004');
  }
  const tarjetasDeLaLista = (await listarTarjetasPorMazo(db, mazo.id)).filter(
    (t) => (JSON.parse(t.metadata_categoria) as MetadataListaItem).lista_id === listaId
  );

  await db.withTransactionAsync(async () => {
    for (const filaVieja of anterioresFilas) {
      if (!idsDespues.has(filaVieja.id)) {
        await db.runAsync('DELETE FROM lista_objeto WHERE id = ?', [filaVieja.id]);
      }
    }
    for (const filaNueva of nuevasFilas) {
      if (idsAntes.has(filaNueva.id)) {
        await db.runAsync('UPDATE lista_objeto SET posicion = ?, texto = ? WHERE id = ?', [
          filaNueva.posicion,
          filaNueva.texto,
          filaNueva.id,
        ]);
      } else {
        await db.runAsync('INSERT INTO lista_objeto (id, lista_id, posicion, texto) VALUES (?, ?, ?, ?)', [
          filaNueva.id,
          filaNueva.lista_id,
          filaNueva.posicion,
          filaNueva.texto,
        ]);
      }
    }

    for (const eslabon of diff.aArchivar) {
      const tarjeta = tarjetasDeLaLista.find((t) => {
        const m = JSON.parse(t.metadata_categoria) as MetadataListaItem;
        return m.id_objeto_a === eslabon.idObjetoA && m.id_objeto_b === eslabon.idObjetoB;
      });
      if (tarjeta) {
        await db.runAsync('UPDATE tarjeta SET archivada = 1 WHERE id = ?', [tarjeta.id]);
      }
    }

    for (const eslabon of diff.aCrear) {
      await crearTarjeta(
        db,
        {
          mazoId: mazo.id,
          categoria: 'lista_item',
          contenidoFrente: eslabon.textoA,
          contenidoReverso: eslabon.textoB,
          metadataCategoria: { lista_id: listaId, id_objeto_a: eslabon.idObjetoA, id_objeto_b: eslabon.idObjetoB },
        },
        ahora
      );
    }

    for (const eslabon of diff.sinCambios) {
      const tarjeta = tarjetasDeLaLista.find((t) => {
        const m = JSON.parse(t.metadata_categoria) as MetadataListaItem;
        return m.id_objeto_a === eslabon.idObjetoA && m.id_objeto_b === eslabon.idObjetoB;
      });
      if (tarjeta && (tarjeta.contenido_frente !== eslabon.textoA || tarjeta.contenido_reverso !== eslabon.textoB)) {
        await actualizarContenidoTarjeta(db, tarjeta.id, {
          contenidoFrente: eslabon.textoA,
          contenidoReverso: eslabon.textoB,
        });
      }
    }
  });

  return nuevasFilas;
}

/**
 * Eslabones vigentes de una lista, en orden de presentación — derivado al
 * vuelo uniendo `id_objeto_a` contra la posición actual en `lista_objeto`
 * (ADR-020: nunca se guarda un número de posición aparte).
 */
export async function listarEslabonesDeLista(db: ConexionBD, listaId: string): Promise<FilaTarjeta[]> {
  const mazo = await obtenerMazoPorCategoria(db, 'lista_item');
  if (!mazo) return [];

  const objetos = await listarObjetosDeLista(db, listaId);
  const posicionPorId = new Map(objetos.map((o) => [o.id, o.posicion]));

  const tarjetas = (await listarTarjetasPorMazo(db, mazo.id)).filter(
    (t) => (JSON.parse(t.metadata_categoria) as MetadataListaItem).lista_id === listaId
  );

  return tarjetas.sort((a, b) => {
    const posA = posicionPorId.get((JSON.parse(a.metadata_categoria) as MetadataListaItem).id_objeto_a) ?? 0;
    const posB = posicionPorId.get((JSON.parse(b.metadata_categoria) as MetadataListaItem).id_objeto_a) ?? 0;
    return posA - posB;
  });
}

/**
 * Borra la lista (CASCADE sobre lista_objeto vía FK) y archiva sus eslabones.
 * `revision` nunca se toca (04-listas-cadena.md §3).
 */
export async function eliminarLista(db: ConexionBD, listaId: string): Promise<void> {
  const eslabones = await listarEslabonesDeLista(db, listaId);
  await db.withTransactionAsync(async () => {
    for (const eslabon of eslabones) {
      await db.runAsync('UPDATE tarjeta SET archivada = 1 WHERE id = ?', [eslabon.id]);
    }
    await db.runAsync('DELETE FROM lista WHERE id = ?', [listaId]);
  });
}

// --- Número importante (§8.5) ---

export async function crearNumeroImportante(
  db: ConexionBD,
  datos: { etiqueta: string; digitos: string },
  ahora: Date
): Promise<{ fila: FilaNumeroImportante; tarjeta: FilaTarjeta }> {
  const mazo = await obtenerMazoPorCategoria(db, 'numero');
  if (!mazo) {
    throw new Error('No existe el mazo numero — falta correr la migración 004');
  }

  const fila: FilaNumeroImportante = {
    id: generarId(),
    etiqueta: datos.etiqueta,
    digitos: datos.digitos,
    creado_en: ahora.toISOString(),
  };

  let tarjeta!: FilaTarjeta;
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT INTO numero_importante (id, etiqueta, digitos, creado_en) VALUES (?, ?, ?, ?)', [
      fila.id,
      fila.etiqueta,
      fila.digitos,
      fila.creado_en,
    ]);
    tarjeta = await crearTarjeta(
      db,
      {
        mazoId: mazo.id,
        categoria: 'numero',
        contenidoFrente: fila.etiqueta,
        contenidoReverso: fila.digitos,
        metadataCategoria: { numero_id: fila.id },
      },
      ahora
    );
  });

  return { fila, tarjeta };
}

export async function obtenerNumeroImportante(db: ConexionBD, id: string): Promise<FilaNumeroImportante | null> {
  return db.getFirstAsync<FilaNumeroImportante>('SELECT * FROM numero_importante WHERE id = ?', [id]);
}

export async function listarNumerosImportantes(db: ConexionBD): Promise<FilaNumeroImportante[]> {
  return db.getAllAsync<FilaNumeroImportante>('SELECT * FROM numero_importante ORDER BY creado_en', []);
}

export async function obtenerTarjetaDeNumero(db: ConexionBD, numeroId: string): Promise<FilaTarjeta | null> {
  const mazo = await obtenerMazoPorCategoria(db, 'numero');
  if (!mazo) return null;
  const tarjetas = await listarTarjetasPorMazo(db, mazo.id);
  return (
    tarjetas.find((t) => (JSON.parse(t.metadata_categoria) as MetadataNumero).numero_id === numeroId) ?? null
  );
}

/**
 * Edita etiqueta/dígitos sin reiniciar el estado FSRS de su tarjeta
 * (05-numeros.md §4); lo anota en la metadata como registro honesto para el
 * panel de retención.
 */
export async function editarNumeroImportante(
  db: ConexionBD,
  id: string,
  datos: { etiqueta?: string; digitos?: string }
): Promise<void> {
  const actual = await obtenerNumeroImportante(db, id);
  if (!actual) {
    throw new Error(`No existe el número ${id}`);
  }
  const tarjeta = await obtenerTarjetaDeNumero(db, id);

  await db.withTransactionAsync(async () => {
    const campos: string[] = [];
    const valores: string[] = [];
    if (datos.etiqueta !== undefined) {
      campos.push('etiqueta = ?');
      valores.push(datos.etiqueta);
    }
    if (datos.digitos !== undefined) {
      campos.push('digitos = ?');
      valores.push(datos.digitos);
    }
    if (campos.length > 0) {
      await db.runAsync(`UPDATE numero_importante SET ${campos.join(', ')} WHERE id = ?`, [...valores, id]);
    }

    if (tarjeta) {
      const metadataAnterior = JSON.parse(tarjeta.metadata_categoria) as MetadataNumero & { editado?: boolean };
      await actualizarContenidoTarjeta(db, tarjeta.id, {
        contenidoFrente: datos.etiqueta ?? actual.etiqueta,
        contenidoReverso: datos.digitos ?? actual.digitos,
        metadataCategoria: { ...metadataAnterior, editado: true },
      });
    }
  });
}

export async function eliminarNumeroImportante(db: ConexionBD, id: string): Promise<void> {
  const tarjeta = await obtenerTarjetaDeNumero(db, id);
  await db.withTransactionAsync(async () => {
    if (tarjeta) {
      await db.runAsync('UPDATE tarjeta SET archivada = 1 WHERE id = ?', [tarjeta.id]);
    }
    await db.runAsync('DELETE FROM numero_importante WHERE id = ?', [id]);
  });
}

// --- Racha (§8.7, agent_docs/modulos/07-racha.md) ---

export async function obtenerConfigRacha(db: ConexionBD): Promise<FilaRachaConfig> {
  const fila = await db.getFirstAsync<FilaRachaConfig>('SELECT * FROM racha_config WHERE id = 1', []);
  if (!fila) {
    throw new Error('No existe racha_config — falta correr la migración 005');
  }
  return fila;
}

export async function actualizarConfigRacha(
  db: ConexionBD,
  cambios: { metaDiaria?: number; congeladoresDisponibles?: number; horaRecordatorio?: string }
): Promise<void> {
  const campos: string[] = [];
  const valores: (string | number)[] = [];
  if (cambios.metaDiaria !== undefined) {
    campos.push('meta_diaria = ?');
    valores.push(cambios.metaDiaria);
  }
  if (cambios.congeladoresDisponibles !== undefined) {
    campos.push('congeladores_disponibles = ?');
    valores.push(cambios.congeladoresDisponibles);
  }
  if (cambios.horaRecordatorio !== undefined) {
    campos.push('hora_recordatorio = ?');
    valores.push(cambios.horaRecordatorio);
  }
  if (campos.length === 0) return;
  await db.runAsync(`UPDATE racha_config SET ${campos.join(', ')} WHERE id = 1`, valores);
}

export async function obtenerDiaPractica(db: ConexionBD, fecha: string): Promise<FilaDiaPractica | null> {
  return db.getFirstAsync<FilaDiaPractica>('SELECT * FROM dia_practica WHERE fecha_local = ?', [fecha]);
}

/**
 * TODAS las filas, sin acotar a ~90 días: una racha real más larga no debe
 * truncarse por el propio fetch (el heatmap sí recorta a 90 en la UI; el
 * paseo hacia atrás de `calcularRacha` ya está acotado por el primer hueco).
 */
export async function listarDiasPractica(db: ConexionBD): Promise<FilaDiaPractica[]> {
  return db.getAllAsync<FilaDiaPractica>('SELECT * FROM dia_practica ORDER BY fecha_local', []);
}

export async function calcularRachaActual(db: ConexionBD, ahora: Date): Promise<ResultadoRacha> {
  const [dias, config] = await Promise.all([listarDiasPractica(db), obtenerConfigRacha(db)]);
  return calcularRacha(dias, config, ahora);
}

/**
 * Congela manualmente un día pasado que no cumplió la meta (§8.7 — sin
 * recarga automática, decisión del operador en Plan Mode de Fase 5).
 */
export async function aplicarCongelador(db: ConexionBD, fechaObjetivo: string, ahora: Date): Promise<void> {
  const config = await obtenerConfigRacha(db);
  if (config.congeladores_disponibles <= 0) {
    throw new Error('No quedan congeladores disponibles');
  }
  if (fechaObjetivo >= fechaLocal(ahora)) {
    throw new Error('Solo se puede aplicar un congelador a un día ya pasado');
  }
  const dia = await obtenerDiaPractica(db, fechaObjetivo);
  if (dia?.meta_cumplida === 1) {
    throw new Error(`El día ${fechaObjetivo} ya cumplió la meta, no necesita congelador`);
  }
  if (dia?.congelador_usado === 1) {
    throw new Error(`El día ${fechaObjetivo} ya tiene un congelador aplicado`);
  }

  await db.withTransactionAsync(async () => {
    if (dia) {
      await db.runAsync('UPDATE dia_practica SET congelador_usado = 1 WHERE fecha_local = ?', [fechaObjetivo]);
    } else {
      await db.runAsync(
        'INSERT INTO dia_practica (fecha_local, tarjetas_revisadas, meta_cumplida, congelador_usado) VALUES (?, 0, 0, 1)',
        [fechaObjetivo]
      );
    }
    await db.runAsync(
      'UPDATE racha_config SET congeladores_disponibles = congeladores_disponibles - 1 WHERE id = 1',
      []
    );
  });
}

/**
 * Agregado real en SQL (no fetch-y-cuenta en JS) — pedido explícito de
 * 09-dashboard.md §3. Duplica angostamente la definición de "pendiente" de
 * `motor.ts` (vencida O nueva); mitigado con `State.New` parametrizado (no
 * hardcodeado) y una prueba cruzada contra `armarSesion` en el test.
 */
export async function contarPendientesPorCategoria(
  db: ConexionBD,
  ahora: Date
): Promise<{ categoria: Categoria; pendientes: number }[]> {
  return db.getAllAsync<{ categoria: Categoria; pendientes: number }>(
    `SELECT mazo.categoria AS categoria, COUNT(*) AS pendientes
     FROM tarjeta
     JOIN mazo ON tarjeta.mazo_id = mazo.id
     WHERE tarjeta.archivada = 0
       AND (tarjeta.fsrs_state = ? OR tarjeta.fecha_proxima_revision <= ?)
     GROUP BY mazo.categoria`,
    [State.New, ahora.toISOString()]
  );
}

/**
 * Sesión mixta priorizada entre todas las categorías (§8.9) — mismo patrón
 * que `armarSesionDeMazo` envolviendo `armarSesion`, aquí envolviendo
 * `mezclarSesion`.
 */
export async function armarSesionMixta(db: ConexionBD, ahora: Date, topeSesion?: number): Promise<FilaTarjeta[]> {
  const config = await obtenerConfigRacha(db);
  const mazos = await listarMazos(db);
  const listasDeTarjetas = await Promise.all(mazos.map((m) => listarTarjetasPorMazo(db, m.id)));
  return mezclarSesion(listasDeTarjetas.flat(), { ahora, metaDiaria: config.meta_diaria, topeSesion });
}

/**
 * Borra todo `dia_practica` y devuelve `congeladores_disponibles` al valor
 * sembrado por la migración 005 (2). NO es parte de ningún módulo del brief
 * — conveniencia pedida por el operador para limpiar datos de prueba
 * mientras se verifica esta fase en el dispositivo. Candidata a quitarse (o
 * a confirmarse como función real) antes de cerrar la Fase 5.
 */
export async function reiniciarHistorialPractica(db: ConexionBD): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM dia_practica', []);
    await db.runAsync('UPDATE racha_config SET congeladores_disponibles = 2 WHERE id = 1', []);
  });
}
