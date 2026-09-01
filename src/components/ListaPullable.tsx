import { useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ScrollViewProps } from 'react-native';
import { useTema } from '../stores/tema';

/**
 * ScrollView con pull-to-refresh nativo + haptic feedback en iOS/Android.
 * El spinner usa el color accent del tema activo.
 *
 * Uso:
 *   <ListaPullable onRefrescar={async () => await recargar()}>
 *     <Contenido ... />
 *   </ListaPullable>
 *
 * El callback debe devolver una Promise; mientras esté pendiente, el
 * spinner permanece visible. Un mínimo de 500ms evita parpadeo en
 * actualizaciones rápidas (percepción de agencia del usuario).
 */
interface Props extends Omit<ScrollViewProps, 'refreshControl'> {
  onRefrescar: () => Promise<void> | void;
  /** Mensaje contextual opcional (futuro i18n). */
  mensaje?: string;
}

export function ListaPullable({ onRefrescar, children, ...rest }: Props) {
  const { colores: t } = useTema();
  const [refrescando, setRefrescando] = useState(false);

  const manejarRefresco = useCallback(async () => {
    setRefrescando(true);
    try {
      const promesa = onRefrescar();
      // Haptic al INICIO del refresh — el usuario siente la respuesta de la app
      // (verificado empíricamente: sin haptic el pull parece "muerto").
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // expo-haptics puede no estar disponible en web — silenciar.
      }
      await Promise.all([
        Promise.resolve(promesa),
        new Promise((resolver) => setTimeout(resolver, 500)),
      ]);
    } finally {
      setRefrescando(false);
    }
  }, [onRefrescar]);

  return (
    <ScrollView
      {...rest}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={manejarRefresco}
          tintColor={t.accent1}
          colors={[t.accent1]}
          progressBackgroundColor={t.card}
        />
      }
    >
      <View style={estilos.contenido}>{children}</View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingBottom: 120 },
});
