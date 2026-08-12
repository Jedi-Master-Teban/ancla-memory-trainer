import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { obtenerBD } from '../../src/db/client';
import { calificarTarjeta, crearSesion, cerrarSesion, listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { compararReproduccion, generarOrdenBaraja, LAS_52_CARTAS } from '../../src/domain/naipes/baraja';
import { etiquetaCarta, type Carta } from '../../src/domain/fonetica/naipes';

type Fase = 'cargando' | 'error' | 'memorizando' | 'reproduciendo' | 'completo';

function claveCarta(c: Carta): string {
  return `${c.palo}-${c.valor}`;
}

export default function NaipesBarajaCompleta() {
  const [fase, setFase] = useState<Fase>('cargando');
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [tarjetasPorClave, setTarjetasPorClave] = useState<Map<string, FilaTarjeta>>(new Map());
  const [orden, setOrden] = useState<Carta[]>([]);
  const [respuesta, setRespuesta] = useState<Carta[]>([]);
  const [inicioMemorizarMs, setInicioMemorizarMs] = useState(0);
  const [tiempoMemorizarMs, setTiempoMemorizarMs] = useState(0);
  const [inicioReproducirMs, setInicioReproducirMs] = useState(0);
  const [tiempoReproducirMs, setTiempoReproducirMs] = useState(0);
  const [resultado, setResultado] = useState<{ correctas: number; total: number } | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'naipe');
        if (!mazo) throw new Error('No hay mazo naipe sembrado todavía');
        const tarjetas = await listarTarjetasPorMazo(conexion, mazo.id);
        if (tarjetas.length < 52) {
          throw new Error(`Solo hay ${tarjetas.length}/52 cartas con palabra asignada`);
        }
        const porClave = new Map<string, FilaTarjeta>();
        for (const t of tarjetas) {
          const meta = JSON.parse(t.metadata_categoria) as { palo: Carta['palo']; valor: Carta['valor'] };
          porClave.set(`${meta.palo}-${meta.valor}`, t);
        }
        const sesion = await crearSesion(conexion, { modo: 'naipes-baraja-completa' }, new Date());
        if (!cancelado) {
          setDb(conexion);
          setSesionId(sesion.id);
          setTarjetasPorClave(porClave);
          setOrden(generarOrdenBaraja(LAS_52_CARTAS));
          setInicioMemorizarMs(Date.now());
          setFase('memorizando');
        }
      } catch (e) {
        if (!cancelado) {
          setError(String(e));
          setFase('error');
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const disponibles = useMemo(() => {
    const elegidas = new Set(respuesta.map(claveCarta));
    return LAS_52_CARTAS.filter((c) => !elegidas.has(claveCarta(c)));
  }, [respuesta]);

  function empezarReproduccion() {
    setTiempoMemorizarMs(Date.now() - inicioMemorizarMs);
    setInicioReproducirMs(Date.now());
    setFase('reproduciendo');
  }

  function elegirCarta(carta: Carta) {
    setRespuesta((prev) => [...prev, carta]);
  }

  async function terminarReproduccion() {
    if (!db || !sesionId) return;
    const tiempoFinal = Date.now() - inicioReproducirMs;
    setTiempoReproducirMs(tiempoFinal);

    const comparacion = compararReproduccion(orden, respuesta);
    const ahora = new Date();

    let aciertos = 0;
    let fallos = 0;
    for (let i = 0; i < orden.length; i++) {
      const tarjeta = tarjetasPorClave.get(claveCarta(orden[i]));
      if (!tarjeta) continue;
      const acerto = comparacion.aciertosPorPosicion[i];
      await calificarTarjeta(db, { tarjetaId: tarjeta.id, sesionId, calificacion: acerto ? 'bien' : 'otra_vez' }, ahora);
      if (acerto) aciertos++;
      else fallos++;
    }

    await cerrarSesion(db, { sesionId, duracionSegundos: Math.round((tiempoMemorizarMs + tiempoFinal) / 1000), aciertos, fallos }, ahora);

    setResultado({ correctas: comparacion.correctas, total: comparacion.total });
    setFase('completo');
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

  if (fase === 'memorizando') {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Memoriza el orden</Text>
        <ScrollView style={estilos.lista}>
          {orden.map((carta, i) => (
            <Text key={claveCarta(carta)} style={estilos.filaLista}>
              {i + 1}. {etiquetaCarta(carta)}
            </Text>
          ))}
        </ScrollView>
        <Pressable onPress={empezarReproduccion} style={estilos.botonPrincipal}>
          <Text style={estilos.textoBoton}>Ya memoricé — reproducir</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'reproduciendo') {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>
          Reproduce el orden ({respuesta.length}/52)
        </Text>
        <ScrollView horizontal style={estilos.tiraRespuesta}>
          {respuesta.map((c, i) => (
            <Text key={i} style={estilos.chip}>
              {etiquetaCarta(c)}
            </Text>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={estilos.grid}>
          {disponibles.map((carta) => (
            <Pressable key={claveCarta(carta)} onPress={() => elegirCarta(carta)} style={estilos.botonCarta}>
              <Text style={estilos.textoBotonCarta}>{etiquetaCarta(carta)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={terminarReproduccion} style={estilos.botonPrincipal}>
          <Text style={estilos.textoBoton}>Terminar</Text>
        </Pressable>
      </View>
    );
  }

  // fase === 'completo'
  return (
    <View style={estilos.centro}>
      <Text style={estilos.titulo}>Baraja completa</Text>
      <Text style={estilos.texto}>
        {resultado?.correctas}/{resultado?.total} correctas
      </Text>
      <Text style={estilos.texto}>
        Memorización: {(tiempoMemorizarMs / 1000).toFixed(1)}s · Reproducción: {(tiempoReproducirMs / 1000).toFixed(1)}s
      </Text>
      <Pressable onPress={() => router.back()}>
        <Text style={estilos.enlace}>Volver</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e', padding: 16, gap: 12 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  titulo: { color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  texto: { color: '#a6adc8' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  enlace: { color: '#89b4fa', marginTop: 12 },
  lista: { flex: 1 },
  filaLista: { color: '#ffffff', fontSize: 16, paddingVertical: 4 },
  tiraRespuesta: { maxHeight: 40 },
  chip: { color: '#a6e3a1', marginRight: 12, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 16 },
  botonCarta: { backgroundColor: '#313244', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  textoBotonCarta: { color: '#ffffff', fontSize: 13 },
  botonPrincipal: { backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  textoBoton: { color: '#1e1e2e', fontWeight: '600' },
});
