import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { obtenerBD } from '../db/client';
import { aplicarCongelador, calcularRachaActual, listarDiasPractica, obtenerConfigRacha } from '../db/repository';
import type { ConexionBD } from '../db/tipos';
import type { EstadoRacha } from '../domain/racha/calculo';
import { fechaLocal } from '../domain/racha/calculo';
import { diasCongelables } from '../domain/racha/congelables';
import { avisar } from '../stores/dialogo';
import { useRachaStore } from '../stores/racha';
import { useTema } from '../stores/tema';
import { recetaForma } from '../tema/colores';
import { AnilloMeta } from './AnilloMeta';
import { Heatmap90 } from './Heatmap90';
import { IconoChevron } from './iconos';
import { IndicadorRacha } from './IndicadorRacha';

const TEXTO_ESTADO: Record<EstadoRacha, string> = {
  activa: 'Racha activa',
  en_riesgo: 'En riesgo hoy',
  rota: 'Racha rota',
};

/** «sáb 24 oct» — para que el día se reconozca sin contar fechas. */
function nombreDelDia(fechaLocalStr: string): string {
  const [anio, mes, dia] = fechaLocalStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * La racha dentro de Progreso (antes era su propia pantalla, `/racha`). Una
 * sola tarjeta cuenta la historia —cuántos días llevas, cómo vas hoy y los
 * últimos 90—, debajo van tus tres ajustes de racha y, plegados, los
 * congeladores. Después de esto sigue la retención, en la misma página.
 */
export function SeccionRacha() {
  const { tema, colores: t, tipografia } = useTema();
  const forma = recetaForma(tema);
  const { resultado: racha, config, dias, establecer } = useRachaStore();
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [ahora, setAhora] = useState(new Date());
  const [cargando, setCargando] = useState(racha === null);
  const [fallo, setFallo] = useState(false);
  const [congeladoresAbiertos, setCongeladoresAbiertos] = useState(false);

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const momento = new Date();
        const [resultado, lista, cfg] = await Promise.all([
          calcularRachaActual(conexion, momento),
          listarDiasPractica(conexion),
          obtenerConfigRacha(conexion),
        ]);
        if (cancelado) return;
        setDb(conexion);
        setAhora(momento);
        establecer({ resultado, config: cfg, dias: lista });
        setFallo(false);
        setCargando(false);
      } catch {
        if (!cancelado) {
          setFallo(true);
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
      await avisar({ titulo: 'No se pudo congelar', mensaje: String(e) });
    }
  }

  const tarjeta = [
    estilos.tarjeta,
    forma.sombraCard,
    { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder, borderRadius: forma.rCard },
  ];

  if (cargando && !racha) {
    return (
      <View style={[tarjeta, estilos.centro]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (fallo || !racha || !config) {
    return (
      <View style={[tarjeta, estilos.centro]}>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>No pude cargar tu racha. Desliza hacia abajo para reintentar.</Text>
      </View>
    );
  }

  const hoy = dias.find((d) => d.fecha_local === fechaLocal(ahora))?.tarjetas_revisadas ?? 0;
  const faltan = Math.max(0, config.meta_diaria - hoy);
  const colorEstado = racha.estado === 'activa' ? t.bien : racha.estado === 'en_riesgo' ? t.dificil : t.inkMuted;
  const congelables = diasCongelables(dias, ahora);
  const sinCongeladores = config.congeladores_disponibles <= 0;

  const datos: Array<{ etiqueta: string; valor: string }> = [
    { etiqueta: 'Meta diaria', valor: `${config.meta_diaria}` },
    { etiqueta: 'Recordatorio', valor: config.hora_recordatorio },
    { etiqueta: 'Congeladores', valor: String(config.congeladores_disponibles) },
  ];

  return (
    <View style={estilos.seccion}>
      <View style={tarjeta}>
        <View style={estilos.cabeza}>
          <IndicadorRacha diasConsecutivos={racha.diasConsecutivos} estado={racha.estado} tamano="grande" />
          <Text style={[estilos.diasTexto, { color: t.inkMuted, fontFamily: tipografia.body }]}>días consecutivos</Text>
          <View style={[estilos.pildora, { borderColor: colorEstado, borderRadius: forma.rPill }]}>
            <Text style={[estilos.pildoraTexto, { color: colorEstado, fontFamily: tipografia.display }]}>
              {TEXTO_ESTADO[racha.estado]}
            </Text>
          </View>
        </View>

        <View style={[estilos.separador, { backgroundColor: t.borderMuted ?? t.track }]} />

        <View style={estilos.hoy}>
          <AnilloMeta hoy={hoy} meta={config.meta_diaria} />
          <View style={estilos.hoyTexto}>
            <Text style={[estilos.hoyTitulo, { color: t.ink, fontFamily: tipografia.display }]}>
              {faltan === 0 ? 'Meta de hoy cumplida' : `Hoy te faltan ${faltan} ${faltan === 1 ? 'tarjeta' : 'tarjetas'}`}
            </Text>
            <Text style={[estilos.hoyDetalle, { color: t.inkMuted, fontFamily: tipografia.body }]}>
              {hoy} de {config.meta_diaria} revisadas hoy
            </Text>
          </View>
        </View>

        <View style={[estilos.separador, { backgroundColor: t.borderMuted ?? t.track }]} />

        <View>
          <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Últimos 90 días</Text>
          <Heatmap90 dias={dias} ahora={ahora} />
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/ajustes')}
        accessibilityRole="button"
        accessibilityLabel="Ajustes de la racha"
        accessibilityHint="Abre Ajustes para cambiar la meta, el recordatorio y los congeladores"
        style={estilos.datos}
      >
        {datos.map(({ etiqueta, valor }) => (
          <View
            key={etiqueta}
            style={[
              estilos.dato,
              { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder, borderRadius: forma.rRow },
            ]}
          >
            <Text style={[estilos.datoValor, { color: t.accent1, fontFamily: tipografia.display }]}>{valor}</Text>
            <Text style={[estilos.datoEtiqueta, { color: t.inkMuted, fontFamily: tipografia.body }]}>{etiqueta}</Text>
          </View>
        ))}
      </Pressable>

      <View
        style={[
          estilos.congeladores,
          { backgroundColor: t.card, borderColor: t.borderMuted ?? t.glassBorder, borderRadius: forma.rRow },
        ]}
      >
        <Pressable
          onPress={() => setCongeladoresAbiertos((a) => !a)}
          accessibilityRole="button"
          accessibilityState={{ expanded: congeladoresAbiertos }}
          style={estilos.congeladoresCabeza}
        >
          <View style={estilos.congeladoresTitulos}>
            <Text style={[estilos.congeladoresTitulo, { color: t.ink, fontFamily: tipografia.display }]}>Congelar un día</Text>
            <Text style={[estilos.hoyDetalle, { color: t.inkMuted, fontFamily: tipografia.body }]}>
              {sinCongeladores
                ? 'No te quedan congeladores'
                : `${config.congeladores_disponibles} ${config.congeladores_disponibles === 1 ? 'disponible' : 'disponibles'} · salvan un día sin cumplir`}
            </Text>
          </View>
          <View style={{ transform: [{ rotate: congeladoresAbiertos ? '-90deg' : '90deg' }] }}>
            <IconoChevron color={t.inkMuted} tamano={16} trazo={2.2} />
          </View>
        </Pressable>

        {congeladoresAbiertos ? (
          <View style={estilos.congeladoresLista}>
            {congelables.length === 0 ? (
              <Text style={[estilos.texto, { color: t.inkMuted }]}>No hay días recientes sin cumplir por congelar.</Text>
            ) : (
              congelables.map(({ fecha, tarjetasRevisadas }) => (
                <Pressable
                  key={fecha}
                  onPress={() => congelar(fecha)}
                  disabled={sinCongeladores}
                  accessibilityRole="button"
                  accessibilityLabel={`Congelar el ${nombreDelDia(fecha)}`}
                  style={[
                    estilos.filaDia,
                    { backgroundColor: t.cardAlt, borderRadius: forma.rIcon },
                    sinCongeladores && { opacity: 0.4 },
                  ]}
                >
                  <Text style={[estilos.filaDiaFecha, { color: t.ink, fontFamily: tipografia.body }]}>{nombreDelDia(fecha)}</Text>
                  <Text style={[estilos.filaDiaAccion, { color: t.accent3, fontFamily: tipografia.body }]}>
                    {tarjetasRevisadas} {tarjetasRevisadas === 1 ? 'tarjeta' : 'tarjetas'} · congelar
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: 12 },
  tarjeta: { borderWidth: 1, padding: 20, gap: 18 },
  centro: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  texto: { fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  cabeza: { alignItems: 'center', gap: 2 },
  diasTexto: { fontSize: 14, marginTop: 2 },
  pildora: { marginTop: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 6 },
  pildoraTexto: { fontSize: 12.5, fontWeight: '700' },
  separador: { height: 1 },
  hoy: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  hoyTexto: { flex: 1, gap: 3 },
  hoyTitulo: { fontSize: 16, fontWeight: '700' },
  hoyDetalle: { fontSize: 12.5 },
  subtitulo: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  datos: { flexDirection: 'row', gap: 10 },
  dato: { flex: 1, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', gap: 2 },
  datoValor: { fontSize: 20, fontWeight: '800' },
  datoEtiqueta: { fontSize: 11.5 },
  congeladores: { borderWidth: 1 },
  congeladoresCabeza: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 56 },
  congeladoresTitulos: { flex: 1, gap: 3 },
  congeladoresTitulo: { fontSize: 14.5, fontWeight: '700' },
  congeladoresLista: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  filaDia: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  filaDiaFecha: { fontSize: 14, textTransform: 'capitalize' },
  filaDiaAccion: { fontSize: 13, fontWeight: '700' },
});
