import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { obtenerBD } from '../../db/client';
import { listarTarjetasPorMazo, obtenerMazoPorCategoria } from '../../db/repository';
import { useTema } from '../../stores/tema';
import { recetaForma } from '../../tema/colores';
import { cartaDeTarjeta, numeroDeColgadero } from '../hojear-logic';

/**
 * Piezas comunes de los ejercicios de la Guía (ADR-031). Los ejercicios usan
 * las palabras REALES del usuario: si editó su colgadero o sus naipes, la
 * Guía enseña con las suyas, no con las de la semilla.
 */

export function BotonGuia({
  texto,
  onPress,
  variante = 'principal',
  deshabilitado,
  estilo,
}: {
  texto: string;
  onPress: () => void;
  variante?: 'principal' | 'secundario';
  deshabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const principal = variante === 'principal';
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: principal ? t.accent1 : t.track, borderRadius: forma.rBtn },
        (pressed || deshabilitado) && { opacity: 0.7 },
        estilo,
      ]}
    >
      <Text style={[estilos.textoBoton, { color: principal ? t.inkOnAccent : t.ink, fontFamily: tipografia.display }]}>
        {texto}
      </Text>
    </Pressable>
  );
}

/** Opción pequeña y seleccionable (palos, valores, ejemplos). */
export function Ficha({
  children,
  activa,
  onPress,
  etiqueta,
  estilo,
}: {
  children: ReactNode;
  activa?: boolean;
  onPress: () => void;
  etiqueta?: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: !!activa }}
      style={({ pressed }) => [
        estilos.ficha,
        {
          backgroundColor: activa ? t.ink : t.card,
          borderColor: activa ? t.ink : (t.borderMuted ?? t.track),
          borderRadius: forma.rIcon,
        },
        pressed && { opacity: 0.75 },
        estilo,
      ]}
    >
      <Text style={[estilos.textoFicha, { color: activa ? t.bg : t.ink, fontFamily: tipografia.display }]}>
        {children}
      </Text>
    </Pressable>
  );
}

async function tarjetasDe(categoria: 'colgadero' | 'naipe') {
  const db = await obtenerBD();
  const mazo = await obtenerMazoPorCategoria(db, categoria);
  return mazo ? listarTarjetasPorMazo(db, mazo.id) : [];
}

/** número → palabra del colgadero del usuario. `null` mientras carga. */
export function usePalabrasColgadero(): Map<number, string> | null {
  const [mapa, setMapa] = useState<Map<number, string> | null>(null);
  useEffect(() => {
    let vigente = true;
    tarjetasDe('colgadero')
      .then((tarjetas) => {
        const m = new Map<number, string>();
        for (const t of tarjetas) {
          const n = numeroDeColgadero(t);
          if (n !== null && t.contenido_reverso.trim()) m.set(n, t.contenido_reverso.trim());
        }
        if (vigente) setMapa(m);
      })
      .catch(() => vigente && setMapa(new Map()));
    return () => {
      vigente = false;
    };
  }, []);
  return mapa;
}

/** «valor-palo» → palabra del naipe del usuario. `null` mientras carga. */
export function usePalabrasNaipe(): Map<string, string> | null {
  const [mapa, setMapa] = useState<Map<string, string> | null>(null);
  useEffect(() => {
    let vigente = true;
    tarjetasDe('naipe')
      .then((tarjetas) => {
        const m = new Map<string, string>();
        for (const t of tarjetas) {
          const carta = cartaDeTarjeta(t);
          if (carta && t.contenido_reverso.trim()) m.set(`${carta.valor}-${carta.palo}`, t.contenido_reverso.trim());
        }
        if (vigente) setMapa(m);
      })
      .catch(() => vigente && setMapa(new Map()));
    return () => {
      vigente = false;
    };
  }, []);
  return mapa;
}

const estilos = StyleSheet.create({
  boton: { minHeight: 46, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  textoBoton: { fontSize: 15, fontWeight: '800' },
  ficha: { minWidth: 44, minHeight: 40, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  textoFicha: { fontSize: 15, fontWeight: '700' },
});
