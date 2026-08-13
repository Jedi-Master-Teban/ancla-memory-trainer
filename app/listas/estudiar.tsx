import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BotonesCalificacion } from '../../src/components/BotonesCalificacion';
import { PausaVisualizacion } from '../../src/components/PausaVisualizacion';
import { TemporizadorEstudio } from '../../src/components/TemporizadorEstudio';
import { obtenerBD } from '../../src/db/client';
import {
  calificarTarjeta,
  cerrarSesion,
  crearSesion,
  listarEslabonesDeLista,
  listarObjetosDeLista,
  obtenerLista,
} from '../../src/db/repository';
import type { ConexionBD, FilaListaObjeto, FilaTarjeta } from '../../src/db/tipos';
import type { Calificacion } from '../../src/domain/fsrs/scheduler';

type Fase = 'cargando' | 'error' | 'sin-eslabones' | 'memorizando' | 'directa' | 'transicion-inversa' | 'inversa' | 'completo';

interface Paso {
  cue: string;
  respuesta: string;
  tarjetaId: string;
  direccion?: 'inversa';
}

interface Fallo {
  texto: string;
  direccion: 'directa' | 'inversa';
}

/**
 * Modo de estudio de una lista encadenada (04-listas-cadena.md §4): memorizar
 * T segundos, reproducir en orden, reproducir en orden inverso — las dos
 * reproducciones califican los mismos eslabones (direccion normal/'inversa'),
 * nunca crean tarjetas nuevas.
 */
export default function ListasEstudiar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fase, setFase] = useState<Fase>('cargando');
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [segundosEstudio, setSegundosEstudio] = useState(30);
  const [objetos, setObjetos] = useState<FilaListaObjeto[]>([]);
  const [eslabones, setEslabones] = useState<FilaTarjeta[]>([]);
  const [indice, setIndice] = useState(0);
  const [revelada, setRevelada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [fallos, setFallos] = useState<Fallo[]>([]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const lista = await obtenerLista(conexion, id);
        if (!lista) throw new Error(`No existe la lista ${id}`);
        const filaObjetos = await listarObjetosDeLista(conexion, id);
        const filaEslabones = await listarEslabonesDeLista(conexion, id);
        const sesion = await crearSesion(conexion, { modo: 'listas-estudiar' }, new Date());
        if (cancelado) return;
        setDb(conexion);
        setSesionId(sesion.id);
        setSegundosEstudio(lista.segundos_estudio);
        setObjetos(filaObjetos);
        setEslabones(filaEslabones);
        setFase(filaEslabones.length === 0 ? 'sin-eslabones' : 'memorizando');
      } catch (e) {
        if (!cancelado) setError(String(e));
        if (!cancelado) setFase('error');
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function pasoActual(): Paso | null {
    if (fase === 'directa') {
      if (indice >= eslabones.length) return null;
      const a = objetos[indice];
      const b = objetos[indice + 1];
      if (!a || !b) return null;
      return { cue: a.texto, respuesta: b.texto, tarjetaId: eslabones[indice].id };
    }
    if (fase === 'inversa') {
      if (indice >= eslabones.length) return null;
      const eslabonIdx = eslabones.length - 1 - indice;
      const a = objetos[eslabonIdx];
      const b = objetos[eslabonIdx + 1];
      if (!a || !b) return null;
      return { cue: b.texto, respuesta: a.texto, tarjetaId: eslabones[eslabonIdx].id, direccion: 'inversa' };
    }
    return null;
  }

  async function terminarPase(aciertosFinales: number, fallosFinales: number) {
    if (fase === 'directa') {
      setIndice(0);
      setRevelada(false);
      setFase('transicion-inversa');
      return;
    }
    if (fase === 'inversa') {
      if (db && sesionId) {
        await cerrarSesion(
          db,
          { sesionId, duracionSegundos: 0, aciertos: aciertosFinales, fallos: fallosFinales },
          new Date()
        );
      }
      setFase('completo');
    }
  }

  async function onCalificar(calificacion: Calificacion) {
    const paso = pasoActual();
    if (!db || !sesionId || !paso) return;
    await calificarTarjeta(
      db,
      { tarjetaId: paso.tarjetaId, sesionId, calificacion, direccion: paso.direccion },
      new Date()
    );
    // No confiar en `aciertos`/`fallos` del closure para terminarPase: los
    // setState de abajo todavía no se han aplicado en este mismo tick.
    let aciertosFinales = aciertos;
    let fallosFinales = fallos;
    if (calificacion === 'otra_vez') {
      fallosFinales = [
        ...fallos,
        { texto: `${paso.cue} → ${paso.respuesta}`, direccion: fase === 'inversa' ? 'inversa' : 'directa' },
      ];
      setFallos(fallosFinales);
    } else {
      aciertosFinales = aciertos + 1;
      setAciertos(aciertosFinales);
    }
    setRevelada(false);
    const siguiente = indice + 1;
    setIndice(siguiente);
    if (siguiente >= eslabones.length) {
      await terminarPase(aciertosFinales, fallosFinales.length);
    }
  }

  if (fase === 'cargando') {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (fase === 'error') {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'sin-eslabones') {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.texto}>Esta lista necesita al menos 2 objetos para poder estudiarse.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'memorizando') {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Memoriza la lista</Text>
        <TemporizadorEstudio segundos={segundosEstudio} onTerminar={() => setFase('directa')} />
        <ScrollView style={estilos.lista}>
          {objetos.map((o, i) => (
            <Text key={o.id} style={estilos.filaLista}>
              {i + 1}. {o.texto}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (fase === 'transicion-inversa') {
    const fallosDirecta = fallos.filter((f) => f.direccion === 'directa').length;
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>Orden directo completo</Text>
        <Text style={estilos.texto}>
          {eslabones.length - fallosDirecta} / {eslabones.length} correctas
        </Text>
        <Pressable
          onPress={() => {
            setIndice(0);
            setRevelada(false);
            setFase('inversa');
          }}
          style={estilos.botonRevelar}
        >
          <Text style={estilos.textoRevelar}>Reproducir en orden inverso →</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'completo') {
    return (
      <ScrollView style={estilos.contenedorScroll} contentContainerStyle={estilos.contenidoCompleto}>
        <Text style={estilos.titulo}>Sesión completa</Text>
        <Text style={estilos.texto}>
          {aciertos} aciertos · {fallos.length} fallos, sobre {eslabones.length * 2} transiciones (directa + inversa)
        </Text>
        {fallos.length > 0 ? (
          <View style={estilos.bloqueFallos}>
            <Text style={estilos.subtitulo}>Para reforzar la imagen absurda:</Text>
            {fallos.map((f, i) => (
              <Text key={i} style={estilos.filaFallo}>
                [{f.direccion}] {f.texto}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // fase === 'directa' | 'inversa'
  const paso = pasoActual();
  if (!paso) {
    // indice >= eslabones.length es el tránsito normal justo antes de que
    // terminarPase() cambie de fase — no hay nada que mostrar todavía.
    // Cualquier otro caso es un desajuste real entre objetos y eslabones.
    if (indice < eslabones.length) {
      return (
        <View style={estilos.centro}>
          <Text style={estilos.error}>
            Esta lista tiene un desajuste entre sus objetos y sus eslabones — vuelve a la lista y guárdala de nuevo
            antes de estudiarla.
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={estilos.enlace}>Volver</Text>
          </Pressable>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.progreso}>
        {fase === 'directa' ? 'Orden directo' : 'Orden inverso'} — {indice + 1} / {eslabones.length}
      </Text>
      <View style={estilos.tarjeta}>
        <Text style={estilos.cue}>{paso.cue}</Text>
        {revelada ? <Text style={estilos.respuesta}>{paso.respuesta}</Text> : null}
      </View>
      {!revelada ? (
        <PausaVisualizacion clave={`${fase}-${indice}`}>
          <Pressable onPress={() => setRevelada(true)} style={estilos.botonRevelar}>
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
  contenedor: { flex: 1, backgroundColor: '#1e1e2e', padding: 16, gap: 16, justifyContent: 'center' },
  // ScrollView exige que "justifyContent" (layout de los hijos) viva en
  // contentContainerStyle, no en style (ese es solo el contenedor exterior
  // con scroll) — de ahí el Render Error al llegar a la fase 'completo'.
  contenedorScroll: { flex: 1, backgroundColor: '#1e1e2e' },
  contenidoCompleto: { flexGrow: 1, padding: 24, gap: 12, justifyContent: 'center' },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  enlace: { color: '#89b4fa', marginTop: 12 },
  texto: { color: '#a6adc8', textAlign: 'center' },
  titulo: { color: '#ffffff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitulo: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  lista: { flex: 1 },
  filaLista: { color: '#ffffff', fontSize: 18, paddingVertical: 6, textAlign: 'center' },
  progreso: { color: '#a6adc8', textAlign: 'center' },
  tarjeta: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, minHeight: 160 },
  cue: { fontSize: 32, color: '#ffffff', fontWeight: '600', textAlign: 'center' },
  respuesta: { fontSize: 24, color: '#a6e3a1', textAlign: 'center' },
  botonRevelar: {
    alignSelf: 'center',
    backgroundColor: '#89b4fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoRevelar: { color: '#1e1e2e', fontWeight: '600' },
  bloqueFallos: { backgroundColor: '#313244', borderRadius: 12, padding: 16 },
  filaFallo: { color: '#f38ba8', fontSize: 14, paddingVertical: 2 },
});
