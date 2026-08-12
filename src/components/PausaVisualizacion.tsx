import { useEffect, useState, type ReactNode } from 'react';

const DURACION_MS = 2000;

interface Props {
  /** Cambia por tarjeta (p. ej. el id) — reinicia la pausa. */
  clave: string | number;
  children: ReactNode;
}

/**
 * Pausa deliberada de visualización mental (§10, modulos/02-colgadero.md §2):
 * no renderiza los hijos (el botón "Ver respuesta") hasta pasados ~2s desde
 * que cambió `clave`. No es decoración: fuerza el recuerdo activo.
 */
export function PausaVisualizacion({ clave, children }: Props) {
  const [lista, setLista] = useState(false);

  useEffect(() => {
    setLista(false);
    const id = setTimeout(() => setLista(true), DURACION_MS);
    return () => clearTimeout(id);
  }, [clave]);

  if (!lista) return null;
  return <>{children}</>;
}
