import { Redirect } from 'expo-router';

/**
 * La racha ahora vive dentro de Progreso (`/estadisticas`): era el mismo
 * progreso en dos pantallas. Esta ruta se queda para que los enlaces y los
 * accesos guardados de antes sigan funcionando.
 */
export default function Racha() {
  return <Redirect href="/estadisticas" />;
}
