import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Calificacion } from '../domain/fsrs/scheduler';
import { recetaBotonCalificacion } from '../tema/colores';
import { useTema } from '../stores/tema';

interface Props {
  onCalificar: (calificacion: Calificacion) => void;
}

/**
 * Los 4 niveles de FSRS (§8.1). Nota de robustez en iOS: NO se combina
 * `fontWeight` con una `fontFamily` que ya lleva el peso en el nombre
 * (`Fredoka_600SemiBold`, `Lora_600SemiBold`). Pedir las dos cosas obliga a
 * iOS a resolver una cara que no existe, y el texto puede no pintarse.
 * `fontWeight` solo se aplica cuando no hay familia propia (letra del sistema).
 *
 * `numberOfLines` + `adjustsFontSizeToFit` evitan además que una etiqueta
 * larga ("Otra vez") desborde su botón en pantallas angostas.
 */
export function BotonesCalificacion({ onCalificar }: Props) {
  const { tema, colores: t, tipografia } = useTema();
  const OPCIONES: { valor: Calificacion; etiqueta: string; color: string }[] = [
    { valor: 'otra_vez', etiqueta: 'Otra vez', color: t.otraVez },
    { valor: 'dificil', etiqueta: 'Difícil', color: t.dificil },
    { valor: 'bien', etiqueta: 'Bien', color: t.bien },
    { valor: 'facil', etiqueta: 'Fácil', color: t.facil },
  ];

  return (
    <View style={estilos.fila}>
      {OPCIONES.map((opcion) => {
        const receta = recetaBotonCalificacion(tema, opcion.color);
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => onCalificar(opcion.valor)}
            style={[estilos.boton, receta.contenedor]}
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
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  boton: { flex: 1, minWidth: 0, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  texto: { fontSize: 14, textAlign: 'center' },
  pesoSistema: { fontWeight: '600' },
});
