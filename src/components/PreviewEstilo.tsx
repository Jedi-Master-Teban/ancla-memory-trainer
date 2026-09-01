import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MorphIcon } from 'morphicons/react-native';
import type { TemaId } from '../tema/colores';
import { coloresDelTema } from '../tema/colores';
import { tipografiaDelTema } from '../tema/tipografia';

/**
 * Preview mini del estilo visual: muestra un StreakPill + botón +
 * tab bar reducida para que el usuario vea la diferencia antes de
 * elegir. Vive como componente puro que recibe el tema a previsualizar
 * (no el tema activo) — así cada opción renderiza con sus propios tokens.
 */
interface Props {
  temaAVista: TemaId;
  etiqueta: string;
  descripcion: string;
  activa: boolean;
  onPress: () => void;
}

export function PreviewEstilo({ temaAVista, etiqueta, descripcion, activa, onPress }: Props) {
  const t = coloresDelTema(temaAVista);
  const tip = tipografiaDelTema(temaAVista, 'tematica');

  return (
    <Pressable
      onPress={onPress}
      style={[
        estilos.contenedor,
        {
          backgroundColor: t.bg,
          borderColor: activa ? t.accent1 : t.borderMuted ?? 'transparent',
          borderWidth: activa ? 2 : 1,
        },
      ]}
    >
      <View style={estilos.header}>
        <View style={estilos.headerTexto}>
          <Text style={[estilos.etiqueta, { color: t.ink, fontFamily: tip.display }]}>
            {etiqueta}
          </Text>
          <Text style={[estilos.descripcion, { color: t.inkMuted }]}>{descripcion}</Text>
        </View>
        <View
          style={[
            estilos.check,
            {
              borderColor: activa ? t.accent1 : t.inkMuted,
              backgroundColor: activa ? t.accent1 : 'transparent',
            },
          ]}
        />
      </View>

      {/* Preview: StreakPill mini */}
      <View style={[estilos.previewFila, { backgroundColor: t.card }]}>
        <Text style={{ fontSize: 18 }}>🔥</Text>
        <Text style={[estilos.previewNumero, { color: t.ink, fontFamily: tip.display }]}>7</Text>
        <Text style={[estilos.previewDias, { color: t.inkMuted }]}>días</Text>
      </View>

      {/* Preview: Botón primario */}
      <View
        style={[
          estilos.previewBoton,
          {
            backgroundColor: t.accent1,
            shadowColor: t.accent1,
          },
        ]}
      >
        <Text style={[estilos.previewBotonTexto, { color: t.inkOnAccent }]}>+ Palabra nueva</Text>
      </View>

      {/* Preview: tab bar reducida (igual estilo que TabBarInferior) */}
      <View style={[estilos.previewTabBar, { borderTopColor: t.borderMuted ?? t.inkMuted }]}>
        <MorphIcon icon="lucide-house" size={14} color={t.accent1} />
        <MorphIcon icon="lucide-pencil" size={14} color={t.inkMuted} />
        <MorphIcon icon="lucide-bar-chart-3" size={14} color={t.inkMuted} />
        <MorphIcon icon="lucide-settings" size={14} color={t.inkMuted} />
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTexto: { flex: 1 },
  etiqueta: { fontSize: 16, fontWeight: '700' },
  descripcion: { fontSize: 12, marginTop: 2 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  previewFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  previewNumero: { fontSize: 18, fontWeight: '700' },
  previewDias: { fontSize: 12 },
  previewBoton: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  previewBotonTexto: { fontSize: 13, fontWeight: '700' },
  previewTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
