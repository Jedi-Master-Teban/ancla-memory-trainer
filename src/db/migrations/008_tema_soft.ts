import type { ConexionBD } from '../tipos';

export const version = 8;

/**
 * Soft UI pasa a ser el tema por defecto — decisión del operador (2026-09-10),
 * que revisa la de la 006 ('arcade', elegida en 2026-08-20).
 *
 * Por qué un UPDATE y no un DEFAULT de columna: la fila ya existe en el
 * dispositivo con `tema = 'arcade'`, escrita por `006_preferencias.ts`. Cambiar
 * el default de una columna no reescribe filas existentes, así que no tendría
 * ningún efecto donde importa. Tiene que ser un UPDATE explícito.
 *
 * Es no destructivo en el sentido que importa: no borra filas ni columnas, no
 * toca `tipografia` (007) ni ninguna otra tabla. Sí pisa el valor guardado de
 * `tema`, y eso es deliberado: es exactamente lo que se pidió. Corre una sola
 * vez (el runner la registra en `migracion`), así que cualquier tema que el
 * operador elija después en Ajustes se queda como lo deje.
 *
 * En una instalación nueva la secuencia es 006 (siembra 'arcade') → 008
 * (lo pasa a 'soft'). El estado final es el mismo, y la 006 no se edita nunca
 * porque ya está aplicada en el dispositivo (MODELO-DATOS.md §3).
 */
export async function aplicar(db: ConexionBD, _ahora: Date): Promise<void> {
  await db.runAsync('UPDATE preferencias SET tema = ? WHERE id = 1', ['soft']);
}
