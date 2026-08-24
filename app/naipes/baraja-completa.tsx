import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CaraFisica } from '../../src/components/CartaVisual';
import { obtenerBD } from '../../src/db/client';
import { calificarTarjeta, crearSesion, cerrarSesion, listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { compararReproduccion, generarOrdenBaraja, LAS_52_CARTAS } from '../../src/domain/naipes/baraja';
import { etiquetaCarta, type Carta } from '../../src/domain/fonetica/naipes';
import { useTema } from '../../src/stores/tema';

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
  const { colores: t } = useTema();

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
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (fase === 'error') {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.error, { color: t.otraVez }]}>Error: {error}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[estilos.enlace, { color: t.accent1 }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'memorizando') {
    return (
      <View style={[estilos.contenedor, { backgroundColor: t.bg }]}>
        <Text style={[estilos.titulo, { color: t.ink }]}>Memoriza el orden</Text>
        <ScrollView style={estilos.lista}>
          {orden.map((carta, i) => (
            <View key={claveCarta(carta)} style={estilos.filaListaCarta}>
              <Text style={[estilos.indiceLista, { color: t.inkMuted }]}>{i + 1}.</Text>
              <CaraFisica carta={carta} compacta />
            </View>
          ))}
        </ScrollView>
        <Pressable onPress={empezarReproduccion} style={[estilos.botonPrincipal, { backgroundColor: t.accent1 }]}>
          <Text style={[estilos.textoBoton, { color: t.inkOnAccent }]}>Ya memoricé — reproducir</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'reproduciendo') {
    return (
      <View style={[estilos.contenedor, { backgroundColor: t.bg }]}>
        <Text style={[estilos.titulo, { color: t.ink }]}>
          Reproduce el orden ({respuesta.length}/52)
        </Text>
        <ScrollView horizontal style={estilos.tiraRespuesta}>
          {respuesta.map((c, i) => (
            <Text key={i} style={[estilos.chip, { color: t.bien }]}>
              {etiquetaCarta(c)}
            </Text>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={estilos.grid}>
          {disponibles.map((carta) => (
            <Pressable key={claveCarta(carta)} onPress={() => elegirCarta(carta)}>
              <CaraFisica carta={carta} compacta />
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={terminarReproduccion} style={[estilos.botonPrincipal, { backgroundColor: t.accent1 }]}>
          <Text style={[estilos.textoBoton, { color: t.inkOnAccent }]}>Terminar</Text>
        </Pressable>
      </View>
    );
  }

  // fase === 'completo'
  return (
    <View style={[estilos.centro, { backgroundColor: t.bg }]}>
      <Text style={[estilos.titulo, { color: t.ink }]}>Baraja completa</Text>
      <Text style={[estilos.texto, { color: t.inkMuted }]}>
        {resultado?.correctas}/{resultado?.total} correctas
      </Text>
      <Text style={[estilos.texto, { color: t.inkMuted }]}>
        Memorización: {(tiempoMemorizarMs / 1000).toFixed(1)}s · Reproducción: {(tiempoReproducirMs / 1000).toFixed(1)}s
      </Text>
      <Pressable onPress={() => router.back()}>
        <Text style={[estilos.enlace, { color: t.accent1 }]}>Volver</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, gap: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  titulo: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  texto: {},
  error: { padding: 24, textAlign: 'center' },
  enlace: { marginTop: 12 },
  lista: { flex: 1 },
  filaListaCarta: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  indiceLista: { fontSize: 13, width: 24 },
  tiraRespuesta: { maxHeight: 40 },
  chip: { marginRight: 12, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 16 },
  botonPrincipal: { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  textoBoton: { fontWeight: '600' },
});
