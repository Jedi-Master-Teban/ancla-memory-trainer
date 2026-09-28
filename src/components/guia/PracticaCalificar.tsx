import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ESCENARIOS_CALIFICAR } from '../../domain/guia/contenido';
import type { Calificacion } from '../../domain/fsrs/scheduler';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { BotonGuia } from './comun';

/** Capítulo de fundamentos: ¿qué nota le das a cada situación? */
export function PracticaCalificar() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const [indice, setIndice] = useState(0);
  const [elegida, setElegida] = useState<Calificacion | null>(null);
  const [aciertos, setAciertos] = useState(0);

  const OPCIONES: { valor: Calificacion; etiqueta: string; color: string }[] = [
    { valor: 'otra_vez', etiqueta: 'Otra vez', color: t.otraVez },
    { valor: 'dificil', etiqueta: 'Difícil', color: t.dificil },
    { valor: 'bien', etiqueta: 'Bien', color: t.bien },
    { valor: 'facil', etiqueta: 'Fácil', color: t.facil },
  ];

  if (indice >= ESCENARIOS_CALIFICAR.length) {
    return (
      <View style={estilos.bloque}>
        <Text style={[estilos.resultado, { color: t.ink, fontFamily: tipografia.display }]}>
          {aciertos} de {ESCENARIOS_CALIFICAR.length}
        </Text>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>
          {aciertos === ESCENARIOS_CALIFICAR.length
            ? 'Calificas como FSRS espera: así tus repasos llegan justo a tiempo.'
            : 'La clave: califica solo por cuánto te costó recordar antes de ver la respuesta.'}
        </Text>
        <BotonGuia
          texto="Repetir"
          variante="secundario"
          onPress={() => {
            setIndice(0);
            setElegida(null);
            setAciertos(0);
          }}
        />
      </View>
    );
  }

  const escenario = ESCENARIOS_CALIFICAR[indice];
  const correcta = OPCIONES.find((o) => o.valor === escenario.correcta)!;

  return (
    <View style={estilos.bloque}>
      <Text style={[estilos.contador, { color: t.inkMuted }]}>
        Situación {indice + 1} de {ESCENARIOS_CALIFICAR.length}
      </Text>
      <Text style={[estilos.situacion, { color: t.ink, fontFamily: tipografia.display }]}>{escenario.situacion}</Text>
      <View style={estilos.botones}>
        {OPCIONES.map((o) => {
          const marcada = elegida === o.valor;
          return (
            <Pressable
              key={o.valor}
              disabled={elegida !== null}
              onPress={() => {
                setElegida(o.valor);
                if (o.valor === escenario.correcta) setAciertos((n) => n + 1);
              }}
              accessibilityRole="button"
              accessibilityLabel={o.etiqueta}
              style={[
                estilos.botonNota,
                { backgroundColor: o.color, borderRadius: forma.rBtn },
                elegida !== null && !marcada && o.valor !== escenario.correcta && { opacity: 0.35 },
                marcada && estilos.marcada,
              ]}
            >
              <Text style={[estilos.textoNota, { color: t.inkOnAccent, fontFamily: tipografia.display }]} numberOfLines={1} adjustsFontSizeToFit>
                {o.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {elegida !== null ? (
        <View style={[estilos.respuesta, { backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]} aria-live="polite">
          <Text style={[estilos.veredicto, { color: elegida === escenario.correcta ? t.bien : t.otraVez }]}>
            {elegida === escenario.correcta ? '✓ Eso es' : `Era «${correcta.etiqueta}»`}
          </Text>
          <Text style={[estilos.texto, { color: t.ink }]}>{escenario.explicacion}</Text>
          <BotonGuia
            texto={indice + 1 < ESCENARIOS_CALIFICAR.length ? 'Siguiente situación' : 'Ver resultado'}
            onPress={() => {
              setIndice((i) => i + 1);
              setElegida(null);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12 },
  contador: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.4 },
  situacion: { fontSize: 17, fontWeight: '700', lineHeight: 23 },
  botones: { flexDirection: 'row', gap: 6 },
  botonNota: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  marcada: { transform: [{ scale: 1.04 }] },
  textoNota: { fontSize: 14, fontWeight: '800' },
  respuesta: { padding: 14, gap: 8 },
  veredicto: { fontSize: 15, fontWeight: '800' },
  texto: { fontSize: 15, lineHeight: 21 },
  resultado: { fontSize: 28, fontWeight: '800' },
});
