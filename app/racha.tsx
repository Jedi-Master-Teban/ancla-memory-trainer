import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Heatmap90 } from '../src/components/Heatmap90';
import { IndicadorRacha } from '../src/components/IndicadorRacha';
import { obtenerBD } from '../src/db/client';
import {
  actualizarConfigRacha,
  aplicarCongelador,
  calcularRachaActual,
  listarDiasPractica,
  obtenerConfigRacha,
  reiniciarHistorialPractica,
} from '../src/db/repository';
import type { ConexionBD, FilaDiaPractica } from '../src/db/tipos';
import { diaAnterior, fechaLocal } from '../src/domain/racha/calculo';
import { useRachaStore } from '../src/stores/racha';

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

export default function Racha() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [ahora, setAhora] = useState(new Date());
  const [metaTexto, setMetaTexto] = useState('');
  const [horaTexto, setHoraTexto] = useState('');
  const [congeladoresTexto, setCongeladoresTexto] = useState('');
  const { resultado: racha, config, dias, establecer } = useRachaStore();

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

  async function congelar(fecha: string) {
    if (!db) return;
    try {
      await aplicarCongelador(db, fecha, new Date());
      cargar();
    } catch (e) {
      Alert.alert('No se pudo congelar', String(e));
    }
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

  function confirmarReinicio() {
    Alert.alert(
      'Reiniciar racha (solo pruebas)',
      'Borra todo el historial de práctica y devuelve los congeladores a 2. No es una función del diseño final — es para limpiar datos mientras se prueba esta fase.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            if (!db) return;
            await reiniciarHistorialPractica(db);
            cargar();
          },
        },
      ]
    );
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (error || !racha || !config) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
      </View>
    );
  }

  const congelables = diasCongelables(dias, ahora);

  return (
    <ScrollView
      style={estilos.contenedorScroll}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={estilos.centroIndicador}>
        <IndicadorRacha diasConsecutivos={racha.diasConsecutivos} estado={racha.estado} />
        <Text style={estilos.estadoTexto}>
          {racha.estado === 'activa' ? 'Racha activa' : racha.estado === 'en_riesgo' ? 'En riesgo hoy' : 'Racha rota'}
        </Text>
      </View>

      <Text style={estilos.subtitulo}>Últimos ~90 días</Text>
      <Heatmap90 dias={dias} ahora={ahora} />

      <Text style={estilos.subtitulo}>Congeladores disponibles: {config.congeladores_disponibles}</Text>
      {congelables.length === 0 ? (
        <Text style={estilos.texto}>No hay días recientes sin cumplir por congelar.</Text>
      ) : (
        congelables.map(({ fecha, tarjetasRevisadas }) => (
          <Pressable
            key={fecha}
            onPress={() => congelar(fecha)}
            disabled={config.congeladores_disponibles <= 0}
            style={[estilos.filaDia, config.congeladores_disponibles <= 0 && estilos.filaDiaDeshabilitada]}
          >
            <Text style={estilos.textoDia}>{fecha}</Text>
            <Text style={estilos.textoDiaDetalle}>{tarjetasRevisadas} tarjetas · congelar</Text>
          </Pressable>
        ))
      )}

      <Text style={estilos.subtitulo}>Configuración</Text>
      <View style={estilos.filaConfig}>
        <Text style={estilos.etiquetaConfig}>Meta diaria</Text>
        <TextInput
          value={metaTexto}
          onChangeText={setMetaTexto}
          keyboardType="number-pad"
          style={estilos.inputConfig}
        />
      </View>
      <View style={estilos.filaConfig}>
        <Text style={estilos.etiquetaConfig}>Hora de recordatorio (HH:MM)</Text>
        <TextInput
          value={horaTexto}
          onChangeText={setHoraTexto}
          placeholder="21:00"
          placeholderTextColor="#6c7086"
          style={estilos.inputConfig}
        />
      </View>
      <View style={estilos.filaConfig}>
        <Text style={estilos.etiquetaConfig}>Congeladores disponibles</Text>
        <TextInput
          value={congeladoresTexto}
          onChangeText={setCongeladoresTexto}
          keyboardType="number-pad"
          style={estilos.inputConfig}
        />
      </View>
      <Pressable onPress={guardarConfig} style={estilos.botonGuardar}>
        <Text style={estilos.textoBotonGuardar}>Guardar configuración</Text>
      </Pressable>

      <Pressable onPress={confirmarReinicio} style={estilos.botonReiniciar}>
        <Text style={estilos.textoBotonReiniciar}>Reiniciar racha (solo pruebas)</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedorScroll: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, paddingBottom: 60, gap: 12 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  centroIndicador: { alignItems: 'center', gap: 8, marginBottom: 8 },
  estadoTexto: { color: '#a6adc8' },
  subtitulo: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  texto: { color: '#a6adc8' },
  filaDia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#313244',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filaDiaDeshabilitada: { opacity: 0.4 },
  textoDia: { color: '#ffffff' },
  textoDiaDetalle: { color: '#89dceb' },
  filaConfig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiquetaConfig: { color: '#a6adc8', flex: 1 },
  inputConfig: {
    backgroundColor: '#313244',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 90,
    textAlign: 'right',
  },
  botonGuardar: { backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  textoBotonGuardar: { color: '#1e1e2e', fontWeight: '600' },
  botonReiniciar: { paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  textoBotonReiniciar: { color: '#f38ba8', fontSize: 13 },
});
