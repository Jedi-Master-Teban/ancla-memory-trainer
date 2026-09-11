import { router } from 'expo-router';
import { useEffect, useRef, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { BotonesCalificacion } from '../../src/components/BotonesCalificacion';
import { Flashcard } from '../../src/components/Flashcard';
import { PausaVisualizacion } from '../../src/components/PausaVisualizacion';
import { TramosProgreso } from '../../src/components/TramosProgreso';
import { obtenerBD } from '../../src/db/client';
import {
  armarSesionDeMazo,
  calcularRachaActual,
  calificarTarjeta,
  cerrarSesion,
  crearSesion,
  obtenerConfigRacha,
  obtenerDiaPractica,
  obtenerMazoPorCategoria,
} from '../../src/db/repository';
import type { ConexionBD } from '../../src/db/tipos';
import { explicar } from '../../src/domain/fonetica/decodificador';
import { fechaLocal } from '../../src/domain/racha/calculo';
import { intervalosPrevistos } from '../../src/domain/fsrs/preview';
import { filaTarjetaACardInput, type Calificacion } from '../../src/domain/fsrs/scheduler';
import { useSesionStore } from '../../src/stores/sesion';
import { useTema } from '../../src/stores/tema';
import type { TokensColor } from '../../src/tema/colores';

export default function ColgaderoFlash() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);

  const { tarjetas, sesionId, indice, revelada, aciertos, fallos, iniciar, revelar, avanzar, reiniciar } =
    useSesionStore();
  const terminadaRef = useRef(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'colgadero');
        if (!mazo) throw new Error('No hay mazo colgadero sembrado');
        const ahora = new Date();
        const seleccion = await armarSesionDeMazo(conexion, mazo.id, { ahora, tope: 20 });
        const sesion = await crearSesion(conexion, { modo: 'flash' }, ahora);
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
    if (db && sesionId && tarjetas.length > 0 && indice >= tarjetas.length && !terminadaRef.current) {
      terminadaRef.current = true;
      (async () => {
        const ahora = new Date();
        await cerrarSesion(db, { sesionId, duracionSegundos: 0, aciertos, fallos }, ahora);
        const [rachaActualizada, configRacha, dia] = await Promise.all([
          calcularRachaActual(db, ahora),
          obtenerConfigRacha(db),
          obtenerDiaPractica(db, fechaLocal(ahora)),
        ]);
        router.replace({
          pathname: '/resumen-sesion',
          params: {
            racha: String(rachaActualizada.diasConsecutivos),
            aciertos: String(aciertos),
            fallos: String(fallos),
            metaCumplida: (dia?.tarjetas_revisadas ?? 0) >= (configRacha.meta_diaria ?? 20) ? '1' : '0',
          },
        });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  async function onCalificar(calificacion: Calificacion) {
    if (!db || !sesionId) return;
    const actual = tarjetas[indice];
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
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>Sesión completa</Text>
        <Text style={estilos.texto}>
          {aciertos} aciertos · {fallos} fallos
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const actual = tarjetas[indice];
  const intervalos = intervalosPrevistos(filaTarjetaACardInput(actual), new Date());

  return (
    <>
      <HeaderFlotante
        titulo="Fonética Flash"
        volverA="/colgadero"
        derecha={
          <Text style={estilos.progresoChico}>
            {indice + 1}/{tarjetas.length}
          </Text>
        }
      />
      <View style={estilos.tramos}>
        <TramosProgreso total={tarjetas.length} indice={indice} />
      </View>
      <View style={estilos.contenedor}>
        <Flashcard
          frente={actual.contenido_frente}
          reverso={actual.contenido_reverso}
          revelada={revelada}
          explicacion={revelada ? explicar(actual.contenido_reverso) : undefined}
        />
        {!revelada ? (
          <PausaVisualizacion clave={actual.id}>
            <Pressable onPress={revelar} style={estilos.botonRevelar}>
              <Text style={estilos.textoRevelar}>Ver respuesta</Text>
            </Pressable>
          </PausaVisualizacion>
        ) : (
          <BotonesCalificacion onCalificar={onCalificar} intervalos={intervalos} />
        )}
      </View>
    </>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  // Los tramos van pegados al header, fuera del contenedor centrado.
  tramos: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10 },
  contenedor: { flex: 1, backgroundColor: t.bg, justifyContent: 'center', gap: 24 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  progreso: { color: t.inkMuted, textAlign: 'center' },
  progresoChico: { color: t.inkMuted, fontSize: 12, fontWeight: '600' },
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
  textoRevelar: { color: t.inkOnAccent, fontWeight: '600' },
});
