import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IndicadorRacha } from '../src/components/IndicadorRacha';
import { IconoColgadero, IconoLista, IconoNaipe, IconoNumero } from '../src/components/iconos';
import { obtenerBD } from '../src/db/client';
import {
  calcularRachaActual,
  contarElementosPorCategoria,
  contarPendientesPorCategoria,
  listarDiasPractica,
  listarMazos,
  obtenerConfigRacha,
  obtenerDiaPractica,
} from '../src/db/repository';
import type { Categoria, FilaMazo } from '../src/db/tipos';
import { fechaLocal } from '../src/domain/racha/calculo';
import { useRachaStore } from '../src/stores/racha';
import { useTema } from '../src/stores/tema';
import { cardStyle } from '../src/tema/colores';
import type { TokensColor } from '../src/tema/colores';

const RUTA_POR_CATEGORIA: Record<Categoria, '/colgadero' | '/naipes' | '/listas' | '/numeros'> = {
  colgadero: '/colgadero',
  naipe: '/naipes',
  lista_item: '/listas',
  numero: '/numeros',
};

type ClaveAcento = 'accent1' | 'accent2' | 'accent3' | 'accent4';

/** Ícono + acento por categoría — mismo reparto que `CATEGORIAS_BASE` en dashboard.html. */
const ICONO_POR_CATEGORIA: Record<
  Categoria,
  { Icono: (p: { color: string; tamano?: number }) => React.ReactElement; acento: ClaveAcento }
> = {
  colgadero: { Icono: IconoColgadero, acento: 'accent1' },
  naipe: { Icono: IconoNaipe, acento: 'accent2' },
  lista_item: { Icono: IconoLista, acento: 'accent3' },
  numero: { Icono: IconoNumero, acento: 'accent4' },
};

interface FilaCategoria {
  mazo: FilaMazo;
  elementos: number;
}

/**
 * Dashboard (§8.9, agent_docs/modulos/09-dashboard.md). Estructura y recetas de
 * forma calcadas de `agent_docs/prototipos/pantallas/dashboard.html`.
 *
 * Dos conteos distintos, a propósito (ADR-027): las insignias muestran el
 * INVENTARIO (`contarElementosPorCategoria` — cuántos elementos hay guardados,
 * en su unidad natural), mientras que `totalPendientes`
 * (`contarPendientesPorCategoria`) decide a dónde lleva el botón principal.
 * Confundir ambos fue lo que hacía que un número recién repasado mostrara 0 y
 * que una lista mostrara sus eslabones en vez de contarse como una.
 *
 * `useFocusEffect` (no `useEffect`) porque el Stack no desmonta `index` al
 * navegar y volver — sin esto los datos quedarían obsoletos tras una sesión.
 */
export default function Index() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tarjetasHoy, setTarjetasHoy] = useState(0);
  const [filas, setFilas] = useState<FilaCategoria[]>([]);
  const [totalPendientes, setTotalPendientes] = useState(0);
  const { resultado: racha, config, establecer } = useRachaStore();
  const { tema, colores: t, tipografia } = useTema();
  const esArcade = tema === 'arcade';

  const cargarInterno = useCallback((resolver?: () => void) => {
    let cancelado = false;
    (async () => {
      try {
        const db = await obtenerBD();
        const ahora = new Date();
        const [resultadoRacha, configRacha, dias, dia, mazos, elementos, pendientes] = await Promise.all([
          calcularRachaActual(db, ahora),
          obtenerConfigRacha(db),
          listarDiasPractica(db),
          obtenerDiaPractica(db, fechaLocal(ahora)),
          listarMazos(db),
          contarElementosPorCategoria(db),
          contarPendientesPorCategoria(db, ahora),
        ]);
        if (cancelado) {
          resolver?.();
          return;
        }
        const elementosPorCategoria = new Map(elementos.map((e) => [e.categoria, e.elementos]));
        establecer({ resultado: resultadoRacha, config: configRacha, dias });
        setTarjetasHoy(dia?.tarjetas_revisadas ?? 0);
        setFilas(mazos.map((mazo) => ({ mazo, elementos: elementosPorCategoria.get(mazo.categoria) ?? 0 })));
        setTotalPendientes(pendientes.reduce((suma, p) => suma + p.pendientes, 0));
        setCargando(false);
      } catch (e) {
        if (!cancelado) {
          setError(String(e));
          setCargando(false);
        }
      } finally {
        resolver?.();
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Versión que devuelve Promise<void> para RefreshControl (pull-to-refresh).
   * Envuelve cargarInterno con un Promise que se resuelve cuando termina.
   */
  const cargar = useCallback(async (): Promise<void> => {
    return new Promise<void>((resolver) => {
      cargarInterno(resolver);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(cargarInterno);

  const metaDiaria = config?.meta_diaria ?? 20;

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (error || !racha) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.error, { color: t.otraVez }]}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[estilos.contenedorScroll, { backgroundColor: t.bg }]}
      contentContainerStyle={estilos.contenido}
      refreshControl={
        <RefreshControl
          refreshing={cargando}
          onRefresh={cargar}
          tintColor={t.accent1}
          colors={[t.accent1]}
          progressBackgroundColor={t.card}
        />
      }
    >
      <View
        style={[
          estilos.tarjetaRacha,
          esArcade
            ? {
                ...cardStyle(tema),
                borderRadius: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
              }
            : { borderBottomWidth: 1, borderBottomColor: t.borderMuted, paddingBottom: 16 },
        ]}
      >
        <IndicadorRacha diasConsecutivos={racha.diasConsecutivos} estado={racha.estado} />
        <Link
          href="/racha"
          style={
            esArcade
              ? [estilos.enlaceRachaPill, { backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', fontFamily: tipografia.display }]
              : [estilos.enlaceRachaPlano, { color: t.accent1, fontFamily: tipografia.body }]
          }
        >
          Ver racha →
        </Link>
      </View>

      <View style={esArcade ? [estilos.tarjetaMeta, { ...cardStyle(tema), borderRadius: 20 }] : estilos.tarjetaMetaPlana}>
        <View style={estilos.filaMeta}>
          <Text style={[estilos.textoMeta, { color: t.ink, fontFamily: tipografia.display }]}>Meta de hoy</Text>
          <Text style={[estilos.fraccionMeta, { color: t.accent1, fontFamily: tipografia.display }]}>
            {tarjetasHoy} <Text style={{ color: t.inkMuted, fontSize: 13, fontWeight: '400' }}>/ {metaDiaria}</Text>
          </Text>
        </View>
        <View style={[estilos.barraFondo, esArcade ? { height: 14, borderRadius: 999 } : { height: 3, borderRadius: 2 }, { backgroundColor: t.bg }]}>
          <View
            style={[
              estilos.barraProgreso,
              { width: `${Math.min(100, (tarjetasHoy / metaDiaria) * 100)}%`, backgroundColor: t.accent1 },
              esArcade && { borderRadius: 999 },
            ]}
          />
        </View>
      </View>

      <View>
        <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Elementos por categoría</Text>
        {filas.map(({ mazo, elementos }) => {
          const { Icono, acento } = ICONO_POR_CATEGORIA[mazo.categoria];
          const colorAcento: string = t[acento as keyof TokensColor] as string;
          return (
            <Pressable
              key={mazo.id}
              onPress={() => router.push(RUTA_POR_CATEGORIA[mazo.categoria])}
              style={[
                estilos.filaCategoria,
                esArcade
                  ? { ...cardStyle(tema), borderRadius: 18, marginBottom: 10 }
                  : { borderBottomWidth: 1, borderBottomColor: t.borderMuted, paddingHorizontal: 0 },
              ]}
            >
              <View style={estilos.filaCategoriaIzquierda}>
                {esArcade ? (
                  <View style={[estilos.iconoCaja, { backgroundColor: `${colorAcento}33` }]}>
                    <Icono color={colorAcento} />
                  </View>
                ) : (
                  <View style={estilos.iconoPlano}>
                    <Icono color={t.accent3} />
                  </View>
                )}
                <Text style={[estilos.nombreCategoria, { color: t.ink, fontFamily: tipografia.display }]}>{mazo.nombre}</Text>
              </View>
              {esArcade ? (
                <View style={[estilos.insigniaConteo, { backgroundColor: colorAcento }]}>
                  <Text style={[estilos.textoConteo, { color: t.inkOnAccent, fontFamily: tipografia.display }]}>{elementos}</Text>
                </View>
              ) : (
                <Text style={[estilos.textoConteo, { color: t.inkMuted, fontFamily: tipografia.display }]}>{elementos}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.push(totalPendientes > 0 ? '/practicar' : '/practica-libre')}
        style={[
          estilos.botonPracticar,
          esArcade
            ? {
                backgroundColor: t.accent1,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 0,
              }
            : { backgroundColor: t.accent1, borderRadius: 2 },
        ]}
      >
        <Text style={[estilos.textoBotonPracticar, { color: t.inkOnAccent, fontFamily: tipografia.display }]}>
          {totalPendientes > 0 ? 'Practicar ahora' : 'Todo al día — practicar de todas formas'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1 },
  contenido: { padding: 24, gap: 18, paddingBottom: 160 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 24, textAlign: 'center' },
  tarjetaRacha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  enlaceRachaPill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, fontSize: 13, fontWeight: '600', overflow: 'hidden' },
  enlaceRachaPlano: { fontSize: 13.5, fontStyle: 'italic' },
  tarjetaMeta: { padding: 18, gap: 4 },
  tarjetaMetaPlana: { paddingVertical: 2, gap: 4 },
  filaMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textoMeta: { fontSize: 15, fontWeight: '600' },
  fraccionMeta: { fontSize: 16, fontWeight: '700' },
  barraFondo: { overflow: 'hidden', marginTop: 10 },
  barraProgreso: { height: '100%' },
  subtitulo: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  filaCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  filaCategoriaIzquierda: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconoCaja: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconoPlano: { width: 19, alignItems: 'center', justifyContent: 'center' },
  nombreCategoria: { fontSize: 15, fontWeight: '600' },
  insigniaConteo: { minWidth: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  textoConteo: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  botonPracticar: { paddingVertical: 18, alignItems: 'center' },
  textoBotonPracticar: { fontWeight: '700', fontSize: 16 },
  enlaceEstadisticas: { textAlign: 'center', fontSize: 13 },
});
