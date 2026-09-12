import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Categoria, FilaTarjeta } from '../db/tipos';
import { REGISTRO } from '../domain/categorias/registro';
import { sanitizarDigitosConDecimal } from '../domain/numeros/entrada';
import { useTema } from '../stores/tema';
import type { TokensColor } from '../tema/colores';

interface Props {
  categoria: Categoria;
  tarjetaExistente?: FilaTarjeta;
  onGuardar: (valores: Record<string, string>) => void | Promise<void>;
}

/**
 * Formulario dirigido por `REGISTRO[categoria]` (§8.6). Nunca importa
 * `db/client` ni `db/repository`, nunca ve una `ConexionBD` — solo lee la
 * definición de la categoría. Así "cero cambios aquí al agregar una
 * categoría" es estructural: este componente no tiene forma de saber CÓMO
 * persiste una categoría, solo cómo se ven sus campos.
 */
export function FormularioGenerico({ categoria, tarjetaExistente, onGuardar }: Props) {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const definicion = REGISTRO[categoria];
  const [valores, setValores] = useState<Record<string, string>>(() =>
    tarjetaExistente ? (definicion.cargarValores?.(tarjetaExistente) ?? {}) : {}
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const camposCompletos = definicion.campos.every((c) => !c.requerido || (valores[c.clave] ?? '').trim().length > 0);
  const advertencias = useMemo(
    () => (camposCompletos ? (definicion.validar?.(valores, tarjetaExistente)?.advertencias ?? []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camposCompletos, valores, categoria]
  );

  function set(clave: string, valor: string) {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  }

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(valores);
    } catch (e) {
      setError(String(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={estilos.contenedor}>
      {tarjetaExistente ? (
        <Text style={estilos.actual}>
          {definicion.etiquetaSingular} actual: {tarjetaExistente.contenido_frente} → {tarjetaExistente.contenido_reverso}
        </Text>
      ) : null}

      {definicion.campos.map((campo) => (
        <View key={campo.clave}>
          <Text style={estilos.etiquetaCampo}>{campo.etiqueta}</Text>
          {campo.tipo === 'seleccion' ? (
            <View style={estilos.filaOpciones}>
              {(campo.opciones ?? []).map((opcion) => (
                <Pressable
                  key={opcion}
                  onPress={() => set(campo.clave, opcion)}
                  style={[estilos.chip, valores[campo.clave] === opcion && estilos.chipActivo]}
                >
                  <Text style={[estilos.textoChip, valores[campo.clave] === opcion && estilos.textoChipActivo]}>
                    {opcion}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <TextInput
              value={valores[campo.clave] ?? ''}
              onChangeText={(texto) => {
                if (campo.tipo === 'numero') {
                  set(campo.clave, texto.replace(/[^0-9]/g, ''));
                } else if (campo.tipo === 'decimal') {
                  set(campo.clave, sanitizarDigitosConDecimal(texto));
                } else {
                  set(campo.clave, texto);
                }
              }}
              placeholder={campo.etiqueta}
              placeholderTextColor={t.inkMuted}
              keyboardType={campo.tipo === 'numero' ? 'number-pad' : campo.tipo === 'decimal' ? 'decimal-pad' : 'default'}
              style={estilos.input}
            />
          )}
        </View>
      ))}

      {advertencias.map((advertencia) => (
        <Text key={advertencia} style={estilos.advertencia}>
          {advertencia}
        </Text>
      ))}

      {error ? <Text style={estilos.error}>Error al guardar: {error}</Text> : null}

      <Pressable
        onPress={guardar}
        disabled={!camposCompletos || guardando}
        style={[estilos.boton, (!camposCompletos || guardando) && estilos.deshabilitado]}
      >
        <Text style={estilos.textoBoton}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
      </Pressable>
    </View>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  contenedor: { gap: 8, padding: 16 },
  actual: { color: t.inkMuted, fontSize: 14, marginBottom: 8 },
  etiquetaCampo: { color: t.inkMuted, marginTop: 12 },
  input: {
    backgroundColor: t.card,
    color: t.ink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  filaOpciones: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { flex: 1, backgroundColor: t.card, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  chipActivo: { backgroundColor: t.accent1 },
  textoChip: { color: t.inkMuted, fontSize: 14 },
  textoChipActivo: { color: t.inkOnAccent, fontWeight: '600' },
  advertencia: { color: t.dificil, fontSize: 13, marginTop: 8 },
  error: { color: t.otraVez, fontSize: 13, marginTop: 8 },
  boton: { backgroundColor: t.accent1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  deshabilitado: { opacity: 0.4 },
  textoBoton: { color: t.inkOnAccent, fontWeight: '700' },
});
