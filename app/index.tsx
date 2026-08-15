import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IndicadorRacha } from '../src/components/IndicadorRacha';
import { obtenerBD } from '../src/db/client';
import {
  calcularRachaActual,
  contarPendientesPorCategoria,
  listarDiasPractica,
  listarMazos,
  obtenerConfigRacha,
  obtenerDiaPractica,
} from '../src/db/repository';
import type { Categoria, FilaMazo } from '../src/db/tipos';
import { fechaLocal } from '../src/domain/racha/calculo';
import { useRachaStore } from '../src/stores/racha';

const RUTA_POR_CATEGORIA: Record<Categoria, '/colgadero' | '/naipes' | '/listas' | '/numeros'> = {
  colgadero: '/colgadero',
  naipe: '/naipes',
  lista_item: '/listas',
  numero: '/numeros',
};

interface FilaPendiente {
  mazo: FilaMazo;
  pendientes: number;
}

/**
 * Dashboard (§8.9, agent_docs/modulos/09-dashboard.md): "¿qué hago hoy?" en
 * menos de 2s. Reemplaza el menú simple de fases anteriores. `useFocusEffect`
 * (no `useEffect`) porque el Stack no desmonta `index` al navegar y volver —
 * sin esto, la racha/pendientes quedarían obsoletas tras una sesión.
 */
export default function Index() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tarjetasHoy, setTarjetasHoy] = useState(0);
  const [filas, setFilas] = useState<FilaPendiente[]>([]);
  const { resultado: racha, config, establecer } = useRachaStore();

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const db = await obtenerBD();
        const ahora = new Date();
        const [resultadoRacha, configRacha, dias, dia, mazos, pendientes] = await Promise.all([
          calcularRachaActual(db, ahora),
          obtenerConfigRacha(db),
          listarDiasPractica(db),
          obtenerDiaPractica(db, fechaLocal(ahora)),
          listarMazos(db),
          contarPendientesPorCategoria(db, ahora),
        ]);
        if (cancelado) return;
        const pendientesPorCategoria = new Map(pendientes.map((p) => [p.categoria, p.pendientes]));
        establecer({ resultado: resultadoRacha, config: configRacha, dias });
        setTarjetasHoy(dia?.tarjetas_revisadas ?? 0);
        setFilas(mazos.map((mazo) => ({ mazo, pendientes: pendientesPorCategoria.get(mazo.categoria) ?? 0 })));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(cargar);

  const totalPendientes = filas.reduce((suma, f) => suma + f.pendientes, 0);
  const metaDiaria = config?.meta_diaria ?? 20;

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (error || !racha) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.contenedorScroll} contentContainerStyle={estilos.contenido}>
      <View style={estilos.filaRacha}>
        <IndicadorRacha diasConsecutivos={racha.diasConsecutivos} estado={racha.estado} />
        <Link href="/racha" style={estilos.enlaceRacha}>
          Ver racha →
        </Link>
      </View>

      <View style={estilos.bloqueMeta}>
        <Text style={estilos.textoMeta}>
          {tarjetasHoy} / {metaDiaria} tarjetas hoy
        </Text>
        <View style={estilos.barraFondo}>
          <View style={[estilos.barraProgreso, { width: `${Math.min(100, (tarjetasHoy / metaDiaria) * 100)}%` }]} />
        </View>
      </View>

      <Text style={estilos.subtitulo}>Pendientes por categoría</Text>
      {filas.map(({ mazo, pendientes }) => (
        <Link key={mazo.id} href={RUTA_POR_CATEGORIA[mazo.categoria]} style={estilos.filaCategoria}>
          <Text style={estilos.nombreCategoria}>{mazo.nombre}</Text>
          <Text style={estilos.pendientesCategoria}>{pendientes}</Text>
        </Link>
      ))}

      <Pressable
        onPress={() => router.push(totalPendientes > 0 ? '/practicar' : '/practica-libre')}
        style={estilos.botonPracticar}
      >
        <Text style={estilos.textoBotonPracticar}>
          {totalPendientes > 0 ? 'Practicar ahora' : 'Todo al día — practicar de todas formas'}
        </Text>
      </Pressable>

      <Link href="/estadisticas" style={estilos.enlaceEstadisticas}>
        Ver estadísticas →
      </Link>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, gap: 16 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  filaRacha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  enlaceRacha: { color: '#89b4fa' },
  enlaceEstadisticas: { color: '#89b4fa', textAlign: 'center', marginTop: 4 },
  bloqueMeta: { gap: 6 },
  textoMeta: { color: '#a6adc8', fontSize: 15 },
  barraFondo: { height: 8, backgroundColor: '#313244', borderRadius: 4, overflow: 'hidden' },
  barraProgreso: { height: 8, backgroundColor: '#a6e3a1' },
  subtitulo: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginTop: 8 },
  filaCategoria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#313244',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nombreCategoria: { color: '#ffffff', fontSize: 15 },
  pendientesCategoria: { color: '#f9e2af', fontSize: 15, fontWeight: '600' },
  botonPracticar: {
    backgroundColor: '#89b4fa',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotonPracticar: { color: '#1e1e2e', fontWeight: '700', fontSize: 16 },
});
