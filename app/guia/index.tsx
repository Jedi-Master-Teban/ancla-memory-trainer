import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import { IconoChevron } from '../../src/components/iconos';
import { CAPITULOS } from '../../src/domain/guia/contenido';
import { useTema } from '../../src/stores/tema';
import { cardStyle, recetaForma } from '../../src/tema/colores';

/**
 * Guía de técnicas (ADR-031): una sola sección, un capítulo por técnica. Cada
 * categoría enlaza a su capítulo con el libro de su cabecera, así que se puede
 * leer de corrido o llegar al capítulo desde donde se practica.
 */
export default function Guia() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);

  return (
    <View style={[estilos.raiz, { backgroundColor: t.bg }]}>
      <HeaderFlotante titulo="Guía" volverA="/" />
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={[estilos.intro, { color: t.ink, fontFamily: tipografia.display }]}>
          Cómo funciona cada técnica, para qué sirve y cómo recordar más.
        </Text>
        <Text style={[estilos.detalle, { color: t.inkMuted }]}>
          Se basa en el libro de Harry Lorayne y en la investigación sobre la memoria. Cada capítulo trae un ejercicio y sus
          fuentes al final.
        </Text>

        {CAPITULOS.map((capitulo, i) => (
          <Pressable
            key={capitulo.id}
            onPress={() => router.push(`/guia/${capitulo.id}` as never)}
            accessibilityRole="button"
            accessibilityLabel={`Capítulo ${i + 1}: ${capitulo.titulo}`}
            style={({ pressed }) => [
              estilos.fila,
              cardStyle(tema),
              { borderRadius: forma.rRow, borderColor: t.borderMuted ?? 'transparent' },
              pressed && { opacity: 0.75 },
            ]}
          >
            <View style={[estilos.numero, { backgroundColor: `${t.accent1}1F`, borderRadius: forma.rIcon }]}>
              <Text style={[estilos.numeroTexto, { color: t.accent1, fontFamily: tipografia.display }]}>{i + 1}</Text>
            </View>
            <View style={estilos.texto}>
              <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>{capitulo.titulo}</Text>
              <Text style={[estilos.resumen, { color: t.inkMuted }]}>{capitulo.resumen}</Text>
              <Text style={[estilos.meta, { color: t.inkMuted }]}>{capitulo.minutos} min · con ejercicio</Text>
            </View>
            <IconoChevron color={t.inkMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  // 140 abajo: la isla flota encima.
  contenido: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 140, gap: 12 },
  intro: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  detalle: { fontSize: 14.5, lineHeight: 20, marginBottom: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1 },
  numero: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  numeroTexto: { fontSize: 18, fontWeight: '800' },
  texto: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: '800' },
  resumen: { fontSize: 13.5, lineHeight: 18 },
  meta: { fontSize: 12, fontWeight: '700', marginTop: 2 },
});
