import { StyleSheet, Text, View } from 'react-native';
import type { Categoria, FilaTarjeta } from '../db/tipos';
import { useTema } from '../stores/tema';
import { cardStyle, recetaForma } from '../tema/colores';
import { CaraFisica } from './CartaVisual';
import { cartaDeTarjeta, numeroDeColgadero, restriccionDeNaipe } from './hojear-logic';

/** Alto fijo de la tarjeta del carrusel. El ancho lo decide la pantalla. */
export const ALTO_TARJETA = 360;

interface Props {
  tarjeta: FilaTarjeta;
  categoria: Categoria;
  /** true = el reverso se sustituye por la caja «?» (toque sobre la tarjeta). */
  oculto: boolean;
}

/**
 * Cara de una tarjeta en modo Hojear (DESIGN.md §9.2): frente y reverso a la
 * vez, sin botones de calificación y sin pausa de visualización. Un toque
 * oculta el reverso para autoevaluarse; volver a tocar lo muestra.
 *
 * Cuatro caras, un solo esqueleto (centrado, gap 16):
 *   colgadero → número 64 display accent1 · filete 38×1 · palabra 26 display
 *   naipe     → CaraFisica + palabra 24 display, o el hueco con su restricción
 *   numero    → etiqueta 13/800 uppercase muted · dígitos 34 display
 *   lista_item→ texto 24 display
 */
export function TarjetaHojear({ tarjeta, categoria, oculto }: Props) {
  const { colores: t, tipografia, tema } = useTema();
  const forma = recetaForma(tema);

  const cajaOculta = (
    <View style={[estilos.oculto, { borderColor: t.inkMuted, borderRadius: forma.rIcon }]}>
      <Text style={[estilos.interrogacion, { color: t.inkMuted, fontFamily: tipografia.display }]}>?</Text>
    </View>
  );

  let contenido: React.ReactNode = null;

  if (categoria === 'colgadero') {
    const numero = numeroDeColgadero(tarjeta) ?? tarjeta.contenido_frente;
    contenido = (
      <>
        <Text style={[estilos.numeroGrande, { color: t.accent1, fontFamily: tipografia.display }]}>{numero}</Text>
        <View style={[estilos.filete, { backgroundColor: t.borderMuted ?? t.track }]} />
        {oculto ? (
          cajaOculta
        ) : (
          <Text style={[estilos.reversoGrande, { color: t.ink, fontFamily: tipografia.display }]}>
            {tarjeta.contenido_reverso || 'sin asignar'}
          </Text>
        )}
      </>
    );
  } else if (categoria === 'naipe') {
    const carta = cartaDeTarjeta(tarjeta);
    const sinPalabra = tarjeta.contenido_reverso.trim() === '';
    contenido = (
      <>
        {carta ? <CaraFisica carta={carta} /> : null}
        {oculto ? (
          cajaOculta
        ) : sinPalabra ? (
          <View style={estilos.hueco}>
            <Text style={[estilos.huecoTitulo, { color: t.inkMuted, fontFamily: tipografia.display }]}>
              Sin palabra asignada
            </Text>
            {carta ? (
              <Text style={[estilos.huecoRestriccion, { color: t.accent1 }]}>{restriccionDeNaipe(carta)}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={[estilos.reversoMedio, { color: t.ink, fontFamily: tipografia.display }]}>
            {tarjeta.contenido_reverso}
          </Text>
        )}
      </>
    );
  } else if (categoria === 'numero') {
    contenido = (
      <>
        <Text style={[estilos.etiqueta, { color: t.inkMuted }]}>{tarjeta.contenido_frente}</Text>
        {oculto ? (
          cajaOculta
        ) : (
          <Text style={[estilos.digitos, { color: t.ink, fontFamily: tipografia.display }]}>
            {tarjeta.contenido_reverso}
          </Text>
        )}
      </>
    );
  } else {
    contenido = oculto ? (
      cajaOculta
    ) : (
      <Text style={[estilos.reversoMedio, { color: t.ink, fontFamily: tipografia.display }]}>
        {tarjeta.contenido_frente || tarjeta.contenido_reverso}
      </Text>
    );
  }

  return (
    <View
      style={[
        estilos.tarjeta,
        cardStyle(tema),
        forma.sombraCard,
        { borderRadius: forma.rCard, borderColor: t.borderMuted ?? 'transparent' },
      ]}
    >
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    height: ALTO_TARJETA,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 22,
  },
  numeroGrande: { fontSize: 64, fontWeight: '700', lineHeight: 68 },
  filete: { width: 38, height: 1 },
  reversoGrande: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  reversoMedio: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  etiqueta: { fontSize: 13, fontWeight: '800', letterSpacing: 0.08, textTransform: 'uppercase', textAlign: 'center' },
  digitos: { fontSize: 34, fontWeight: '700', textAlign: 'center' },
  hueco: { alignItems: 'center', gap: 7 },
  huecoTitulo: { fontSize: 19, fontWeight: '700', textAlign: 'center' },
  huecoRestriccion: { fontSize: 12, fontWeight: '700', letterSpacing: 0.04, textAlign: 'center' },
  oculto: {
    width: 150,
    height: 64,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interrogacion: { fontSize: 34, fontWeight: '700', opacity: 0.5 },
});
