import { create } from 'zustand';

/**
 * Diálogos propios de la app (ADR-029): sustituyen a `Alert.alert`, que en
 * react-native-web es una función vacía (`static alert() {}`). En la PWA eso
 * dejaba mudos los tres botones de eliminar —la eliminación iba dentro del
 * botón de confirmar, que nunca aparecía— y ocultaba tres mensajes de error.
 *
 * `confirmar`/`avisar` devuelven una promesa; `DialogoHost` los pinta en Soft
 * UI. Si llegan varios a la vez, se muestran en orden.
 */

export type EstiloBoton = 'principal' | 'destructivo' | 'secundario';

export interface BotonDialogo {
  texto: string;
  estilo?: EstiloBoton;
  /** Lo que resuelve la promesa del diálogo al pulsarlo. */
  valor: boolean;
  /**
   * Se ejecuta DENTRO del toque, antes de cerrar. Para lo que iOS solo permite
   * durante un gesto del usuario: compartir un archivo o abrir el selector.
   */
  alPulsar?: () => void;
}

export interface PeticionDialogo {
  id: number;
  titulo: string;
  mensaje?: string;
  botones: BotonDialogo[];
  resolver: (valor: boolean) => void;
}

interface EstadoDialogo {
  cola: PeticionDialogo[];
  abrir(peticion: Omit<PeticionDialogo, 'id' | 'resolver'>): Promise<boolean>;
  responder(valor: boolean): void;
}

let siguienteId = 1;

export const useDialogoStore = create<EstadoDialogo>((set, get) => ({
  cola: [],
  abrir: (peticion) =>
    new Promise<boolean>((resolver) => {
      set((estado) => ({ cola: [...estado.cola, { ...peticion, id: siguienteId++, resolver }] }));
    }),
  responder: (valor) => {
    const [actual, ...resto] = get().cola;
    if (!actual) return;
    set({ cola: resto });
    actual.resolver(valor);
  },
}));

export function confirmar(opciones: {
  titulo: string;
  mensaje?: string;
  accion: string;
  destructiva?: boolean;
  cancelar?: string;
}): Promise<boolean> {
  return useDialogoStore.getState().abrir({
    titulo: opciones.titulo,
    mensaje: opciones.mensaje,
    botones: [
      { texto: opciones.cancelar ?? 'Cancelar', estilo: 'secundario', valor: false },
      { texto: opciones.accion, estilo: opciones.destructiva ? 'destructivo' : 'principal', valor: true },
    ],
  });
}

export async function avisar(opciones: { titulo: string; mensaje?: string; boton?: string }): Promise<void> {
  await useDialogoStore.getState().abrir({
    titulo: opciones.titulo,
    mensaje: opciones.mensaje,
    botones: [{ texto: opciones.boton ?? 'Entendido', estilo: 'principal', valor: true }],
  });
}

export function preguntar(opciones: { titulo: string; mensaje?: string; botones: BotonDialogo[] }): Promise<boolean> {
  return useDialogoStore.getState().abrir(opciones);
}
