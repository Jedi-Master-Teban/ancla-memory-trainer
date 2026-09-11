import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Calificacion } from '../domain/fsrs/scheduler';
import type { IntervalosPrevistos } from '../domain/fsrs/preview';
import { recetaBotonCalificacion } from '../tema/colores';
import { useTema } from '../stores/tema';

interface Props {
  onCalificar: (calificacion: Calificacion) => void;
  /**
   * Cuándo volvería la tarjeta con cada respuesta, ya formateado. Calcúlalo
   * con `intervalosPrevistos(tarjeta, ahora)` — nunca a mano. Si no se pasa,
   * los botones salen sin subtítulo (mismo aspecto que v1).
   */
  intervalos?: IntervalosPrevistos;
}

/**
 * Los 4 niveles de FSRS (§8.1).
 *
 * Nota de robustez en iOS: NO se combina `fontWeight` con una `fontFamily`
 * que ya lleva el peso en el nombre (`Fredoka_600SemiBold`,
 * `Lora_600SemiBold`). Pedir las dos cosas obliga a iOS a resolver una cara
 * que no existe, y el texto puede no pintarse. `fontWeight` solo se aplica
 * cuando no hay familia propia (letra del sistema).
 *
 * `numberOfLines` + `adjustsFontSizeToFit` evitan además que una etiqueta
 * larga ("Otra vez") desborde su botón en pantallas angostas.
 *
 * Fase 8 v2 (DESIGN.md §5.5): cada botón muestra su intervalo real debajo.
 * El punto no es informar del algoritmo: es que la calificación deje de ser
 * una opinión sobre uno mismo («¿fue difícil?») y pase a ser una decisión con
 * consecuencia visible («esto vuelve en 6 días»). Con el intervalo a la vista
 * la gente califica más honestamente.
 *
 * Los cuatro botones se renderizan siempre desde un solo array con `flex: 1`
 * y `minWidth: 0` — eso cierra el bug de «Bien» y «Fácil» desaparecidos, que
 * era desborde horizontal, no lógica.
 */
export function BotonesCalificacion({ onCalificar, intervalos }: Props) {
  const { tema, colores: t, tipografia } = useTema();
  const OPCIONES: { valor: Calificacion; etiqueta: string; color: string }[] = [
    { valor: 'otra_vez', etiqueta: 'Otra vez', color: t.otraVez },
    { valor: 'dificil', etiqueta: 'Difícil', color: t.dificil },
    { valor: 'bien', etiqueta: 'Bien', color: t.bien },
    { valor: 'facil', etiqueta: 'Fácil', color: t.facil },
  ];

  return (
    <View>
      <Text style={[estilos.pregunta, { color: t.inkMuted }, tipografia.body ? { fontFamily: tipografia.body } : null]}>
        ¿Qué tan fácil fue recordarla?
      </Text>
      <View style={estilos.fila}>
        {OPCIONES.map((opcion) => {
          const receta = recetaBotonCalificacion(tema, opcion.color);
          return (
            <Pressable
              key={opcion.valor}
              onPress={() => onCalificar(opcion.valor)}
              accessibilityRole="button"
              accessibilityLabel={
                intervalos
                  ? `${opcion.etiqueta}. Vuelve en ${intervalos[opcion.valor]}.`
                  : opcion.etiqueta
              }
              style={({ pressed }) => [
                estilos.boton,
                receta.contenedor,
                pressed && { transform: [{ translateY: 2 }] },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  estilos.texto,
                  receta.texto,
                  tipografia.display ? { fontFamily: tipografia.display } : estilos.pesoSistema,
                ]}
              >
                {opcion.etiqueta}
              </Text>
              {intervalos ? (
                <Text
                  numberOfLines={1}
                  style={[
                    estilos.intervalo,
                    receta.texto,
                    tipografia.body ? { fontFamily: tipografia.body } : null,
                  ]}
                >
                  {intervalos[opcion.valor]}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pregunta: { fontSize: 11, textAlign: 'center', marginBottom: 10, letterSpacing: 0.3 },
  fila: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  boton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  texto: { fontSize: 13, textAlign: 'center' },
  // Hereda el color del botón y se baja al 80 %: es un dato de apoyo, no un
  // segundo nivel de jerarquía.
  intervalo: { fontSize: 10, textAlign: 'center', opacity: 0.8 },
  pesoSistema: { fontWeight: '600' },
});
