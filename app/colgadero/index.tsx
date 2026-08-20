import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { obtenerBD } from '../../src/db/client';
import { listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';

const MODOS = [
  { href: '/colgadero/flash' as const, etiqueta: 'Fonética Flash', descripcion: 'Número → palabra' },
  { href: '/colgadero/reverso' as const, etiqueta: 'Reverso', descripcion: 'Palabra → número' },
  { href: '/colgadero/velocidad' as const, etiqueta: 'Velocidad', descripcion: 'Serie cronometrada' },
];

export default function ColgaderoIndex() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [palabras, setPalabras] = useState<FilaTarjeta[]>([]);

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion: ConexionBD = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'colgadero');
        const tarjetas = mazo ? await listarTarjetasPorMazo(conexion, mazo.id) : [];
        if (cancelado) return;
        setPalabras([...tarjetas].sort((a, b) => Number(a.contenido_frente) - Number(b.contenido_frente)));
        setCargando(false);
      } catch (e) {
        if (!cancelado) {
          setError(String(e));
          setCargando(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useFocusEffect(cargar);

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

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      <Link href="/crear/colgadero" style={estilos.botonNueva}>
        <Text style={estilos.textoBotonNueva}>+ Palabra nueva</Text>
      </Link>

      {MODOS.map((modo) => (
        <Link key={modo.href} href={modo.href} style={estilos.tarjetaModo}>
          <Text style={estilos.etiqueta}>{modo.etiqueta}</Text>
          <Text style={estilos.descripcion}>{modo.descripcion}</Text>
        </Link>
      ))}

      <Text style={estilos.subtitulo}>Todas las palabras ({palabras.length})</Text>
      {palabras.map((tarjeta) => (
        <Link key={tarjeta.id} href={`/crear/colgadero?id=${tarjeta.id}`} style={estilos.filaPalabra}>
          <Text style={estilos.numeroPalabra}>{tarjeta.contenido_frente}</Text>
          <Text style={estilos.textoPalabra}>{tarjeta.contenido_reverso || 'sin asignar'}</Text>
        </Link>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, gap: 12 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  botonNueva: { backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  textoBotonNueva: { color: '#1e1e2e', fontWeight: '600' },
  tarjetaModo: { backgroundColor: '#313244', borderRadius: 12, padding: 16 },
  etiqueta: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  descripcion: { color: '#a6adc8', fontSize: 13, marginTop: 8 },
  subtitulo: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  filaPalabra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#313244',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  numeroPalabra: { color: '#a6adc8', fontSize: 14, width: 32 },
  textoPalabra: { color: '#ffffff', fontWeight: '600' },
});
