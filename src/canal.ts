/**
 * Canal de la build: `estable` es la app de verdad; `alfa` es la versión de
 * prueba que se publica bajo `/alpha/` en el MISMO origen (ADR-039).
 *
 * En un mismo origen el navegador comparte OPFS, IndexedDB y Cache Storage,
 * así que la alfa NO puede usar los nombres de la app real: una migración de
 * la alfa tocaría los datos de verdad. Todo lo que se guarda por nombre sale
 * de aquí. `EXPO_PUBLIC_CANAL` lo fija el build (`npm run build:pwa:alfa`) y
 * Metro lo escribe en el código al construir.
 */
export const ES_ALFA = process.env.EXPO_PUBLIC_CANAL === 'alfa';

/** Archivo de la base SQLite (en el OPFS del origen). */
export const NOMBRE_BD = ES_ALFA ? 'ancla-alfa.db' : 'memory-trainer.db';

/** Base de IndexedDB con las copias automáticas. */
export const NOMBRE_IDB_COPIAS = ES_ALFA ? 'ancla-alfa-copias' : 'ancla-copias';
