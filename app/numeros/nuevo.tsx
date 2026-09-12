import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { obtenerBD } from '../../src/db/client';
import { crearNumeroImportante, listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD } from '../../src/db/tipos';
import { descomponerConDecimal } from '../../src/domain/numeros/descomposicion';
import { sanitizarDigitosConDecimal } from '../../src/domain/numeros/entrada';
import { useTema } from '../../src/stores/tema';
import type { TokensColor } from '../../src/tema/colores';

export default function NumeroNuevo() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);
  const [mapaColgadero, setMapaColgadero] = useState<Map<number, string>>(new Map());
  const [etiqueta, setEtiqueta] = useState('');
  const [digitos, setDigitos] = useState('');

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazo = await obtenerMazoPorCategoria(conexion, 'colgadero');
        const tarjetas = mazo ? await listarTarjetasPorMazo(conexion, mazo.id) : [];
        if (cancelado) return;
        setDb(conexion);
        setMapaColgadero(new Map(tarjetas.map((t) => [Number(t.contenido_frente), t.contenido_reverso])));
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

  const descomposicion = useMemo(() => {
    if (digitos.length === 0) return null;
    try {
      return descomponerConDecimal(digitos, (valor) => mapaColgadero.get(valor));
    } catch {
      return null;
    }
  }, [digitos, mapaColgadero]);

  async function guardar() {
    if (!db || etiqueta.trim().length === 0 || digitos.length === 0) return;
    await crearNumeroImportante(db, { etiqueta: etiqueta.trim(), digitos }, new Date());
    router.back();
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

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      <HeaderFlotante titulo="Número nuevo" volverA="/numeros" />
      <Text style={estilos.etiquetaCampo}>Etiqueta</Text>
      <TextInput
        value={etiqueta}
        onChangeText={setEtiqueta}
        placeholder="Ej. Clave de la caja fuerte"
        placeholderTextColor={t.inkMuted}
        style={estilos.input}
      />

      <Text style={estilos.etiquetaCampo}>Dígitos</Text>
      <TextInput
        value={digitos}
        onChangeText={(texto) => setDigitos(sanitizarDigitosConDecimal(texto))}
        placeholder="Ej. 3.14159 (o solo 0453)"
        placeholderTextColor={t.inkMuted}
        keyboardType="decimal-pad"
        style={estilos.input}
      />

      {descomposicion ? (
        <View style={estilos.bloquePreview}>
          <Text style={estilos.tituloPreview}>Descomposición</Text>
          {descomposicion.parteEntera.length > 0 && (
            <View>
              <Text style={estilos.seccionPreview}>Entera</Text>
              {descomposicion.parteEntera.map((trozo, i) => (
                <Text key={`entera-${i}`} style={estilos.filaTrozo}>
                  {trozo.digitos} → {trozo.palabra ?? 'sin colgadero'}
                </Text>
              ))}
            </View>
          )}
          {descomposicion.parteDecimal.length > 0 && (
            <View>
              <Text style={estilos.seccionPreview}>Decimal</Text>
              {descomposicion.parteDecimal.map((trozo, i) => (
                <Text key={`decimal-${i}`} style={estilos.filaTrozo}>
                  {trozo.digitos} → {trozo.palabra ?? 'sin colgadero'}
                </Text>
              ))}
            </View>
          )}
        </View>
      ) : null}

      <Pressable
        onPress={guardar}
        disabled={etiqueta.trim().length === 0 || digitos.length === 0}
        style={[estilos.botonGuardar, (etiqueta.trim().length === 0 || digitos.length === 0) && estilos.deshabilitado]}
      >
        <Text style={estilos.textoBoton}>Guardar</Text>
      </Pressable>
    </ScrollView>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: t.bg },
  contenido: { padding: 24, gap: 8 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
  error: { color: t.otraVez, padding: 24, textAlign: 'center' },
  etiquetaCampo: { color: t.inkMuted, marginTop: 12 },
  input: {
    backgroundColor: t.card,
    color: t.ink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  bloquePreview: { backgroundColor: t.card, borderRadius: 12, padding: 16, marginTop: 16, gap: 4 },
  tituloPreview: { color: t.ink, fontWeight: '600', marginBottom: 4 },
  seccionPreview: { color: t.accent1, fontSize: 12, fontWeight: '600', marginTop: 6, marginBottom: 2 },
  filaTrozo: { color: t.bien, fontSize: 15 },
  botonGuardar: { backgroundColor: t.accent1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  deshabilitado: { opacity: 0.4 },
  textoBoton: { color: t.inkOnAccent, fontWeight: '700' },
});
