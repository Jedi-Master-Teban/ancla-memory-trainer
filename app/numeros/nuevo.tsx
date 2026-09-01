import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { obtenerBD } from '../../src/db/client';
import { crearNumeroImportante, listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../src/db/repository';
import type { ConexionBD } from '../../src/db/tipos';
import { descomponerConDecimal } from '../../src/domain/numeros/descomposicion';
import { sanitizarDigitosConDecimal } from '../../src/domain/numeros/entrada';

export default function NumeroNuevo() {
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
        <ActivityIndicator color="#ffffff" />
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
      <Text style={estilos.etiquetaCampo}>Etiqueta</Text>
      <TextInput
        value={etiqueta}
        onChangeText={setEtiqueta}
        placeholder="Ej. Clave de la caja fuerte"
        placeholderTextColor="#6c7086"
        style={estilos.input}
      />

      <Text style={estilos.etiquetaCampo}>Dígitos</Text>
      <TextInput
        value={digitos}
        onChangeText={(texto) => setDigitos(sanitizarDigitosConDecimal(texto))}
        placeholder="Ej. 3.14159 (o solo 0453)"
        placeholderTextColor="#6c7086"
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

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e' },
  contenido: { padding: 24, gap: 8 },
  centro: { flex: 1, backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#f38ba8', padding: 24, textAlign: 'center' },
  etiquetaCampo: { color: '#a6adc8', marginTop: 12 },
  input: {
    backgroundColor: '#313244',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  bloquePreview: { backgroundColor: '#313244', borderRadius: 12, padding: 16, marginTop: 16, gap: 4 },
  tituloPreview: { color: '#ffffff', fontWeight: '600', marginBottom: 4 },
  seccionPreview: { color: '#89b4fa', fontSize: 12, fontWeight: '600', marginTop: 6, marginBottom: 2 },
  filaTrozo: { color: '#a6e3a1', fontSize: 15 },
  botonGuardar: { backgroundColor: '#89b4fa', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  deshabilitado: { opacity: 0.4 },
  textoBoton: { color: '#1e1e2e', fontWeight: '700' },
});
