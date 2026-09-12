import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Categoria } from '../db/tipos';
import { useHojearStore } from '../stores/hojear';
import { useTema } from '../stores/tema';
import { cardStyle, recetaForma } from '../tema/colores';
import { IconoChevron } from './iconos';

interface Props {
  categoria: Categoria;
  /** Total de elementos del mazo — solo para el texto secundario. */
  total: number;
  /**
   * Etiqueta de lo que hay en la posición guardada («Mufa», «8♦»). Si no
   * hay posición guardada, la fila «Continuar» no se pinta.
   */
  etiquetaContinuar?: string;
}

/**
 * Panel de la pestaña «Hojear» de una pantalla de categoría (DESIGN.md §9.1).
 * Dos filas y nada más: empezar por el principio, o seguir donde te quedaste.
 * Sin filtros — el operador pidió únicamente orden natural.
 */
export function PanelHojear({ categoria, total, etiquetaContinuar }: Props) {
  const { colores: t, tipografia, tema } = useTema();
  const forma = recetaForma(tema);
  const guardado = useHojearStore((s) => s.posiciones[categoria]);

  const abrir = (indice: number) =>
    router.push({ pathname: '/hojear/[categoria]', params: { categoria, desde: String(indice) } } as never);

  const fila = (titulo: string, pie: string, insignia: string, indice: number) => (
    <Pressable
      onPress={() => abrir(indice)}
      style={[
        estilos.fila,
        cardStyle(tema),
        { borderRadius: forma.rRow, borderColor: t.borderMuted ?? 'transparent' },
      ]}
    >
      <Text style={[estilos.insignia, { color: t.accent1, fontFamily: tipografia.display }]}>{insignia}</Text>
      <View style={estilos.texto}>
        <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>{titulo}</Text>
        <Text style={[estilos.pie, { color: t.inkMuted }]}>{pie}</Text>
      </View>
      <IconoChevron color={t.inkMuted} />
    </Pressable>
  );

  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.nota, { color: t.inkMuted }]}>
        Sin calificar y sin contar para la racha. Repasa a tu ritmo.
      </Text>
      {fila('Desde el principio', `${total} en orden natural`, '1', 0)}
      {guardado !== undefined && guardado > 0
        ? fila(
            'Continuar',
            etiquetaContinuar ? `Te quedaste en ${etiquetaContinuar}` : `Posición ${guardado + 1}`,
            String(guardado + 1),
            guardado,
          )
        : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 10 },
  nota: { fontSize: 12, lineHeight: 17, marginBottom: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 16 },
  insignia: { fontSize: 22, fontWeight: '700', minWidth: 34 },
  texto: { flex: 1, gap: 2 },
  titulo: { fontSize: 15, fontWeight: '700' },
  pie: { fontSize: 11.5 },
});
