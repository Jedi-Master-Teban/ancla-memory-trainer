import { Platform } from 'react-native';

/**
 * Protección del almacenamiento del navegador (ADR-029).
 *
 * Sin pedirla, el almacenamiento de un sitio es «best effort»: el navegador
 * puede borrarlo cuando le falta espacio. `navigator.storage.persist()` le
 * pide que no lo haga; en Safari la concesión depende de sus heurísticas, y
 * una app de pantalla de inicio tiene más probabilidades de obtenerla.
 */
export type EstadoProteccion = 'protegido' | 'sin-proteccion' | 'no-disponible';

function gestor(): StorageManager | null {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.storage) return null;
  return navigator.storage;
}

/** Se llama en cada arranque: si ya estaba concedida, no pregunta de nuevo. */
export async function pedirProteccion(): Promise<EstadoProteccion> {
  const storage = gestor();
  if (!storage?.persist || !storage.persisted) return 'no-disponible';
  try {
    if (await storage.persisted()) return 'protegido';
    return (await storage.persist()) ? 'protegido' : 'sin-proteccion';
  } catch {
    return 'no-disponible';
  }
}

export async function estadoProteccion(): Promise<EstadoProteccion> {
  const storage = gestor();
  if (!storage?.persisted) return 'no-disponible';
  try {
    return (await storage.persisted()) ? 'protegido' : 'sin-proteccion';
  } catch {
    return 'no-disponible';
  }
}
