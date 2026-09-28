import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDialogoStore, type BotonDialogo } from '../stores/dialogo';
import { useTema } from '../stores/tema';
import { recetaForma } from '../tema/colores';

/**
 * Pinta el diálogo en curso de `stores/dialogo` (ADR-029): una tarjeta Soft UI
 * sobre un velo, con los botones de la app en vez de la ventana del sistema.
 * Va una sola vez, al final de `app/_layout.tsx`, por encima de todo.
 *
 * Tocar fuera equivale a «Cancelar» cuando hay un botón que cancela; si el
 * diálogo solo informa, hay que pulsar su botón. En web, Escape también cancela.
 */
export function DialogoHost() {
  const actual = useDialogoStore((s) => s.cola[0]);
  const responder = useDialogoStore((s) => s.responder);
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const aparicion = useRef(new Animated.Value(0)).current;
  const [sinMovimiento, setSinMovimiento] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSinMovimiento);
  }, []);

  const idActual = actual?.id;
  useEffect(() => {
    if (idActual === undefined) return;
    aparicion.setValue(sinMovimiento ? 1 : 0);
    Animated.timing(aparicion, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [idActual, aparicion, sinMovimiento]);

  const cancelable = actual?.botones.some((b) => b.valor === false) ?? false;

  useEffect(() => {
    if (Platform.OS !== 'web' || idActual === undefined || !cancelable) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') responder(false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [idActual, cancelable, responder]);

  if (!actual) return null;

  const pulsar = (boton: BotonDialogo) => {
    boton.alPulsar?.();
    responder(boton.valor);
  };

  const colorDeFondo = (b: BotonDialogo) =>
    b.estilo === 'destructivo' ? t.otraVez : b.estilo === 'secundario' ? t.track : t.accent1;
  const colorDeTexto = (b: BotonDialogo) => (b.estilo === 'secundario' ? t.ink : t.inkOnAccent);
  const enFila = actual.botones.length <= 2;

  return (
    <View style={estilos.capa} pointerEvents="box-none">
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,18,16,0.38)' }]}
        onPress={cancelable ? () => responder(false) : undefined}
        accessibilityLabel={cancelable ? 'Cerrar' : undefined}
        accessible={cancelable}
      />
      <Animated.View
        role="alertdialog"
        aria-modal
        aria-label={actual.titulo}
        accessibilityViewIsModal
        style={[
          estilos.tarjeta,
          forma.sombraCard,
          { backgroundColor: t.card, borderRadius: forma.rCard, borderColor: t.borderMuted ?? 'transparent' },
          {
            opacity: aparicion,
            transform: [{ scale: aparicion.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
          },
        ]}
      >
        <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>{actual.titulo}</Text>
        {actual.mensaje ? <Text style={[estilos.mensaje, { color: t.inkMuted }]}>{actual.mensaje}</Text> : null}
        <View style={[estilos.botones, enFila ? estilos.botonesEnFila : null]}>
          {actual.botones.map((boton) => (
            <Pressable
              key={boton.texto}
              onPress={() => pulsar(boton)}
              accessibilityRole="button"
              style={({ pressed }) => [
                estilos.boton,
                enFila ? estilos.botonEnFila : null,
                { backgroundColor: colorDeFondo(boton), borderRadius: forma.rBtn },
                pressed && estilos.presionado,
              ]}
            >
              <Text style={[estilos.textoBoton, { color: colorDeTexto(boton), fontFamily: tipografia.display }]}>
                {boton.texto}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tarjeta: { width: '100%', maxWidth: 380, padding: 22, gap: 10, borderWidth: 1 },
  titulo: { fontSize: 19, fontWeight: '700' },
  mensaje: { fontSize: 15, lineHeight: 21 },
  botones: { marginTop: 10, gap: 10 },
  botonesEnFila: { flexDirection: 'row' },
  boton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  botonEnFila: { flex: 1 },
  textoBoton: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  presionado: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
