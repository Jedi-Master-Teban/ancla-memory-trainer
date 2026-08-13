import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotonesCalificacion } from '../src/components/BotonesCalificacion';
import { Flashcard } from '../src/components/Flashcard';
import { PausaVisualizacion } from '../src/components/PausaVisualizacion';
import { obtenerBD } from '../src/db/client';
import { cerrarSesion, crearSesion, listarMazos, listarTarjetasPorMazo } from '../src/db/repository';
import type { ConexionBD } from '../src/db/tipos';
import { barajar } from '../src/domain/aleatorio';
import type { Calificacion } from '../src/domain/fsrs/scheduler';
import { TOPE_POR_DEFECTO } from '../src/domain/sesion/motor';
import { useSesionStore } from '../src/stores/sesion';

/**
 * "Todo al día" (09-dashboard.md §4): repaso sin impacto en el scheduling
 * FSRS. Estructuralmente separada de practicar.tsx (no un flag de modo) para
 * que sea IMPOSIBLE, no solo evitado, llamar `calificarTarjeta` aquí:
 * `onCalificar` solo toca el store local, nunca el repositorio de tarjetas
 * — así ni fsrs_state ni la racha se mueven un milímetro.
 */
export default function PracticaLibre() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);

  const { tarjetas, sesionId, indice, revelada, aciertos, fallos, iniciar, revelar, avanzar, reiniciar } =
    useSesionStore();

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazos = await listarMazos(conexion);
        const listas = await Promise.all(mazos.map((m) => listarTarjetasPorMazo(conexion, m.id)));
        const seleccion = barajar(listas.flat()).slice(0, TOPE_POR_DEFECTO);
        const sesion = await crearSesion(conexion, { modo: 'practica_libre' }, new Date());
        if (!cancelado) {
          setDb(conexion);
          iniciar(seleccion, sesion.id);
          setCargando(false);
        }
      } catch (e) {
        if (!cancelado) {
          setError(String(e));
          setCargando(false);
        }
      }
    })();
    return () => {
      cancelado = true;
      reiniciar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (db && sesionId && tarjetas.length > 0 && indice >= tarjetas.length) {
      cerrarSesion(db, { sesionId, duracionSegundos: 0, aciertos, fallos }, new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  function onCalificar(calificacion: Calificacion) {
    avanzar(calificacion);
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
      </View>
    );
  }

  if (tarjetas.length === 0) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.texto}>Todavía no hay ninguna tarjeta creada.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (indice >= tarjetas.length) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>Práctica libre completa</Text>
        <Text style={estilos.texto}>
          {aciertos} aciertos · {fallos} fallos — no afecta tu racha ni tus repasos programados
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const actual = tarjetas[indice];

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.progreso}>
        {indice + 1} / {tarjetas.length} · práctica libre
      </Text>
      <Flashcard frente={actual.contenido_frente} reverso={actual.contenido_reverso} revelada={revelada} />
      {!revelada ? (
        <PausaVisualizacion clave={actual.id}>
          <Pressable onPress={revelar} style={estilos.botonRevelar}>
            <Text style={estilos.textoRevelar}>Ver respuesta</Text>
          </Pressable>
        </PausaVisualizacion>
      ) : (
        <BotonesCalificacion onCalificar={onCalificar} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e', justifyContent: 'center', gap: 12 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  progreso: { color: '#a6adc8', textAlign: 'center' },
  titulo: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  texto: { color: '#a6adc8', textAlign: 'center', paddingHorizontal: 24 },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  enlace: { color: '#89b4fa', marginTop: 12 },
  botonRevelar: {
    alignSelf: 'center',
    backgroundColor: '#89b4fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoRevelar: { color: '#1e1e2e', fontWeight: '600' },
});
