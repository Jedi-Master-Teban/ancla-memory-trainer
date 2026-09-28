import { Platform } from 'react-native';

/**
 * Avisos de la app a la pantalla de arranque de la PWA (ADR-030).
 *
 * Esa pantalla vive en `pwa/arranque/` y el build la mete en `index.html` como
 * HTML y CSS puros: aparece en el primer instante, antes que el JavaScript de
 * la app, y es lo único que puede mostrarse si ese JavaScript no llega (una
 * versión vieja en caché, sin conexión, un error al arrancar). Antes, esos
 * casos dejaban la pantalla en blanco.
 *
 * La app le cuenta por dónde va con eventos del documento; ella mueve la barra
 * y se retira al recibir `lista`. En nativo no existe, y esto no hace nada.
 */
export type EtapaArranque = 'app' | 'datos' | 'lista';

function emitir(nombre: string, detalle: Record<string, string>): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(nombre, { detail: detalle }));
}

export function senalarArranque(etapa: EtapaArranque): void {
  emitir('ancla:arranque', { etapa });
}

/** Pasa la pantalla de arranque a su estado de error, con el detalle técnico plegado. */
export function senalarErrorDeArranque(titulo: string, texto: string, detalle: string): void {
  emitir('ancla:error', { titulo, texto, detalle });
}
