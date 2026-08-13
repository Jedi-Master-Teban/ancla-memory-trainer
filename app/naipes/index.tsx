import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EditorNaipe } from '../../src/components/EditorNaipe';
import { obtenerBD } from '../../src/db/client';
import { actualizarContenidoTarjeta, listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD, FilaTarjeta } from '../../src/db/tipos';
import { etiquetaCarta, type Carta } from '../../src/domain/fonetica/naipes';

const MODOS = [
  { href: '/naipes/flash' as const, etiqueta: 'Fonética Flash', descripcion: 'Carta → palabra' },
  { href: '/naipes/reverso' as const, etiqueta: 'Reverso', descripcion: 'Palabra → carta' },
  { href: '/naipes/velocidad' as const, etiqueta: 'Velocidad', descripcion: 'Serie cronometrada' },
  { href: '/naipes/baraja-completa' as const, etiqueta: 'Baraja Completa', descripcion: 'Memoriza y reproduce las 52' },
];

interface FilaConCarta {
  tarjeta: FilaTarjeta;
  carta: Carta;
}

export default function NaipesIndex() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [filas, setFilas] = useState<FilaConCarta[]>([]);
  const [editando, setEditando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const conexion = await obtenerBD();
      const mazo = await obtenerMazoPorCategoria(conexion, 'naipe');
      if (!mazo) {
        setDb(conexion);
        setFilas([]);
        setCargando(false);
        return;
      }
      const tarjetas = await listarTarjetasPorMazo(conexion, mazo.id);
      const conCarta = tarjetas.map((tarjeta) => ({
        tarjeta,
        carta: JSON.parse(tarjeta.metadata_categoria) as Carta,
      }));
      setDb(conexion);
      setFilas(conCarta);
      setCargando(false);
    } catch (e) {
      setError(String(e));
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardarPalabra(tarjetaId: string, palabra: string) {
    if (!db) return;
    await actualizarContenidoTarjeta(db, tarjetaId, { contenidoReverso: palabra });
    setEditando(null);
    await cargar();
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

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      {filas.length === 0 ? (
        <Text style={estilos.aviso}>
          Todavía no hay mazo naipe sembrado — falta completar src/seed/naipes.ts y correr la migración.
        </Text>
      ) : (
        MODOS.map((modo) => (
          <Link key={modo.href} href={modo.href} style={estilos.tarjetaModo}>
            <Text style={estilos.etiqueta}>{modo.etiqueta}</Text>
            <Text style={estilos.descripcion}>{modo.descripcion}</Text>
          </Link>
        ))
      )}

      {filas.length > 0 ? (
        <>
          <Text style={estilos.subtitulo}>Las 52 cartas</Text>
          {filas.map(({ tarjeta, carta }) =>
            editando === tarjeta.id ? (
              <EditorNaipe
                key={tarjeta.id}
                carta={carta}
                palabraActual={tarjeta.contenido_reverso}
                onGuardar={(palabra) => guardarPalabra(tarjeta.id, palabra)}
              />
            ) : (
              <Pressable key={tarjeta.id} onPress={() => setEditando(tarjeta.id)} style={estilos.filaCarta}>
                <Text style={estilos.etiquetaCarta}>{etiquetaCarta(carta)}</Text>
                <Text style={estilos.palabraCarta}>{tarjeta.contenido_reverso || 'sin asignar'}</Text>
              </Pressable>
            )
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, gap: 12 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  subtitulo: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  aviso: { color: '#f9e2af' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  tarjetaModo: { backgroundColor: '#313244', borderRadius: 12, padding: 16 },
  etiqueta: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  descripcion: { color: '#a6adc8', fontSize: 13, marginTop: 8 },
  filaCarta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#313244',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  etiquetaCarta: { color: '#ffffff', fontWeight: '600' },
  palabraCarta: { color: '#a6adc8' },
});
