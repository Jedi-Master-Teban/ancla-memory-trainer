import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../src/components/HeaderFlotante';
import { BotonesCalificacion } from '../src/components/BotonesCalificacion';
import { CartaVisual } from '../src/components/CartaVisual';
import { Flashcard } from '../src/components/Flashcard';
import { PausaVisualizacion } from '../src/components/PausaVisualizacion';
import { obtenerBD } from '../src/db/client';
import { armarSesionMixta, calificarTarjeta, cerrarSesion, crearSesion } from '../src/db/repository';
import type { Categoria, ConexionBD, MetadataNaipe } from '../src/db/tipos';
import type { Calificacion } from '../src/domain/fsrs/scheduler';
import { useSesionStore } from '../src/stores/sesion';

const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  colgadero: 'Colgadero',
  naipe: 'Naipes',
  lista_item: 'Lista',
  numero: 'Número',
};

/**
 * Sesión mixta priorizada (§8.9): igual que colgadero/reverso.tsx, pero
 * `armarSesionMixta` reparte entre categorías. Sin `explicar()` — es propio
 * de la fonética de colgadero, no de una tarjeta mezclada de cualquier tipo.
 * Insignia de categoría porque, a diferencia de cada pantalla de una sola
 * categoría, aquí sí hace falta saber en qué "mundo" está cada tarjeta.
 */
export default function Practicar() {
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
        const ahora = new Date();
        const seleccion = await armarSesionMixta(conexion, ahora);
        const sesion = await crearSesion(conexion, { modo: 'mixta' }, ahora);
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
    await calificarTarjeta(db, { tarjetaId: actual.id, sesionId, calificacion }, new Date());
    avanzar(calificacion);
  }

  if (cargando) {
    return (
      <View  style={estilos.centro}>
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

  return (
    <>
      <HeaderFlotante titulo="Practicar" volverA="/" />
      <View style={estilos.contenedor}>
        <Text style={estilos.progreso}>
          {indice + 1} / {tarjetas.length}
        </Text>
        <Text style={estilos.insignia}>{ETIQUETA_CATEGORIA[actual.categoria]}</Text>
        {actual.categoria === 'naipe' ? (
          <View style={estilos.centroCarta}>
            <CartaVisual
              key={actual.id}
              carta={JSON.parse(actual.metadata_categoria) as MetadataNaipe}
              palabra={actual.contenido_reverso}
              revelada={revelada}
            />
          </View>
        ) : (
          <Flashcard frente={actual.contenido_frente} reverso={actual.contenido_reverso} revelada={revelada} />
        )}
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
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e', justifyContent: 'center', gap: 12 },
  centroCarta: { alignItems: 'center' },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  progreso: { color: '#a6adc8', textAlign: 'center' },
  insignia: { color: '#f9e2af', textAlign: 'center', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
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
