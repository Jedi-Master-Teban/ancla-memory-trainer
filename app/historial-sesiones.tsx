import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../src/components/HeaderFlotante';
import { obtenerBD } from '../src/db/client';
import { listarRevisionesDeSesion, listarSesionesEstudio } from '../src/db/repository';
import type { ConexionBD, FilaRevision, FilaSesionEstudio } from '../src/db/tipos';
import { useTema } from '../src/stores/tema';
import type { TokensColor } from '../src/tema/colores';

/**
 * Historial de sesiones (§8.8 modulos/08-panel-retencion.md §3), pantalla
 * propia — no una sección colapsable dentro de estadisticas.tsx. Cambio real
 * pedido por el operador al probar en el dispositivo: con "Tarjetas
 * problemáticas" ya larga, una sección expandible aquí obligaba a
 * desplazarse muchísimo y seguía alargando la pantalla al abrirla.
 */
export default function HistorialSesiones() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [sesiones, setSesiones] = useState<FilaSesionEstudio[]>([]);
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null);
  const [revisionesPorSesion, setRevisionesPorSesion] = useState<Map<string, FilaRevision[]>>(new Map());

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const listaSesiones = await listarSesionesEstudio(conexion);
        if (cancelado) return;
        setDb(conexion);
        setSesiones(listaSesiones);
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

  async function alternarSesion(sesionId: string) {
    if (sesionExpandida === sesionId) {
      setSesionExpandida(null);
      return;
    }
    setSesionExpandida(sesionId);
    if (!db || revisionesPorSesion.has(sesionId)) return;
    const revisiones = await listarRevisionesDeSesion(db, sesionId);
    setRevisionesPorSesion((previo) => new Map(previo).set(sesionId, revisiones));
  }

  if (cargando) {
    return (
      <View  style={estilos.centro}>
        <ActivityIndicator color={t.ink} />
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

  if (sesiones.length === 0) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.vacio}>Todavía no hay sesiones registradas.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.contenedorScroll} contentContainerStyle={estilos.contenido}>
      <HeaderFlotante titulo="Historial de sesiones" volverA="/estadisticas" />
      {sesiones.map((sesion) => (
        <View key={sesion.id}>
          <Pressable onPress={() => alternarSesion(sesion.id)} style={estilos.filaSesion}>
            <Text style={estilos.textoSesion}>
              {new Date(sesion.iniciada_en).toLocaleString()} · {sesion.modo}
            </Text>
            <Text style={estilos.detalleSesion}>
              {sesion.aciertos} aciertos · {sesion.fallos} fallos
              {sesion.terminada_en === null ? ' · sin cerrar' : ''}
            </Text>
          </Pressable>
          {sesionExpandida === sesion.id ? (
            <View style={estilos.detalleRevisiones}>
              {(revisionesPorSesion.get(sesion.id) ?? []).map((r) => (
                <Text key={r.id} style={estilos.filaRevision}>
                  {new Date(r.fecha).toLocaleTimeString()} — calificación {r.calificacion}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedorScroll: { flex: 1, backgroundColor: t.bg },
  contenido: { padding: 24, gap: 8 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: t.otraVez, textAlign: 'center' },
  vacio: { color: t.inkMuted },
  filaSesion: { backgroundColor: t.card, borderRadius: 8, padding: 12 },
  textoSesion: { color: t.ink, fontSize: 14 },
  detalleSesion: { color: t.inkMuted, fontSize: 12, marginTop: 2 },
  detalleRevisiones: { paddingLeft: 16, paddingVertical: 4, gap: 2 },
  filaRevision: { color: t.inkMuted, fontSize: 12 },
});
