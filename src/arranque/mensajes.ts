/** Qué decirle al usuario cuando la base de datos no abre (ADR-030). Lógica pura. */
export interface MensajeDeError {
  titulo: string;
  texto: string;
}

/**
 * Traduce el error técnico a algo accionable. Los dos casos conocidos:
 *
 * - `UnknownError … transient reason`: Safari negó el almacenamiento (OPFS).
 *   Pasa en navegación privada, y en los perfiles efímeros de las pruebas de
 *   WebKit, donde se descubrió (ADR-032).
 * - `NoModificationAllowedError`: los archivos de la base están tomados por
 *   otra instancia de la app: una segunda pestaña, o la versión anterior
 *   todavía cerrándose tras una actualización.
 */
export function mensajeDeErrorDeDatos(error: string): MensajeDeError {
  if (/UnknownError|transient reason/i.test(error)) {
    return {
      titulo: 'Safari no dejó guardar tus datos',
      texto:
        'Ancla guarda tu progreso en este teléfono, y Safari no lo permite en navegación privada. ' +
        'Ábrela en una pestaña normal o desde su ícono en la pantalla de inicio.',
    };
  }
  if (/NoModificationAllowedError/i.test(error)) {
    return {
      titulo: 'No pude abrir tus datos',
      texto: 'Parece que Ancla está abierta en otra pestaña. Ciérrala y vuelve a intentarlo. Tus datos no se borran por esto.',
    };
  }
  return {
    titulo: 'No pude abrir tus datos',
    texto: 'Tus datos no se borran por esto. Vuelve a intentarlo en un momento.',
  };
}
