import { router } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { Flashcard } from '../../src/components/Flashcard';
import { explicar } from '../../src/domain/fonetica/decodificador';
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
import { useTema } from '../../src/stores/tema';
import type { TokensColor } from '../../src/tema/colores';

/**
 * Modo Velocidad: serie cronometrada, sin pausa de visualización. Autoevalúa
 * en 2 niveles, no 4 — un acierto cuenta "Bien", un fallo cuenta "Otra vez"
 * (modulos/02-colgadero.md §2, regla explícita — no cambiar sin ADR).
 */
export default function ColgaderoVelocidad() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
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
        const mazo = await obtenerMazoPorCategoria(conexion, 'colgadero');
        if (!mazo) throw new Error('No hay mazo colgadero sembrado');
        const ahora = new Date();
        const seleccion = await armarSesionDeMazo(conexion, mazo.id, { ahora, tope: 20 });
        const sesion = await crearSesion(conexion, { modo: 'velocidad' }, ahora);
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
        <ActivityIndicator color={t.ink} />
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
        <Text style={estilos.texto}>No hay tarjetas pendientes.</Text>
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
          {totalSegundos}s totales · {promedioSegundos.toFixed(1)}s por tarjeta
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
    <>
      <HeaderFlotante titulo="Velocidad" volverA="/colgadero" />
      <View style={estilos.contenedor}>
        <Text style={estilos.cronometro}>{transcurridoSegundos}s</Text>
        <Text style={estilos.progreso}>
          {indice + 1} / {tarjetas.length}
        </Text>
        <Flashcard
          frente={actual.contenido_frente}
          reverso={actual.contenido_reverso}
          revelada={revelada}
          explicacion={revelada ? explicar(actual.contenido_reverso) : undefined}
        />
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
    </>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: t.bg, justifyContent: 'center', gap: 16 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cronometro: { color: t.dificil, textAlign: 'center', fontSize: 20, fontWeight: '600' },
  progreso: { color: t.inkMuted, textAlign: 'center' },
  titulo: { color: t.ink, fontSize: 20, fontWeight: '600' },
  texto: { color: t.inkMuted },
  error: { color: t.otraVez, padding: 24, textAlign: 'center' },
  enlace: { color: t.accent1, marginTop: 12 },
  botonRevelar: {
    alignSelf: 'center',
    backgroundColor: t.accent1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  filaAutoeval: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  botonAutoeval: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  fallo: { backgroundColor: t.otraVez },
  acierto: { backgroundColor: t.bien },
  textoRevelar: { color: t.inkOnAccent, fontWeight: '600' },
});
