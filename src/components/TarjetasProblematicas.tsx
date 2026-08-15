import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { Categoria, FilaTarjeta, MetadataListaItem } from '../db/tipos';
import type { TarjetaProblematica } from '../domain/estadisticas/retencion';

interface Props {
  tarjetas: TarjetaProblematica[];
}

const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  colgadero: 'Colgadero',
  naipe: 'Naipes',
  lista_item: 'Lista',
  numero: 'Número',
};

/**
 * A dónde enlaza "editar" por categoría. `colgadero` apunta a su índice aun
 * sin tener edición propia hoy (hueco real, confirmado — no se inventa un
 * editor de colgadero en esta fase); `naipe`/`numero` ya la tienen inline en
 * su índice; `lista_item` necesita la lista específica, no el índice
 * genérico de listas.
 */
export function rutaEditar(tarjeta: FilaTarjeta): '/colgadero' | '/naipes' | '/numeros' | `/listas/${string}` {
  switch (tarjeta.categoria) {
    case 'colgadero':
      return '/colgadero';
    case 'naipe':
      return '/naipes';
    case 'numero':
      return '/numeros';
    case 'lista_item': {
      const { lista_id } = JSON.parse(tarjeta.metadata_categoria) as MetadataListaItem;
      return `/listas/${lista_id}`;
    }
  }
}

/** Peor primero (agent_docs/modulos/08-panel-retencion.md §4) — el orden ya viene decidido por calcularPanelRetencion. */
export function TarjetasProblematicas({ tarjetas }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Tarjetas problemáticas</Text>
      {tarjetas.length === 0 ? (
        <Text style={estilos.vacio}>Ninguna por ahora.</Text>
      ) : (
        tarjetas.map(({ tarjeta, vecesRevisada, tasaRetencion }) => (
          <Link key={tarjeta.id} href={rutaEditar(tarjeta)} style={estilos.fila}>
            <Text style={estilos.insignia}>{ETIQUETA_CATEGORIA[tarjeta.categoria]}</Text>
            <Text style={estilos.texto}>
              {tarjeta.contenido_frente} → {tarjeta.contenido_reverso}
            </Text>
            <Text style={estilos.detalle}>
              {tarjeta.fsrs_lapses} lapsos · {vecesRevisada} revisiones
              {tasaRetencion !== null ? ` · ${Math.round(tasaRetencion * 100)}% retención` : ''}
            </Text>
          </Link>
        ))
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 8 },
  titulo: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  vacio: { color: '#a6adc8' },
  fila: { backgroundColor: '#313244', borderRadius: 10, padding: 12, gap: 2 },
  insignia: { color: '#f9e2af', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  texto: { color: '#ffffff', fontSize: 15 },
  detalle: { color: '#f38ba8', fontSize: 12 },
});
