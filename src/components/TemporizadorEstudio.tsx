import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  segundos: number;
  onTerminar: () => void;
}

/**
 * Cuenta regresiva de la fase de memorización (04-listas-cadena.md §4):
 * `segundos` es `lista.segundos_estudio`, configurable por lista. Usa el
 * delta contra `Date.now()` (no un decremento ingenuo cada 1000ms) para no
 * acumular desfase — mismo criterio de tiempo real que baraja-completa.tsx.
 */
export function TemporizadorEstudio({ segundos, onTerminar }: Props) {
  const [restante, setRestante] = useState(segundos);

  useEffect(() => {
    setRestante(segundos);
    if (segundos <= 0) {
      onTerminar();
      return;
    }
    const inicio = Date.now();
    const id = setInterval(() => {
      const paso = Math.max(0, segundos - Math.floor((Date.now() - inicio) / 1000));
      setRestante(paso);
      if (paso <= 0) {
        clearInterval(id);
        onTerminar();
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundos]);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{restante}s</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', paddingVertical: 8 },
  texto: { color: '#f9e2af', fontSize: 20, fontWeight: '600' },
});
