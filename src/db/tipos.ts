import type { Palo, Valor } from '../domain/fonetica/naipes';
import type { TemaId } from '../tema/colores';
import type { TipografiaId } from '../tema/tipografia';

export type Categoria = 'colgadero' | 'naipe' | 'lista_item' | 'numero';
// futuro, no implementar: 'palabra_clave' | 'loci' | 'pao' (ADR-003, MODELO-DATOS.md §1.3)

export type ValorBD = string | number | null;

export interface ResultadoEjecucion {
  changes: number;
  lastInsertRowId: number;
}

/**
 * Superficie mínima de SQLite que necesita el repositorio, desacoplada de
 * `expo-sqlite` (ADR-014). `client.ts` la satisface con la BD real en el
 * dispositivo; los tests la satisfacen con un adaptador sobre `node:sqlite`.
 */
export interface ConexionBD {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: ValorBD[]): Promise<ResultadoEjecucion>;
  getAllAsync<T>(sql: string, params: ValorBD[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: ValorBD[]): Promise<T | null>;
  withTransactionAsync(tarea: () => Promise<void>): Promise<void>;
}

export interface FilaMazo {
  id: string;
  nombre: string;
  categoria: Categoria;
  creado_en: string;
}

export interface FilaTarjeta {
  id: string;
  mazo_id: string;
  categoria: Categoria;
  contenido_frente: string;
  contenido_reverso: string;
  fsrs_state: number;
  fsrs_dificultad: number;
  fsrs_estabilidad: number;
  fsrs_reps: number;
  fsrs_lapses: number;
  fsrs_scheduled_days: number;
  fsrs_learning_steps: number;
  fecha_ultima_revision: string | null;
  fecha_proxima_revision: string;
  metadata_categoria: string;
  creada_en: string;
  archivada: number;
}

export type Direccion = 'directa' | 'inversa';

export interface FilaRevision {
  id: string;
  tarjeta_id: string;
  sesion_id: string;
  calificacion: number;
  fecha: string;
  estabilidad_antes: number;
  estabilidad_despues: number;
  elapsed_days: number;
  direccion: Direccion | null;
}

export interface FilaSesionEstudio {
  id: string;
  iniciada_en: string;
  terminada_en: string | null;
  duracion_segundos: number;
  aciertos: number;
  fallos: number;
  modo: string;
}

export interface FilaLista {
  id: string;
  nombre: string;
  segundos_estudio: number;
  creada_en: string;
}

export interface FilaListaObjeto {
  id: string;
  lista_id: string;
  posicion: number;
  texto: string;
}

export interface FilaNumeroImportante {
  id: string;
  etiqueta: string;
  digitos: string;
  creado_en: string;
}

/** Forma de `tarjeta.metadata_categoria` cuando `categoria === 'lista_item'` (ADR-020). */
export interface MetadataListaItem {
  lista_id: string;
  id_objeto_a: string;
  id_objeto_b: string;
}

/** Forma de `tarjeta.metadata_categoria` cuando `categoria === 'numero'`. */
export interface MetadataNumero {
  numero_id: string;
}

/** Forma de `tarjeta.metadata_categoria` cuando `categoria === 'colgadero'`. */
export interface MetadataColgadero {
  numero: number;
}

/** Forma de `tarjeta.metadata_categoria` cuando `categoria === 'naipe'`. */
export interface MetadataNaipe {
  palo: Palo;
  valor: Valor;
  aprobada_por_operador: boolean;
}

export interface FilaDiaPractica {
  fecha_local: string;
  tarjetas_revisadas: number;
  meta_cumplida: number;
  congelador_usado: number;
}

export interface FilaRachaConfig {
  id: number;
  meta_diaria: number;
  congeladores_disponibles: number;
  hora_recordatorio: string;
}

export interface FilaPreferencias {
  id: number;
  tema: TemaId;
  tipografia: TipografiaId;
}
