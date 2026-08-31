import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Heatmap90 } from '../src/components/Heatmap90';
import { IndicadorRacha } from '../src/components/IndicadorRacha';
import { obtenerBD } from '../src/db/client';
import { aplicarCongelador, calcularRachaActual, listarDiasPractica, obtenerConfigRacha } from '../src/db/repository';
import type { ConexionBD, FilaDiaPractica } from '../src/db/tipos';
import { diaAnterior, fechaLocal } from '../src/domain/racha/calculo';
import { useRachaStore } from '../src/stores/racha';
import { useTema } from '../src/stores/tema';
import { cardStyle } from '../src/tema/colores';

const VENTANA_CONGELABLE_DIAS = 14;

function diasCongelables(dias: FilaDiaPractica[], ahora: Date): { fecha: string; tarjetasRevisadas: number }[] {
  const porFecha = new Map(dias.map((d) => [d.fecha_local, d]));
  const resultado: { fecha: string; tarjetasRevisadas: number }[] = [];
  let cursor = diaAnterior(fechaLocal(ahora));
  for (let i = 0; i < VENTANA_CONGELABLE_DIAS; i++) {
    const fila = porFecha.get(cursor);
    if (!fila || (fila.meta_cumplida !== 1 && fila.congelador_usado !== 1)) {
      resultado.push({ fecha: cursor, tarjetasRevisadas: fila?.tarjetas_revisadas ?? 0 });
    }
    cursor = diaAnterior(cursor);
  }
  return resultado;
}

const TEXTO_ESTADO: Record<string, string> = {
  activa: 'Racha activa',
  en_riesgo: 'En riesgo hoy',
  rota: 'Racha rota',
};

/** Tarjeta hero + heatmap calcados de agent_docs/prototipos/pantallas/racha.html (config quedó relocada en app/ajustes.tsx). */
export default function Racha() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [ahora, setAhora] = useState(new Date());
  const { resultado: racha, config, dias, establecer } = useRachaStore();
  const { tema, colores: t, tipografia } = useTema();
  const esArcade = tema === 'arcade';

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const momento = new Date();
        const [resultadoRacha, listaDias, cfg] = await Promise.all([
          calcularRachaActual(conexion, momento),
          listarDiasPractica(conexion),
          obtenerConfigRacha(conexion),
        ]);
        if (cancelado) return;
        setDb(conexion);
        setAhora(momento);
        establecer({ resultado: resultadoRacha, config: cfg, dias: listaDias });
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

  async function congelar(fecha: string) {
    if (!db) return;
    try {
      await aplicarCongelador(db, fecha, new Date());
      cargar();
    } catch (e) {
      Alert.alert('No se pudo congelar', String(e));
    }
  }

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (error || !racha || !config) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.error, { color: t.otraVez }]}>Error: {error}</Text>
      </View>
    );
  }

  const congelables = diasCongelables(dias, ahora);

  return (
    <ScrollView
      style={[estilos.contenedorScroll, { backgroundColor: t.bg }]}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View
        style={[
          estilos.hero,
          esArcade
            ? { ...cardStyle(tema), borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20 }
            : { borderBottomWidth: 1, borderBottomColor: t.borderMuted, paddingBottom: 20 },
        ]}
      >
        <IndicadorRacha diasConsecutivos={racha.diasConsecutivos} estado={racha.estado} tamano="grande" />
        <Text style={[estilos.diasTexto, { color: t.inkMuted }]}>días consecutivos</Text>
        <View
          style={[
            estilos.pillEstado,
            esArcade ? { backgroundColor: 'rgba(255,255,255,0.16)' } : { borderWidth: 1, borderColor: t.bien },
          ]}
        >
          <Text style={[estilos.pillEstadoTexto, { color: esArcade ? '#fff' : t.bien, fontFamily: tipografia.display }]}>
            {TEXTO_ESTADO[racha.estado]}
          </Text>
        </View>
      </View>

      <View>
        <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Últimos 90 días</Text>
        <Heatmap90 dias={dias} ahora={ahora} />
      </View>

      <View>
        <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Configuración</Text>
        <Pressable
          onPress={() => router.push('/ajustes')}
          style={esArcade ? [estilos.cajaConfig, cardStyle(tema)] : undefined}
        >
          {(
            [
              ['Meta diaria', `${config.meta_diaria} tarjetas`],
              ['Recordatorio', config.hora_recordatorio],
              ['Congeladores disponibles', String(config.congeladores_disponibles)],
            ] as const
          ).map(([etiqueta, valor], i, todas) => (
            <View
              key={etiqueta}
              style={[
                estilos.filaConfig,
                i < todas.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: esArcade ? 'rgba(255,255,255,0.06)' : t.borderMuted,
                },
              ]}
            >
              <Text style={[estilos.etiquetaConfig, { color: t.ink }]}>{etiqueta}</Text>
              <Text style={[estilos.valorConfig, { color: t.accent1, fontFamily: tipografia.display }]}>{valor}</Text>
            </View>
          ))}
        </Pressable>
        <Text style={[estilos.pieConfig, { color: t.inkMuted }]}>Toca para editarlos en Ajustes.</Text>
      </View>

      <View>
        <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>
          Congeladores disponibles: {config.congeladores_disponibles}
        </Text>
        {congelables.length === 0 ? (
          <Text style={[estilos.texto, { color: t.inkMuted }]}>No hay días recientes sin cumplir por congelar.</Text>
        ) : (
          congelables.map(({ fecha, tarjetasRevisadas }) => (
            <Pressable
              key={fecha}
              onPress={() => congelar(fecha)}
              disabled={config.congeladores_disponibles <= 0}
              style={[
                estilos.filaDia,
                cardStyle(tema),
                config.congeladores_disponibles <= 0 && estilos.filaDiaDeshabilitada,
              ]}
            >
              <Text style={{ color: t.ink }}>{fecha}</Text>
              <Text style={{ color: t.accent3 }}>{tarjetasRevisadas} tarjetas · congelar</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1 },
  contenido: { padding: 24, paddingBottom: 60, gap: 22 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 24, textAlign: 'center' },
  hero: { alignItems: 'center', padding: 28 },
  diasTexto: { fontSize: 14, marginTop: 4 },
  pillEstado: { marginTop: 14, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  pillEstadoTexto: { fontSize: 12.5, fontWeight: '600' },
  subtitulo: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  texto: {},
  cajaConfig: { borderRadius: 18, paddingHorizontal: 18 },
  filaConfig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  etiquetaConfig: { fontSize: 14.5 },
  valorConfig: { fontSize: 14.5, fontWeight: '700' },
  pieConfig: { fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  filaDia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  filaDiaDeshabilitada: { opacity: 0.4 },
});
