import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

const DURACION_MS = 2000;

interface Props {
  /** Cambia por tarjeta (p. ej. el id) — reinicia la pausa. */
  clave: string | number;
  children: ReactNode;
}

/**
 * Pausa deliberada de visualización mental (§10, modulos/02-colgadero.md §2):
 * oculta los hijos (el botón "Ver respuesta") hasta pasados ~2s desde que
 * cambió `clave`. No es decoración: fuerza el recuerdo activo.
 *
 * Durante la pausa se mantienen montados pero invisibles (`opacity: 0` +
 * `pointerEvents="none"`) en vez de devolver `null`. Devolver `null` no creaba
 * vista alguna, así que el `gap` del contenedor centrado también desaparecía y
 * la columna daba dos saltos por tarjeta: uno al avanzar y otro al aparecer el
 * botón. Ocupar el espacio desde el principio lo elimina, sin debilitar la
 * pausa: el botón sigue sin poder tocarse antes de tiempo.
 */
export function PausaVisualizacion({ clave, children }: Props) {
  const [lista, setLista] = useState(false);

  useEffect(() => {
    setLista(false);
    const id = setTimeout(() => setLista(true), DURACION_MS);
    return () => clearTimeout(id);
  }, [clave]);

  return (
    <View style={{ opacity: lista ? 1 : 0 }} pointerEvents={lista ? 'auto' : 'none'}>
      {children}
    </View>
  );
}
