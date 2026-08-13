import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotonesCalificacion } from '../../src/components/BotonesCalificacion';
import { Flashcard } from '../../src/components/Flashcard';
import { PausaVisualizacion } from '../../src/components/PausaVisualizacion';
import { obtenerBD } from '../../src/db/client';
import {
  armarSesionDeMazo,
  calificarTarjeta,
  cerrarSesion,
  crearSesion,
  listarTarjetasPorMazo,
  obtenerMazoPorCategoria,
} from '../../src/db/repository';
import type { ConexionBD } from '../../src/db/tipos';
import { descomponer } from '../../src/domain/numeros/descomposicion';
import type { Calificacion } from '../../src/domain/fsrs/scheduler';
import { useSesionStore } from '../../src/stores/sesion';

function formatearDescomposicion(digitos: string, mapa: Map<number, string>): string {
  return descomponer(digitos, (valor) => mapa.get(valor))
    .map((t) => `${t.digitos}→${t.palabra ?? 'sin colgadero'}`)
    .join(' · ');
}

/**
 * Modo de repaso de Números Importantes (05-numeros.md §3): etiqueta → dígitos,
 * calificado con los 4 niveles FSRS. Tras revelar se muestra siempre la
 * descomposición — el usuario no memoriza dígitos, memoriza la cadena de
 * imágenes (§3: "ese recordatorio es el módulo").
 */
export default function NumerosRepasar() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [mapaColgadero, setMapaColgadero] = useState<Map<number, string>>(new Map());

  const { tarjetas, sesionId, indice, revelada, aciertos, fallos, iniciar, revelar, avanzar, reiniciar } =
    useSesionStore();

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazoColgadero = await obtenerMazoPorCategoria(conexion, 'colgadero');
        const tarjetasColgadero = mazoColgadero ? await listarTarjetasPorMazo(conexion, mazoColgadero.id) : [];
        const mazoNumero = await obtenerMazoPorCategoria(conexion, 'numero');
        if (!mazoNumero) throw new Error('No existe el mazo numero — falta correr la migración 004');
        const ahora = new Date();
        const seleccion = await armarSesionDeMazo(conexion, mazoNumero.id, { ahora, tope: 20 });
        const sesion = await crearSesion(conexion, { modo: 'numeros-repasar' }, ahora);
        if (!cancelado) {
          setDb(conexion);
          setMapaColgadero(new Map(tarjetasColgadero.map((t) => [Number(t.contenido_frente), t.contenido_reverso])));
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
        <Text style={estilos.texto}>No hay números pendientes de repaso.</Text>
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

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.progreso}>
        {indice + 1} / {tarjetas.length}
      </Text>
      <Flashcard
        frente={actual.contenido_frente}
        reverso={actual.contenido_reverso}
        revelada={revelada}
        explicacion={revelada ? formatearDescomposicion(actual.contenido_reverso, mapaColgadero) : undefined}
      />
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
  contenedor: { flex: 1, backgroundColor: '#1e1e2e', justifyContent: 'center', gap: 24 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
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
  textoRevelar: { color: '#1e1e2e', fontWeight: '600' },
});
