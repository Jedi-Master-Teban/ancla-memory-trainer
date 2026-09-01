import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { obtenerBD } from '../src/db/client';
import {
  actualizarConfigRacha,
  actualizarTema,
  actualizarTipografia,
  obtenerConfigRacha,
  obtenerPreferencias,
} from '../src/db/repository';
import type { ConexionBD } from '../src/db/tipos';
import { PreviewEstilo } from '../src/components/PreviewEstilo';
import type { TemaId } from '../src/tema/colores';
import type { TipografiaId } from '../src/tema/tipografia';
import { useTema, useTemaStore } from '../src/stores/tema';

const OPCIONES_TEMA: { id: TemaId; etiqueta: string; descripcion: string }[] = [
  { id: 'arcade', etiqueta: 'Arcade Neón', descripcion: 'Colorido, redondeado, gamificado' },
  { id: 'soft', etiqueta: 'Soft UI', descripcion: 'Cálido, táctil, bordes suaves' },
  { id: 'papel', etiqueta: 'Papel y Tinta', descripcion: 'Cálido, editorial, silencioso' },
];

const OPCIONES_TIPOGRAFIA: { id: TipografiaId; etiqueta: string; descripcion: string }[] = [
  { id: 'tematica', etiqueta: 'La del estilo', descripcion: 'Más grande y robusta — acompaña al tema elegido' },
  { id: 'sistema', etiqueta: 'La del sistema', descripcion: 'La letra estándar de iOS, más sobria' },
];

/**
 * Selector de tema (§8.9 adyacente, Fase 8 ADR-026) + configuración de racha
 * relocada desde app/racha.tsx (meta diaria/hora de recordatorio/
 * congeladores) — el botón "Reiniciar racha (solo pruebas)" no se trae: el
 * operador decidió eliminarlo en Plan Mode, ya cumplió su propósito de
 * limpiar datos mientras se probaba la Fase 5.
 */
export default function Ajustes() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [metaTexto, setMetaTexto] = useState('');
  const [horaTexto, setHoraTexto] = useState('');
  const [congeladoresTexto, setCongeladoresTexto] = useState('');
  const { tema, colores: t, tipografia, preferenciaTipografia } = useTema();

  const cargar = useCallback(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const [prefs, cfg] = await Promise.all([obtenerPreferencias(conexion), obtenerConfigRacha(conexion)]);
        if (cancelado) return;
        setDb(conexion);
        useTemaStore.getState().establecer(prefs);
        setMetaTexto(String(cfg.meta_diaria));
        setHoraTexto(cfg.hora_recordatorio);
        setCongeladoresTexto(String(cfg.congeladores_disponibles));
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

  async function elegirTema(nuevoTema: TemaId) {
    if (!db) return;
    await actualizarTema(db, nuevoTema);
    const prefs = await obtenerPreferencias(db);
    useTemaStore.getState().establecer(prefs);
  }

  async function elegirTipografia(nueva: TipografiaId) {
    if (!db) return;
    await actualizarTipografia(db, nueva);
    const prefs = await obtenerPreferencias(db);
    useTemaStore.getState().establecer(prefs);
  }

  async function guardarConfig() {
    if (!db) return;
    const metaDiaria = Number(metaTexto);
    const congeladoresDisponibles = Number(congeladoresTexto);
    if (!Number.isFinite(metaDiaria) || metaDiaria <= 0) return;
    if (!Number.isFinite(congeladoresDisponibles) || congeladoresDisponibles < 0) return;
    if (!/^\d{2}:\d{2}$/.test(horaTexto)) return;
    await actualizarConfigRacha(db, { metaDiaria, congeladoresDisponibles, horaRecordatorio: horaTexto });
    cargar();
  }

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={{ color: t.otraVez }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[estilos.contenedorScroll, { backgroundColor: t.bg }]}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Estilo visual</Text>
      {OPCIONES_TEMA.map((opcion) => (
        <PreviewEstilo
          key={opcion.id}
          temaAVista={opcion.id}
          etiqueta={opcion.etiqueta}
          descripcion={opcion.descripcion}
          activa={tema === opcion.id}
          onPress={() => elegirTema(opcion.id)}
        />
      ))}

      <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Tipografía</Text>
      {OPCIONES_TIPOGRAFIA.map((opcion) => {
        const seleccionada = preferenciaTipografia === opcion.id;
        return (
          <Pressable
            key={opcion.id}
            onPress={() => elegirTipografia(opcion.id)}
            style={[
              estilos.filaOpcion,
              { backgroundColor: t.card, borderColor: seleccionada ? t.accent1 : 'transparent' },
            ]}
          >
            <View style={estilos.textoOpcion}>
              <Text style={[estilos.etiquetaOpcion, { color: t.ink, fontFamily: tipografia.display }]}>
                {opcion.etiqueta}
              </Text>
              <Text style={[estilos.descripcionOpcion, { color: t.inkMuted }]}>{opcion.descripcion}</Text>
            </View>
            <View
              style={[
                estilos.check,
                {
                  borderColor: seleccionada ? t.accent1 : t.inkMuted,
                  backgroundColor: seleccionada ? t.accent1 : 'transparent',
                },
              ]}
            />
          </Pressable>
        );
      })}

      <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Práctica</Text>
      <View style={estilos.filaConfig}>
        <Text style={[estilos.etiquetaConfig, { color: t.inkMuted }]}>Meta diaria</Text>
        <TextInput
          value={metaTexto}
          onChangeText={setMetaTexto}
          keyboardType="number-pad"
          style={[estilos.inputConfig, { backgroundColor: t.card, color: t.ink }]}
        />
      </View>
      <View style={estilos.filaConfig}>
        <Text style={[estilos.etiquetaConfig, { color: t.inkMuted }]}>Hora de recordatorio (HH:MM)</Text>
        <TextInput
          value={horaTexto}
          onChangeText={setHoraTexto}
          placeholder="21:00"
          placeholderTextColor={t.inkMuted}
          style={[estilos.inputConfig, { backgroundColor: t.card, color: t.ink }]}
        />
      </View>
      <View style={estilos.filaConfig}>
        <Text style={[estilos.etiquetaConfig, { color: t.inkMuted }]}>Congeladores disponibles</Text>
        <TextInput
          value={congeladoresTexto}
          onChangeText={setCongeladoresTexto}
          keyboardType="number-pad"
          style={[estilos.inputConfig, { backgroundColor: t.card, color: t.ink }]}
        />
      </View>
      <Pressable onPress={guardarConfig} style={[estilos.botonGuardar, { backgroundColor: t.accent1 }]}>
        <Text style={[estilos.textoBotonGuardar, { color: t.inkOnAccent }]}>Guardar configuración</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1 },
  contenido: { padding: 24, paddingBottom: 60, gap: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitulo: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 4 },
  filaOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
  },
  swatch: { width: 44, height: 44, borderRadius: 12 },
  textoOpcion: { flex: 1 },
  etiquetaOpcion: { fontSize: 15, fontWeight: '700' },
  descripcionOpcion: { fontSize: 12.5, marginTop: 2 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  filaConfig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiquetaConfig: { flex: 1 },
  inputConfig: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, width: 90, textAlign: 'right' },
  botonGuardar: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  textoBotonGuardar: { fontWeight: '600' },
});
