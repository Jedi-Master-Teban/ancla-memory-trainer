import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const MODOS = [
  { href: '/colgadero/flash' as const, etiqueta: 'Fonética Flash', descripcion: 'Número → palabra' },
  { href: '/colgadero/reverso' as const, etiqueta: 'Reverso', descripcion: 'Palabra → número' },
  { href: '/colgadero/velocidad' as const, etiqueta: 'Velocidad', descripcion: 'Serie cronometrada' },
];

export default function ColgaderoIndex() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Colgadero</Text>
      {MODOS.map((modo) => (
        <Link key={modo.href} href={modo.href} style={estilos.tarjetaModo}>
          <Text style={estilos.etiqueta}>{modo.etiqueta}</Text>
          <Text style={estilos.descripcion}>{modo.descripcion}</Text>
        </Link>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e1e2e', padding: 24, gap: 16, justifyContent: 'center' },
  titulo: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  tarjetaModo: { backgroundColor: '#313244', borderRadius: 12, padding: 16 },
  etiqueta: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  descripcion: { color: '#a6adc8', fontSize: 13, marginTop: 8 },
});
