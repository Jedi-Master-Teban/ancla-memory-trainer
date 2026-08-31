/**
 * Sanitización de entrada de dígitos con separador decimal opcional.
 *
 * Es el mecanismo común para todos los campos de números con decimales
 * (π-100, φ, e, √2 y otras constantes). La BD almacena TEXTO (string),
 * nunca un float, así precisión arbitraria sin corte IEEE.
 *
 * Decisión de UX i18n: iOS `decimal-pad` muestra COMA en locales es-MX/es-ES
 * pero PUNTO en en-US — además, la coma no aparece en `number-pad` puro.
 * Para evitar depender del locale o el teclado:
 *   - Acepta indistintamente `.` o `,` en la entrada
 *   - Normaliza a `.` en el valor guardado
 *   - Solo UN separador decimal (el primero gana; los demás se ignoran)
 *   - No permite signos, notación científica, ni espacios
 *
 * Teclado recomendado en UI: `keyboardType="decimal-pad"`. En iOS nativo y
 * Android expone el separador (punto o coma según locale). En web/PWA RN lo
 * traduce a `inputmode="decimal"`, igualmente numérico con decimal. El
 * sanitizador acepta ambos indistintamente — el locale no importa.
 */

/**
 * Sanitiza entrada de dígitos con un separador decimal opcional.
 *
 * Ejemplos válidos → resultado:
 *   "3.14159"       → "3.14159"
 *   "3,14159"       → "3.14159"  (coma normalizada a punto)
 *   "3.1.4"         → "3.14"     (segundo punto eliminado)
 *   "abc3.14xyz"    → "3.14"     (basura eliminada)
 *   ".1415"         → ".1415"    (punto inicial válido: sesión de dígitos pura)
 *   "314159"        → "314159"   (sin separador: también válido)
 *
 * @param texto Entrada cruda del TextInput
 * @returns Cadena limpia con a lo sumo un punto
 */
export function sanitizarDigitosConDecimal(texto: string): string {
  // 1. Normalizar coma a punto antes de filtrar
  const conPunto = texto.replace(/,/g, '.');
  // 2. Dejar solo dígitos y puntos
  const soloDigitosYPuntos = conPunto.replace(/[^0-9.]/g, '');
  // 3. Conservar SOLO el primer punto; los demás desaparecen
  const primerPunto = soloDigitosYPuntos.indexOf('.');
  if (primerPunto === -1) return soloDigitosYPuntos;
  return (
    soloDigitosYPuntos.slice(0, primerPunto + 1) +
    soloDigitosYPuntos.slice(primerPunto + 1).replace(/\./g, '')
  );
}
