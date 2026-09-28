import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ESCENA_DE_MUESTRA, LISTA_DE_PRACTICA, opcionesDeRecuerdo } from '../../domain/guia/contenido';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { BotonGuia } from './comun';

const PARES = LISTA_DE_PRACTICA.length - 1;

/**
 * Capítulo de la cadena: encadena cinco objetos y comprueba si la cadena
 * aguanta. Primero se imagina cada par; después, de memoria, qué venía.
 */
export function PracticaCadena() {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const [fase, setFase] = useState<'estudio' | 'prueba' | 'final'>('estudio');
  const [paso, setPaso] = useState(0);
  const [opciones, setOpciones] = useState<string[]>([]);
  const [elegida, setElegida] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);

  const empezarPrueba = () => {
    setFase('prueba');
    setPaso(0);
    setAciertos(0);
    setElegida(null);
    setOpciones(opcionesDeRecuerdo(LISTA_DE_PRACTICA, 0, Math.random));
  };

  if (fase === 'estudio') {
    const a = LISTA_DE_PRACTICA[paso];
    const b = LISTA_DE_PRACTICA[paso + 1];
    return (
      <View style={estilos.bloque}>
        <Text style={[estilos.contador, { color: t.inkMuted }]}>
          Eslabón {paso + 1} de {PARES}
        </Text>
        <View style={estilos.par}>
          <Text style={[estilos.objeto, { color: t.ink, fontFamily: tipografia.display }]}>{a}</Text>
          <Text style={[estilos.flecha, { color: t.accent1 }]}>→</Text>
          <Text style={[estilos.objeto, { color: t.ink, fontFamily: tipografia.display }]}>{b}</Text>
        </View>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>
          {paso === 0
            ? `Por ejemplo: ${ESCENA_DE_MUESTRA} Cierra los ojos un momento y míralo.`
            : 'Imagina una escena absurda y con acción que una estas dos cosas. Tómate unos segundos.'}
        </Text>
        <BotonGuia
          texto={paso + 1 < PARES ? 'Ya la imaginé' : 'Comprobar la cadena'}
          onPress={() => (paso + 1 < PARES ? setPaso((p) => p + 1) : empezarPrueba())}
        />
      </View>
    );
  }

  if (fase === 'final') {
    return (
      <View style={estilos.bloque}>
        <Text style={[estilos.resultado, { color: t.ink, fontFamily: tipografia.display }]}>
          {aciertos} de {PARES} eslabones
        </Text>
        <Text style={[estilos.texto, { color: t.inkMuted }]}>
          {aciertos === PARES
            ? 'La cadena aguantó entera. Mañana, sin mirar, intenta decir la lista completa: ese repaso es el que la fija.'
            : 'Donde falló, la escena era poco clara o se parecía a otra. Hazla más exagerada y distinta.'}
        </Text>
        <BotonGuia
          texto="Volver a empezar"
          variante="secundario"
          onPress={() => {
            setFase('estudio');
            setPaso(0);
          }}
        />
      </View>
    );
  }

  const actual = LISTA_DE_PRACTICA[paso];
  const correcta = LISTA_DE_PRACTICA[paso + 1];
  return (
    <View style={estilos.bloque}>
      <Text style={[estilos.contador, { color: t.inkMuted }]}>
        Pregunta {paso + 1} de {PARES}
      </Text>
      <Text style={[estilos.pregunta, { color: t.ink, fontFamily: tipografia.display }]}>
        ¿Qué venía después de «{actual}»?
      </Text>
      <View style={estilos.opciones}>
        {opciones.map((o) => {
          const esCorrecta = o === correcta;
          const color =
            elegida === null ? t.card : esCorrecta ? t.bien : o === elegida ? t.otraVez : t.card;
          return (
            <Pressable
              key={o}
              disabled={elegida !== null}
              onPress={() => {
                setElegida(o);
                if (esCorrecta) setAciertos((n) => n + 1);
              }}
              accessibilityRole="button"
              style={[
                estilos.opcion,
                { backgroundColor: color, borderColor: t.borderMuted ?? t.track, borderRadius: forma.rIcon },
              ]}
            >
              <Text
                style={[
                  estilos.textoOpcion,
                  {
                    color: elegida !== null && (esCorrecta || o === elegida) ? t.inkOnAccent : t.ink,
                    fontFamily: tipografia.display,
                  },
                ]}
              >
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {elegida !== null ? (
        <BotonGuia
          texto={paso + 1 < PARES ? 'Siguiente' : 'Ver resultado'}
          onPress={() => {
            if (paso + 1 < PARES) {
              setPaso((p) => p + 1);
              setElegida(null);
              setOpciones(opcionesDeRecuerdo(LISTA_DE_PRACTICA, paso + 1, Math.random));
            } else {
              setFase('final');
            }
          }}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12 },
  contador: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.4 },
  par: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  objeto: { fontSize: 22, fontWeight: '800' },
  flecha: { fontSize: 22, fontWeight: '800' },
  texto: { fontSize: 15, lineHeight: 21 },
  pregunta: { fontSize: 18, fontWeight: '700' },
  opciones: { gap: 8 },
  opcion: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1 },
  textoOpcion: { fontSize: 16, fontWeight: '700' },
  resultado: { fontSize: 26, fontWeight: '800' },
});
