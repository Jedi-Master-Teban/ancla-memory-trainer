import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BotonGuia } from '../../src/components/guia/comun';
import { PracticaCadena } from '../../src/components/guia/PracticaCadena';
import { PracticaCalificar } from '../../src/components/guia/PracticaCalificar';
import { PracticaColgadero } from '../../src/components/guia/PracticaColgadero';
import { PracticaDecodificar } from '../../src/components/guia/PracticaDecodificar';
import { PracticaNaipe } from '../../src/components/guia/PracticaNaipe';
import { PracticaNumero } from '../../src/components/guia/PracticaNumero';
import { TablaFonetica } from '../../src/components/guia/TablaFonetica';
import { HeaderFlotante } from '../../src/components/HeaderFlotante';
import {
  CAPITULOS,
  ETIQUETA_BASE,
  FUENTES,
  capituloPorId,
  siguienteCapitulo,
  type Practica,
} from '../../src/domain/guia/contenido';
import { useTema } from '../../src/stores/tema';
import { cardStyle, recetaForma } from '../../src/tema/colores';

const PRACTICAS: Record<Practica, () => ReactNode> = {
  calificar: () => <PracticaCalificar />,
  decodificar: () => <PracticaDecodificar />,
  colgadero: () => <PracticaColgadero />,
  naipe: () => <PracticaNaipe />,
  cadena: () => <PracticaCadena />,
  numero: () => <PracticaNumero />,
};

/**
 * Una sección del capítulo. Fuera del componente a propósito: definida dentro,
 * React la vería como un tipo nuevo en cada render y desmontaría el ejercicio,
 * que perdería su progreso.
 */
function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { colores: t, tipografia } = useTema();
  return (
    <View style={estilos.seccion}>
      <Text style={[estilos.tituloSeccion, { color: t.ink, fontFamily: tipografia.display }]} role="heading">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

/**
 * Un capítulo de la Guía (ADR-031). Siempre el mismo orden: para qué sirve,
 * cómo se hace, un ejercicio, consejos con la etiqueta de su origen
 * (investigación, Lorayne, FSRS o regla de Ancla) y las fuentes.
 */
export default function CapituloGuia() {
  const { capitulo: id } = useLocalSearchParams<{ capitulo: string }>();
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const capitulo = capituloPorId(id);

  if (!capitulo) {
    return (
      <View style={[estilos.raiz, estilos.centro, { backgroundColor: t.bg }]}>
        <Text style={[estilos.parrafo, { color: t.ink }]}>Ese capítulo no existe.</Text>
        <BotonGuia texto="Ver la guía" onPress={() => router.replace('/guia' as never)} />
      </View>
    );
  }

  const numero = CAPITULOS.indexOf(capitulo) + 1;
  const siguiente = siguienteCapitulo(capitulo.id);
  const tarjeta = [cardStyle(tema), { borderRadius: forma.rRow, borderColor: t.borderMuted ?? 'transparent' }];

  return (
    <View style={[estilos.raiz, { backgroundColor: t.bg }]}>
      <HeaderFlotante titulo="Guía" volverA="/guia" />
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={[estilos.antetitulo, { color: t.accent1 }]}>
          CAPÍTULO {numero} · {capitulo.minutos} MIN
        </Text>
        <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]} role="heading">
          {capitulo.titulo}
        </Text>

        <Seccion titulo="Para qué sirve">
          {capitulo.paraQue.map((p) => (
            <Text key={p} style={[estilos.parrafo, { color: t.ink }]}>
              {p}
            </Text>
          ))}
        </Seccion>

        <Seccion titulo="Cómo se hace">
          {capitulo.pasos.map((paso, i) => (
            <View key={paso.titulo} style={estilos.paso}>
              <View style={[estilos.numeroPaso, { backgroundColor: t.ink }]}>
                <Text style={[estilos.numeroPasoTexto, { color: t.bg, fontFamily: tipografia.display }]}>{i + 1}</Text>
              </View>
              <View style={estilos.textoPaso}>
                <Text style={[estilos.tituloPaso, { color: t.ink, fontFamily: tipografia.display }]}>{paso.titulo}</Text>
                <Text style={[estilos.parrafo, { color: t.inkMuted }]}>{paso.texto}</Text>
              </View>
            </View>
          ))}
          {capitulo.id === 'alfabeto' ? <TablaFonetica /> : null}
        </Seccion>

        <Seccion titulo="Pruébalo">
          <View style={[estilos.practica, ...tarjeta, forma.sombraCard]}>{PRACTICAS[capitulo.practica]()}</View>
        </Seccion>

        <Seccion titulo="Para recordar más">
          {capitulo.consejos.map((consejo) => (
            <View key={consejo.titulo} style={[estilos.consejo, ...tarjeta]}>
              <View style={estilos.cabezaConsejo}>
                <Text style={[estilos.tituloConsejo, { color: t.ink, fontFamily: tipografia.display }]}>{consejo.titulo}</Text>
                <Text style={[estilos.base, { color: t.inkMuted, backgroundColor: t.cardAlt, borderRadius: forma.rPill }]}>
                  {ETIQUETA_BASE[consejo.base]}
                </Text>
              </View>
              <Text style={[estilos.parrafo, { color: t.ink }]}>{consejo.texto}</Text>
            </View>
          ))}
        </Seccion>

        <View style={estilos.acciones}>
          {capitulo.practicarEn ? (
            <BotonGuia texto={capitulo.practicarEn.etiqueta} onPress={() => router.push(capitulo.practicarEn!.ruta as never)} />
          ) : null}
          {siguiente ? (
            <BotonGuia
              texto={`Siguiente: ${siguiente.titulo}`}
              variante={capitulo.practicarEn ? 'secundario' : 'principal'}
              onPress={() => router.push(`/guia/${siguiente.id}` as never)}
            />
          ) : (
            <BotonGuia texto="Volver a la guía" variante="secundario" onPress={() => router.push('/guia' as never)} />
          )}
        </View>

        <Seccion titulo="Fuentes">
          {capitulo.fuentes.map((idFuente) => {
            const fuente = FUENTES[idFuente];
            return (
              <Pressable
                key={idFuente}
                onPress={() => Linking.openURL(fuente.url)}
                accessibilityRole="link"
                style={({ pressed }) => [estilos.fuente, pressed && { opacity: 0.6 }]}
              >
                <Text style={[estilos.textoFuente, { color: t.inkMuted }]}>
                  {fuente.cita} <Text style={{ color: t.accent1, fontWeight: '800' }}>Abrir ↗</Text>
                </Text>
              </Pressable>
            );
          })}
        </Seccion>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  centro: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  contenido: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 140, gap: 22 },
  antetitulo: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.1 },
  titulo: { fontSize: 28, fontWeight: '800', lineHeight: 33, marginTop: -14 },
  seccion: { gap: 10 },
  tituloSeccion: { fontSize: 18, fontWeight: '800' },
  parrafo: { fontSize: 15.5, lineHeight: 23 },
  paso: { flexDirection: 'row', gap: 12 },
  numeroPaso: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numeroPasoTexto: { fontSize: 13.5, fontWeight: '800' },
  textoPaso: { flex: 1, gap: 2 },
  tituloPaso: { fontSize: 16, fontWeight: '800' },
  practica: { padding: 16, borderWidth: 1 },
  consejo: { padding: 14, gap: 6, borderWidth: 1 },
  cabezaConsejo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tituloConsejo: { flex: 1, fontSize: 15.5, fontWeight: '800' },
  base: { fontSize: 11.5, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  acciones: { gap: 10 },
  fuente: { paddingVertical: 4 },
  textoFuente: { fontSize: 13, lineHeight: 19 },
});
