import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnilloMeta } from '../src/components/AnilloMeta';
import { StreakPill } from '../src/components/StreakPill';
import { IconoAncla, IconoChevron, IconoColgadero, IconoLista, IconoNaipe, IconoNumero } from '../src/components/iconos';
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
import { recetaForma } from '../src/tema/colores';
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
  pendientes: number;
}

/** Estimación honesta: ~24 s por tarjeta, redondeando hacia arriba al minuto. */
function minutosEstimados(tarjetas: number): number {
  return Math.max(1, Math.round((tarjetas * 24) / 60));
}

/**
 * Dashboard (§8.9, agent_docs/modulos/09-dashboard.md).
 *
 * Dos conteos distintos, a propósito (ADR-027): las insignias muestran las
 * VENCIDAS (`contarPendientesPorCategoria` — lo que hay que hacer hoy), y a su
 * lado, en gris, el INVENTARIO (`contarElementosPorCategoria` — cuántos
 * elementos hay guardados). Confundir ambos fue lo que hacía que un número
 * recién repasado mostrara 0.
 *
 * `useFocusEffect` (no `useEffect`) porque el Stack no desmonta `index` al
 * navegar y volver — sin esto los datos quedarían obsoletos tras una sesión.
 *
 * ── Fase 8 v2 (DESIGN.md §5.2, §7.1) ───────────────────────────────────────
 *
 * La pantalla ahora responde UNA pregunta — «¿qué hago hoy?» — y lo hace en el
 * primer scroll: anillo de meta, cuántas faltan, minutos estimados y un solo
 * CTA. Todo lo demás es inventario, no decisión.
 *
 * Tres cambios concretos frente a v1:
 *
 * 1. La píldora de racha es un BOTÓN a `/racha`. Antes la racha solo se veía
 *    al terminar una sesión, y es el número que más motiva de la app.
 * 2. La barra de meta es un anillo con el número dentro: una barra obliga a
 *    hacer la resta, el anillo la muestra.
 * 3. Las recetas de forma salen de `recetaForma(tema)`, no de un `if (esArcade)`
 *    por bloque. Eso es lo que hacía que las pantallas se sintieran de apps
 *    distintas: cada una decidía sus radios por su cuenta.
 */
export default function Index() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tarjetasHoy, setTarjetasHoy] = useState(0);
  const [filas, setFilas] = useState<FilaCategoria[]>([]);
  const [totalPendientes, setTotalPendientes] = useState(0);
  const { resultado: racha, config, establecer } = useRachaStore();
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);

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
        const pendientesPorCategoria = new Map(pendientes.map((p) => [p.categoria, p.pendientes]));
        establecer({ resultado: resultadoRacha, config: configRacha, dias });
        setTarjetasHoy(dia?.tarjetas_revisadas ?? 0);
        setFilas(
          mazos.map((mazo) => ({
            mazo,
            elementos: elementosPorCategoria.get(mazo.categoria) ?? 0,
            pendientes: pendientesPorCategoria.get(mazo.categoria) ?? 0,
          })),
        );
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

  const faltan = Math.max(0, metaDiaria - tarjetasHoy);
  const categoriasConPendientes = filas.filter((f) => f.pendientes > 0).length;
  const cumplida = faltan === 0;

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
      <View style={estilos.encabezado}>
        <View style={estilos.marca}>
          <IconoAncla color={t.accent1} tamano={21} />
          <Text style={[estilos.nombreApp, { color: t.ink, fontFamily: tipografia.display }]}>Ancla</Text>
        </View>
        <StreakPill
          dias={racha.diasConsecutivos}
          estado={racha.estado}
          onPress={() => router.push('/racha')}
        />
      </View>

      <View
        style={[
          estilos.hero,
          forma.sombraCard,
          { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder, borderRadius: forma.rCard },
        ]}
      >
        <View style={estilos.heroFila}>
          <AnilloMeta hoy={tarjetasHoy} meta={metaDiaria} />
          <View style={estilos.heroTexto}>
            <Text style={[estilos.heroTitulo, { color: t.ink, fontFamily: tipografia.display }]}>
              {cumplida ? 'Meta de hoy cumplida' : `Te faltan ${faltan} tarjetas`}
            </Text>
            <Text style={[estilos.heroDetalle, { color: t.inkMuted, fontFamily: tipografia.body }]}>
              {totalPendientes > 0
                ? `${totalPendientes} vencidas en ${categoriasConPendientes} ${categoriasConPendientes === 1 ? 'categoría' : 'categorías'}. Unos ${minutosEstimados(Math.min(totalPendientes, metaDiaria))} minutos.`
                : 'No tienes tarjetas vencidas. Puedes practicar de todas formas.'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push(totalPendientes > 0 ? '/practicar' : '/practica-libre')}
          style={({ pressed }) => [
            estilos.cta,
            forma.sombraCta(t),
            { backgroundColor: t.accent1, borderRadius: forma.rBtn },
            pressed && { transform: [{ translateY: 1 }], opacity: 0.92 },
          ]}
        >
          <Text style={[estilos.ctaTexto, { color: t.inkOnAccent, fontFamily: tipografia.display }]}>
            {totalPendientes > 0 ? 'Practicar ahora' : 'Practicar de todas formas'}
          </Text>
          <IconoChevron color={t.inkOnAccent} tamano={17} trazo={2.4} />
        </Pressable>
      </View>

      <View>
        <View style={estilos.seccionEncabezado}>
          <Text style={[estilos.seccionTitulo, { color: t.inkMuted, fontFamily: tipografia.display }]}>
            Por categoría
          </Text>
          <Text style={[estilos.seccionPie, { color: t.inkMuted, fontFamily: tipografia.body }]}>
            vencidas · total
          </Text>
        </View>

        <View style={estilos.listaCategorias}>
          {filas.map(({ mazo, elementos, pendientes }) => {
            const { Icono, acento } = ICONO_POR_CATEGORIA[mazo.categoria];
            const colorAcento: string = t[acento as keyof TokensColor] as string;
            return (
              <Pressable
                key={mazo.id}
                onPress={() => router.push(RUTA_POR_CATEGORIA[mazo.categoria])}
                accessibilityRole="button"
                accessibilityLabel={`${mazo.nombre}: ${pendientes} vencidas de ${elementos}`}
                style={({ pressed }) => [
                  estilos.fila,
                  {
                    backgroundColor: t.card,
                    borderColor: t.borderMuted ?? t.glassBorder,
                    borderRadius: forma.rRow,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View
                  style={[
                    estilos.iconoCaja,
                    // 0x29 ≈ 16 % — mismo truco de alfa hex que ya usaba el
                    // dashboard v1 con `33`, porque RN no tiene color-mix().
                    { backgroundColor: `${colorAcento}29`, borderRadius: forma.rIcon },
                  ]}
                >
                  <Icono color={colorAcento} tamano={19} />
                </View>

                <View style={estilos.filaTexto}>
                  <Text style={[estilos.filaNombre, { color: t.ink, fontFamily: tipografia.display }]}>
                    {mazo.nombre}
                  </Text>
                  <Text style={[estilos.filaPie, { color: t.inkMuted, fontFamily: tipografia.body }]}>
                    {elementos} {elementos === 1 ? 'elemento' : 'elementos'}
                  </Text>
                </View>

                <View style={estilos.filaDerecha}>
                  {pendientes > 0 ? (
                    <View
                      style={[
                        estilos.insignia,
                        { backgroundColor: colorAcento, borderRadius: forma.rPill },
                      ]}
                    >
                      <Text
                        style={[estilos.insigniaTexto, { color: t.inkOnAccent, fontFamily: tipografia.display }]}
                      >
                        {pendientes}
                      </Text>
                    </View>
                  ) : (
                    <View style={[estilos.insigniaVacia, { borderColor: t.track, borderRadius: forma.rPill }]}>
                      <Text style={[estilos.insigniaTexto, { color: t.inkMuted, fontFamily: tipografia.display }]}>
                        0
                      </Text>
                    </View>
                  )}
                  <Text style={[estilos.filaTotal, { color: t.inkMuted, fontFamily: tipografia.body }]}>
                    {elementos}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/estadisticas')}
        style={({ pressed }) => [
          estilos.pieRetencion,
          { backgroundColor: t.cardAlt, borderColor: t.borderMuted ?? t.track, borderRadius: forma.rRow },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={[estilos.pieRetencionTexto, { color: t.inkMuted, fontFamily: tipografia.body }]}>
          Ver retención y estadísticas
        </Text>
        <IconoChevron color={t.inkMuted} tamano={15} trazo={2.2} />
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1 },
  // 130 de paddingBottom: la isla flota encima. DESIGN.md §4.
  contenido: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 130, gap: 22 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 24, textAlign: 'center' },

  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  nombreApp: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2 },

  hero: { borderWidth: 1, padding: 22, gap: 20 },
  heroFila: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroTexto: { flex: 1, gap: 7 },
  heroTitulo: { fontSize: 17, fontWeight: '700' },
  heroDetalle: { fontSize: 13, lineHeight: 19 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 17 },
  ctaTexto: { fontSize: 16, fontWeight: '800' },

  seccionEncabezado: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 11,
  },
  seccionTitulo: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  seccionPie: { fontSize: 11.5 },

  listaCategorias: { gap: 9 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  iconoCaja: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  filaTexto: { flex: 1, gap: 2 },
  filaNombre: { fontSize: 14.5, fontWeight: '700' },
  filaPie: { fontSize: 11.5 },
  filaDerecha: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  insignia: { minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  insigniaVacia: {
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  insigniaTexto: { fontSize: 13, fontWeight: '800' },
  filaTotal: { fontSize: 12.5, width: 24, textAlign: 'right' },

  pieRetencion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pieRetencionTexto: { fontSize: 13 },
});
