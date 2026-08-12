import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { obtenerBD } from '../src/db/client';
import { listarMazos } from '../src/db/repository';

export default function Index() {
  const [estado, setEstado] = useState('Iniciando…');

  useEffect(() => {
    let cancelado = false;
    obtenerBD()
      .then(async (db) => {
        const mazos = await listarMazos(db);
        if (!cancelado) setEstado(`BD lista — ${mazos.length} mazo(s)`);
      })
      .catch((error: unknown) => {
        if (!cancelado) setEstado(`Error de BD: ${String(error)}`);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>memory-trainer — Fase 3</Text>
      <Text style={styles.estado}>{estado}</Text>
      <Link href="/colgadero" style={styles.enlace}>
        Practicar Colgadero →
      </Link>
      <Link href="/naipes" style={styles.enlace}>
        Practicar Naipes →
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e2e', gap: 12 },
  titulo: { color: '#ffffff', fontSize: 16 },
  estado: { color: '#a6adc8', fontSize: 14 },
  enlace: { color: '#89b4fa', fontSize: 16, marginTop: 12 },
});
