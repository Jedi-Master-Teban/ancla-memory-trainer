import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotonesCalificacion } from '../../src/components/BotonesCalificacion';
import { CartaVisual } from '../../src/components/CartaVisual';
import { PausaVisualizacion } from '../../src/components/PausaVisualizacion';
import { obtenerBD } from '../../src/db/client';
import {
  armarSesionDeMazo,
  calificarTarjeta,
  cerrarSesion,
  crearSesion,
  obtenerMazoPorCategoria,
} from '../../src/db/repository';
import type { ConexionBD, MetadataNaipe } from '../../src/db/tipos';
import type { Calificacion } from '../../src/domain/fsrs/scheduler';
import { useSesionStore } from '../../src/stores/sesion';
import { useTema } from '../../src/stores/tema';

/** Palabra → carta. Misma tarjeta que Flash, direccion='inversa'. Orden invertido a propósito: la palabra se muestra primero, la carta aparece al voltear (CartaVisual disenoAlFrente=false). */
export default function NaipesReverso() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);

  const { tarjetas, sesionId, indice, revelada, aciertos, fallos, iniciar, revelar, avanzar, reiniciar } =
    useSesionStore();
  const { colores: t } = useTema();

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'naipe');
        if (!mazo) throw new Error('No hay mazo naipe sembrado todavía');
        const ahora = new Date();
        const seleccion = await armarSesionDeMazo(conexion, mazo.id, { ahora, tope: 20 });
        const sesion = await crearSesion(conexion, { modo: 'naipes-reverso' }, ahora);
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

  async function onCalificar(calificacion: Calificacion) {
    if (!db || !sesionId) return;
    const actual = tarjetas[indice];
    await calificarTarjeta(db, { tarjetaId: actual.id, sesionId, calificacion, direccion: 'inversa' }, new Date());
    avanzar(calificacion);
  }

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.error, { color: t.otraVez }]}>Error: {error}</Text>
      </View>
    );
  }

  if (tarjetas.length === 0) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>No hay cartas pendientes.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[estilos.enlace, { color: t.accent1 }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (indice >= tarjetas.length) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.titulo, { color: t.ink }]}>Sesión completa</Text>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>
          {aciertos} aciertos · {fallos} fallos
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[estilos.enlace, { color: t.accent1 }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const actual = tarjetas[indice];
  const { palo, valor } = JSON.parse(actual.metadata_categoria) as MetadataNaipe;

  return (
    <View style={[estilos.contenedor, { backgroundColor: t.bg }]}>
      <Text style={[estilos.progreso, { color: t.inkMuted }]}>
        {indice + 1} / {tarjetas.length}
      </Text>
      <View style={estilos.centroCarta}>
        <CartaVisual
          key={actual.id}
          carta={{ palo, valor }}
          palabra={actual.contenido_reverso}
          revelada={revelada}
          disenoAlFrente={false}
        />
      </View>
      {!revelada ? (
        <PausaVisualizacion clave={actual.id}>
          <Pressable onPress={revelar} style={[estilos.botonRevelar, { backgroundColor: t.accent1 }]}>
            <Text style={[estilos.textoRevelar, { color: t.inkOnAccent }]}>Ver respuesta</Text>
          </Pressable>
        </PausaVisualizacion>
      ) : (
        <BotonesCalificacion onCalificar={onCalificar} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', gap: 24 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centroCarta: { alignItems: 'center' },
  progreso: { textAlign: 'center' },
  titulo: { fontSize: 20, fontWeight: '600' },
  texto: {},
  error: { padding: 24, textAlign: 'center' },
  enlace: { marginTop: 12 },
  botonRevelar: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoRevelar: { fontWeight: '600' },
});
