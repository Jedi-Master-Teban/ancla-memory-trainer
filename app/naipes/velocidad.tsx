import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { CartaVisual } from '../../src/components/CartaVisual';
import { obtenerBD } from '../../src/db/client';
import {
  armarSesionDeMazo,
  calificarTarjeta,
  cerrarSesion,
  crearSesion,
  obtenerMazoPorCategoria,
} from '../../src/db/repository';
import type { ConexionBD, MetadataNaipe } from '../../src/db/tipos';
import { useSesionStore } from '../../src/stores/sesion';
import { useTema } from '../../src/stores/tema';

/** Serie cronometrada, sin pausa. Autoevalúa en 2 niveles (§8.2, no cambia sin ADR). */
export default function NaipesVelocidad() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [inicioMs] = useState(() => Date.now());
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

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
      <View  style={[estilos.centro, { backgroundColor: t.bg }]}>
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
    const totalSegundos = Math.round((ahoraMs - inicioMs) / 1000);
    const promedioSegundos = tarjetas.length > 0 ? totalSegundos / tarjetas.length : 0;
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.titulo, { color: t.ink }]}>Sesión completa</Text>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>
          {aciertos} aciertos · {fallos} fallos
        </Text>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>
          {totalSegundos}s totales · {promedioSegundos.toFixed(1)}s por carta
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[estilos.enlace, { color: t.accent1 }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const actual = tarjetas[indice];
  const { palo, valor } = JSON.parse(actual.metadata_categoria) as MetadataNaipe;
  const transcurridoSegundos = Math.round((ahoraMs - inicioMs) / 1000);

  return (
    <>
      <HeaderFlotante titulo="Velocidad" volverA="/naipes" />
      <View style={[estilos.contenedor, { backgroundColor: t.bg }]}>
        <Text style={[estilos.cronometro, { color: t.accent4 }]}>{transcurridoSegundos}s</Text>
        <Text style={[estilos.progreso, { color: t.inkMuted }]}>
          {indice + 1} / {tarjetas.length}
        </Text>
        <View style={estilos.centroCarta}>
          <CartaVisual key={actual.id} carta={{ palo, valor }} palabra={actual.contenido_reverso} revelada={revelada} />
        </View>
        {!revelada ? (
          <Pressable onPress={revelar} style={[estilos.botonRevelar, { backgroundColor: t.accent1 }]}>
            <Text style={[estilos.textoRevelar, { color: t.inkOnAccent }]}>Ver respuesta</Text>
          </Pressable>
        ) : (
          <View style={estilos.filaAutoeval}>
            <Pressable onPress={() => onAutoevaluar(false)} style={[estilos.botonAutoeval, { backgroundColor: t.otraVez }]}>
              <Text style={[estilos.textoRevelar, { color: t.inkOnAccent }]}>Fallé</Text>
            </Pressable>
            <Pressable onPress={() => onAutoevaluar(true)} style={[estilos.botonAutoeval, { backgroundColor: t.bien }]}>
              <Text style={[estilos.textoRevelar, { color: t.inkOnAccent }]}>Acerté</Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', gap: 16 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centroCarta: { alignItems: 'center' },
  cronometro: { textAlign: 'center', fontSize: 20, fontWeight: '600' },
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
  filaAutoeval: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  botonAutoeval: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  textoRevelar: { fontWeight: '600' },
});
