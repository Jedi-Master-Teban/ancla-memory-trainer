import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTema } from '../stores/tema';

/**
 * La franja superior limpia de la app instalada.
 *
 * Desde iOS 26, una app web abierta desde la pantalla de inicio lleva el
 * «scroll edge effect» de Liquid Glass: un difuminado de unos 38 pt bajo la
 * barra de estado que iOS dibuja ENCIMA de la página. No hay CSS ni meta que
 * lo apague, y Memo y la racha, que viven justo ahí, se veían lavados.
 *
 * WebKit lo omite cuando el borde superior lo cubre un contenedor fijo con
 * color sólido —el caso de una web con cabecera fija— y entonces pinta la
 * franja del reloj con ese color. La regla está en WebCore
 * (`LocalFrameView::fixedContainerEdges`): mira 4 px bajo el borde, al
 * centro; el contenedor tiene que ser fixed o sticky, cubrir al menos el 90 %
 * del ancho y medir más de 10 px de alto. Con eso, WKWebView oculta el
 * difuminado (`_shouldHideTopScrollPocket`).
 *
 * Esta franja es ese contenedor: 12 px del color del fondo, y el contenido de
 * cada pantalla empieza debajo (`RESERVA_SUPERIOR`, en el contentStyle del
 * Stack). Va por encima de las pantallas y por debajo de la isla, el FAB y
 * los diálogos, para que sus velos la oscurezcan también.
 *
 * Solo en la app instalada: en una pestaña del navegador el difuminado no
 * existe y no hace falta reservar nada.
 */
export const ALTO_BORDE_SUPERIOR = 12;

function esAppInstalada(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
  return Boolean(standalone || (navigator as Navigator & { standalone?: boolean }).standalone);
}

const INSTALADA = esAppInstalada();

/** Cuánto baja el contenido de cada pantalla para no quedar bajo la franja. */
export const RESERVA_SUPERIOR = INSTALADA ? ALTO_BORDE_SUPERIOR : 0;

// react-native-web acepta `position: 'fixed'`; los tipos de React Native no.
const FIJO = { position: 'fixed' } as unknown as ViewStyle;

export function BordeSuperior() {
  const { colores: t } = useTema();
  if (!INSTALADA) return null;
  return <View pointerEvents="none" style={[FIJO, estilos.franja, { backgroundColor: t.bg }]} />;
}

const estilos = StyleSheet.create({
  franja: { top: 0, left: 0, right: 0, height: ALTO_BORDE_SUPERIOR, zIndex: 60 },
});
