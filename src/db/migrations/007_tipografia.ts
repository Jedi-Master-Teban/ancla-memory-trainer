import type { ConexionBD } from '../tipos';

export const version = 7;

/**
 * Preferencia de tipografía (Fase 8, ADR-027), independiente del tema: el
 * operador pidió poder elegir entre la letra del sistema y las tipografías de
 * los mockups, que son más grandes y robustas.
 *
 * Aditiva y no destructiva: `ADD COLUMN` con `DEFAULT`, así que la fila que ya
 * existe en el dispositivo conserva su `tema` y estrena `tipografia`.
 * Arranca en 'tematica' porque es la dirección visual que se eligió; cambiar a
 * 'sistema' está a un toque en Ajustes.
 */
export async function aplicar(db: ConexionBD, _ahora: Date): Promise<void> {
  await db.execAsync(`ALTER TABLE preferencias ADD COLUMN tipografia TEXT NOT NULL DEFAULT 'tematica';`);
}
