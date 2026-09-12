import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { obtenerBD } from '../db/client';
import {
  contarElementosPorCategoria,
  contarPendientesPorCategoria,
  obtenerPanelRetencion,
} from '../db/repository';
import type { Categoria } from '../db/tipos';
import { useTema } from '../stores/tema';
import { recetaForma } from '../tema/colores';

/**
 * Resumen de la categoría, en la cabecera de su pantalla: cuántas tocan hoy
 * sobre el total que tienes, y cómo vienes recordándolas en los últimos 30 días.
 *
 * Son dos preguntas distintas y por eso van juntas: "¿cuánto me queda por
 * hacer?" y "¿lo estoy reteniendo?". El total solo tiene sentido al lado de las
 * vencidas — 12 de 100 es una tarde, 12 de 12 es toda la categoría.
 *
 * La retención puede ser `null` cuando todavía no hay revisiones en la ventana;
 * en ese caso se dice «sin datos», nunca 0 %, que significaría lo contrario.
 * Vencidas incluye las tarjetas nuevas, igual que el botón «Practicar ahora»
 * del dashboard (`contarPendientesPorCategoria`).
 */
interface Props {
  categoria: Categoria;
  /** Unidad natural, para el texto: «palabras», «cartas», «listas», «números». */
  unidad: string;
}

interface Datos {
  vencidas: number;
  total: number;
  retencion: number | null;
}

export function ResumenCategoria({ categoria, unidad }: Props) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const [datos, setDatos] = useState<Datos | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        try {
          const db = await obtenerBD();
          const ahora = new Date();
          const [pendientes, elementos, panel] = await Promise.all([
            contarPendientesPorCategoria(db, ahora),
            contarElementosPorCategoria(db),
            obtenerPanelRetencion(db, '30d', ahora),
          ]);
          if (cancelado) return;
          setDatos({
            vencidas: pendientes.find((p) => p.categoria === categoria)?.pendientes ?? 0,
            total: elementos.find((e) => e.categoria === categoria)?.elementos ?? 0,
            retencion: panel.porCategoria.find((c) => c.categoria === categoria)?.porcentajeRetencion ?? null,
          });
        } catch {
          // Un fallo aquí no debe tumbar la pantalla: el resumen simplemente no
          // se pinta y los modos de estudio siguen accesibles.
          if (!cancelado) setDatos(null);
        }
      })();
      return () => {
        cancelado = true;
      };
    }, [categoria]),
  );

  if (!datos) return null;

  const retencionTexto =
    datos.retencion === null ? 'sin datos' : `${Math.round(datos.retencion * 100)} %`;

  return (
    <View
      style={[
        estilos.contenedor,
        {
          backgroundColor: t.card,
          borderRadius: forma.rCard,
          borderColor: t.borderMuted ?? 'transparent',
        },
      ]}
    >
      <View style={estilos.bloque}>
        <Text style={[estilos.cifra, { color: t.accent1, fontFamily: tipografia.display }]}>
          {datos.vencidas}
          <Text style={[estilos.deTotal, { color: t.inkMuted }]}> / {datos.total}</Text>
        </Text>
        <Text style={[estilos.etiqueta, { color: t.inkMuted }]}>vencidas · {unidad}</Text>
      </View>

      <View style={[estilos.separador, { backgroundColor: t.borderMuted ?? t.track }]} />

      <View style={estilos.bloque}>
        <Text
          style={[
            estilos.cifra,
            { color: datos.retencion === null ? t.inkMuted : t.bien, fontFamily: tipografia.display },
          ]}
        >
          {retencionTexto}
        </Text>
        <Text style={[estilos.etiqueta, { color: t.inkMuted }]}>retención · 30 días</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 16,
  },
  bloque: { flex: 1, gap: 2 },
  cifra: { fontSize: 24, fontWeight: '800' },
  deTotal: { fontSize: 15, fontWeight: '600' },
  etiqueta: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.06 },
  separador: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
});
