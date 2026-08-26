/**
 * Barajado genérico (Fisher-Yates), compartido entre módulos de dominio que
 * necesitan presentación aleatoria: sesión de colgadero (ADR-015) y Baraja
 * Completa de naipes (modulos/03-naipes.md §4). No vive en ninguno de los dos
 * para no acoplar un área del dominio a otra por una utilidad genérica.
 */
export function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
