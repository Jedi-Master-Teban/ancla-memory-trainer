import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { descartarRecuperacion, recargarApp, restaurarCopiaAutomatica } from '../db/respaldo';
import { describirFecha, resumenLegible, type MetaCopia } from '../domain/respaldo/copias';
import { avisar, confirmar } from '../stores/dialogo';
import { useTema } from '../stores/tema';
import { cardStyle, recetaForma } from '../tema/colores';

interface Props {
  copia: MetaCopia;
  /** El usuario eligió empezar de cero: se entra a la app con la base vacía. */
  onContinuar: () => void;
}

/**
 * Se muestra en lugar de la app cuando la base aparece vacía pero hay una copia
 * automática con progreso (ADR-029): la señal de que algo borró los datos,
 * porque la base nunca pierde progreso por sí sola.
 */
export function PantallaRecuperacion({ copia, onContinuar }: Props) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const [ocupado, setOcupado] = useState(false);

  async function recuperar() {
    setOcupado(true);
    try {
      await restaurarCopiaAutomatica(copia.id);
      recargarApp();
    } catch (e) {
      await avisar({ titulo: 'No se pudo recuperar', mensaje: e instanceof Error ? e.message : String(e) });
      setOcupado(false);
    }
  }

  async function empezarDeCero() {
    const seguro = await confirmar({
      titulo: 'Empezar de cero',
      mensaje:
        'No volveré a ofrecerte esta copia al abrir. Seguirá guardada unos días en Ajustes → Tus datos, por si cambias de opinión.',
      accion: 'Empezar de cero',
    });
    if (!seguro) return;
    await descartarRecuperacion(copia);
    onContinuar();
  }

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={estilos.contenedor}>
      <View
        style={[
          estilos.tarjeta,
          cardStyle(tema),
          forma.sombraCard,
          { borderRadius: forma.rCard, borderColor: t.borderMuted ?? 'transparent' },
        ]}
      >
        <Text style={[estilos.antetitulo, { color: t.accent1 }]}>TUS DATOS</Text>
        <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>
          Encontré una copia de tus datos
        </Text>
        <Text style={[estilos.cuerpo, { color: t.inkMuted }]}>
          Ancla abrió sin tu progreso, pero guardó una copia {describirFecha(copia.creadaEn, new Date())}:
        </Text>
        <Text style={[estilos.resumen, { color: t.ink, backgroundColor: t.cardAlt, borderRadius: forma.rIcon }]}>
          {resumenLegible(copia.resumen)}
        </Text>
        <Text style={[estilos.cuerpo, { color: t.inkMuted }]}>
          Recuperarla trae de vuelta tus repasos, tu racha y tus listas tal como estaban en ese momento.
        </Text>
        <Pressable
          onPress={recuperar}
          disabled={ocupado}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.boton,
            forma.sombraCta(t),
            { backgroundColor: t.accent1, borderRadius: forma.rBtn },
            (pressed || ocupado) && estilos.presionado,
          ]}
        >
          <Text style={[estilos.textoBoton, { color: t.inkOnAccent, fontFamily: tipografia.display }]}>
            {ocupado ? 'Recuperando…' : 'Recuperar mis datos'}
          </Text>
        </Pressable>
        <Pressable
          onPress={empezarDeCero}
          disabled={ocupado}
          accessibilityRole="button"
          style={({ pressed }) => [estilos.boton, { backgroundColor: t.track, borderRadius: forma.rBtn }, pressed && estilos.presionado]}
        >
          <Text style={[estilos.textoBoton, { color: t.ink, fontFamily: tipografia.display }]}>Empezar de cero</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  tarjeta: { padding: 24, gap: 12, borderWidth: 1 },
  antetitulo: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  titulo: { fontSize: 24, fontWeight: '700', lineHeight: 29 },
  cuerpo: { fontSize: 15, lineHeight: 21 },
  resumen: { fontSize: 15, fontWeight: '700', padding: 12, overflow: 'hidden' },
  boton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textoBoton: { fontSize: 16, fontWeight: '800' },
  presionado: { opacity: 0.85 },
});
