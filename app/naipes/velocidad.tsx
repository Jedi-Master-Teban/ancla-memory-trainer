import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Flashcard } from '../../src/components/Flashcard';
import { obtenerBD } from '../../src/db/client';
import {
  armarSesionDeMazo,
  calificarTarjeta,
  cerrarSesion,
  crearSesion,
  obtenerMazoPorCategoria,
} from '../../src/db/repository';
import type { ConexionBD } from '../../src/db/tipos';
import { useSesionStore } from '../../src/stores/sesion';

/** Serie cronometrada, sin pausa. Autoevalúa en 2 niveles (§8.2, no cambia sin ADR). */
export default function NaipesVelocidad() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [inicioMs] = useState(() => Date.now());
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  const { tarjetas, sesionId, indice, revelada, aciertos, fallos, iniciar, revelar, avanzar, reiniciar } =
    useSesionStore();

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'naipe');
        if (!mazo) throw new Error('No hay mazo naipe sembrado todavía');
        const ahora = new Date();
        const seleccion = await armarSesionDeMazo(conexion, mazo.id, { ahora, tope: 20 });
        const sesion = await crearSesion(conexion, { modo: 'naipes-velocidad' }, ahora);
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
    if (indice >= tarjetas.length && tarjetas.length > 0) return;
    const id = setInterval(() => setAhoraMs(Date.now()), 200);
    return () => clearInterval(id);
  }, [indice, tarjetas.length]);

  useEffect(() => {
    if (db && sesionId && tarjetas.length > 0 && indice >= tarjetas.length) {
      const duracionSegundos = Math.round((Date.now() - inicioMs) / 1000);
      cerrarSesion(db, { sesionId, duracionSegundos, aciertos, fallos }, new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  async function onAutoevaluar(acerte: boolean) {
    if (!db || !sesionId) return;
    const actual = tarjetas[indice];
    const calificacion = acerte ? 'bien' : 'otra_vez';
    await calificarTarjeta(db, { tarjetaId: actual.id, sesionId, calificacion }, new Date());
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
        <Text style={estilos.texto}>No hay cartas pendientes.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (indice >= tarjetas.length) {
    const totalSegundos = Math.round((ahoraMs - inicioMs) / 1000);
    const promedioSegundos = tarjetas.length > 0 ? totalSegundos / tarjetas.length : 0;
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>Sesión completa</Text>
        <Text style={estilos.texto}>
          {aciertos} aciertos · {fallos} fallos
        </Text>
        <Text style={estilos.texto}>
          {totalSegundos}s totales · {promedioSegundos.toFixed(1)}s por carta
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const actual = tarjetas[indice];
  const transcurridoSegundos = Math.round((ahoraMs - inicioMs) / 1000);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.cronometro}>{transcurridoSegundos}s</Text>
      <Text style={estilos.progreso}>
        {indice + 1} / {tarjetas.length}
      </Text>
      <Flashcard frente={actual.contenido_frente} reverso={actual.contenido_reverso} revelada={revelada} />
      {!revelada ? (
        <Pressable onPress={revelar} style={estilos.botonRevelar}>
          <Text style={estilos.textoRevelar}>Ver respuesta</Text>
        </Pressable>
      ) : (
        <View style={estilos.filaAutoeval}>
          <Pressable onPress={() => onAutoevaluar(false)} style={[estilos.botonAutoeval, estilos.fallo]}>
            <Text style={estilos.textoRevelar}>Fallé</Text>
          </Pressable>
          <Pressable onPress={() => onAutoevaluar(true)} style={[estilos.botonAutoeval, estilos.acierto]}>
            <Text style={estilos.textoRevelar}>Acerté</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e', justifyContent: 'center', gap: 16 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  cronometro: { color: '#f9e2af', textAlign: 'center', fontSize: 20, fontWeight: '600' },
  progreso: { color: '#a6adc8', textAlign: 'center' },
  titulo: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  texto: { color: '#a6adc8' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  enlace: { color: '#89b4fa', marginTop: 12 },
  botonRevelar: {
    alignSelf: 'center',
    backgroundColor: '#89b4fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  filaAutoeval: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  botonAutoeval: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  fallo: { backgroundColor: '#f38ba8' },
  acierto: { backgroundColor: '#a6e3a1' },
  textoRevelar: { color: '#1e1e2e', fontWeight: '600' },
});
