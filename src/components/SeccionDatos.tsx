import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { obtenerBD } from '../db/client';
import { estadoProteccion, type EstadoProteccion } from '../db/persistencia';
import { obtenerResumenDatos } from '../db/repository';
import {
  compartirRespaldo,
  elegirArchivoDeRespaldo,
  inspeccionarRespaldo,
  listarCopiasAutomaticas,
  prepararRespaldo,
  recargarApp,
  respaldoDisponible,
  restaurarCopiaAutomatica,
  restaurarRespaldo,
  ultimoRespaldo,
  type RespaldoPreparado,
  type ResultadoEntrega,
} from '../db/respaldo';
import { describirFecha, resumenLegible, type MetaCopia, type TipoCopia } from '../domain/respaldo/copias';
import { avisar, confirmar, preguntar } from '../stores/dialogo';
import { useTema } from '../stores/tema';
import { cardStyle, recetaForma } from '../tema/colores';

const ETIQUETA_TIPO: Record<TipoCopia, string> = {
  diaria: 'diaria',
  'antes-de-actualizar': 'antes de una actualización',
  'antes-de-restaurar': 'antes de restaurar',
};

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props {
  /** Cambia cada vez que Ajustes guarda algo: el respaldo preparado queda viejo y se rehace. */
  cambios: number;
}

/**
 * «Tus datos» en Ajustes (ADR-029): qué protege a los datos del usuario y los
 * botones para llevárselos o traerlos de vuelta.
 *
 * El respaldo se prepara al entrar (serializar es asíncrono) para que el botón
 * pueda abrir el menú de compartir en el mismo toque: iOS solo lo permite
 * durante el gesto. Si aun así no da permiso, un diálogo ofrece un botón nuevo.
 */
export function SeccionDatos({ cambios }: Props) {
  const { colores: t, tema, tipografia } = useTema();
  const forma = recetaForma(tema);
  const [copias, setCopias] = useState<MetaCopia[]>([]);
  const [proteccion, setProteccion] = useState<EstadoProteccion>('no-disponible');
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<'crear' | 'restaurar' | null>(null);
  const preparado = useRef<RespaldoPreparado | null>(null);

  const refrescar = useCallback(async () => {
    const [lista, estado, fecha] = await Promise.all([listarCopiasAutomaticas(), estadoProteccion(), ultimoRespaldo()]);
    setCopias(lista);
    setProteccion(estado);
    setUltimo(fecha);
  }, []);

  const preparar = useCallback(() => {
    if (!respaldoDisponible) return;
    preparado.current = null;
    prepararRespaldo(new Date())
      .then((p) => {
        preparado.current = p;
      })
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refrescar();
      preparar();
    }, [refrescar, preparar]),
  );

  useEffect(() => {
    if (cambios > 0) preparar();
  }, [cambios, preparar]);

  async function tratarEntrega(entrega: Promise<ResultadoEntrega>, respaldo: RespaldoPreparado) {
    const resultado = await entrega;
    if (resultado === 'sin-permiso') {
      await ofrecerGuardar(respaldo);
      return;
    }
    refrescar();
    if (resultado === 'descargado') {
      await avisar({
        titulo: 'Respaldo descargado',
        mensaje:
          'Está en la app Archivos, en Descargas. Si quieres tenerlo fuera del teléfono, muévelo a iCloud Drive.',
      });
    }
  }

  function ofrecerGuardar(respaldo: RespaldoPreparado) {
    return preguntar({
      titulo: 'Tu respaldo está listo',
      mensaje: `${respaldo.nombre} · ${kb(respaldo.tamano)}`,
      botones: [
        { texto: 'Ahora no', estilo: 'secundario', valor: false },
        {
          texto: 'Guardar respaldo',
          estilo: 'principal',
          valor: true,
          alPulsar: () => {
            tratarEntrega(compartirRespaldo(respaldo), respaldo);
          },
        },
      ],
    });
  }

  function crearRespaldo() {
    const listo = preparado.current;
    if (listo) {
      // Sin ningún await antes: el menú de compartir se abre dentro del toque.
      tratarEntrega(compartirRespaldo(listo), listo);
      return;
    }
    (async () => {
      setOcupado('crear');
      try {
        const nuevo = await prepararRespaldo(new Date());
        preparado.current = nuevo;
        await ofrecerGuardar(nuevo);
      } catch (e) {
        await avisar({ titulo: 'No se pudo crear el respaldo', mensaje: String(e) });
      } finally {
        setOcupado(null);
      }
    })();
  }

  async function confirmarYRestaurar(resumenCopia: string, restaurar: () => Promise<void>) {
    const actual = resumenLegible(await obtenerResumenDatos(await obtenerBD()));
    const seguir = await confirmar({
      titulo: 'Restaurar estos datos',
      mensaje:
        `Tienen: ${resumenCopia}.\n\nReemplazarán lo que tienes ahora (${actual.toLowerCase()}). ` +
        'Antes guardaré una copia de tus datos actuales, por si quieres volver atrás.',
      accion: 'Restaurar',
      destructiva: true,
    });
    if (!seguir) return;
    try {
      await restaurar();
    } catch (e) {
      await avisar({ titulo: 'No se pudo restaurar', mensaje: e instanceof Error ? e.message : String(e) });
      return;
    }
    await avisar({ titulo: 'Datos restaurados', mensaje: 'Ancla se va a recargar para mostrarlos.', boton: 'Continuar' });
    recargarApp();
  }

  function restaurarDesdeArchivo() {
    // El selector se abre aquí mismo, dentro del toque.
    const eleccion = elegirArchivoDeRespaldo();
    (async () => {
      const bytes = await eleccion;
      if (!bytes) return;
      setOcupado('restaurar');
      try {
        const inspeccion = await inspeccionarRespaldo(bytes);
        if (!inspeccion.ok) {
          await avisar({ titulo: 'No se puede restaurar', mensaje: inspeccion.motivo });
          return;
        }
        await confirmarYRestaurar(resumenLegible(inspeccion.resumen), () => restaurarRespaldo(bytes));
      } finally {
        setOcupado(null);
      }
    })();
  }

  function restaurarCopia(copia: MetaCopia) {
    confirmarYRestaurar(resumenLegible(copia.resumen), () => restaurarCopiaAutomatica(copia.id));
  }

  const ahora = new Date();
  const tarjeta = [estilos.tarjeta, cardStyle(tema), { borderRadius: forma.rRow, borderColor: t.borderMuted ?? 'transparent' }];
  const textoProteccion: Record<EstadoProteccion, [string, string]> = {
    protegido: ['Activada', t.bien],
    'sin-proteccion': ['No concedida', t.dificil],
    'no-disponible': ['No disponible aquí', t.inkMuted],
  };
  const [etiquetaProteccion, colorProteccion] = textoProteccion[proteccion];

  return (
    <View style={estilos.seccion}>
      <Text style={[estilos.subtitulo, { color: t.ink, fontFamily: tipografia.display }]}>Tus datos</Text>
      <Text style={[estilos.intro, { color: t.inkMuted }]}>
        Todo lo que haces en Ancla se guarda solo en este teléfono: sin cuentas y sin nube.
      </Text>

      <View style={tarjeta}>
        <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>Copias automáticas</Text>
        <Text style={[estilos.cuerpo, { color: t.inkMuted }]}>
          Una al día y otra antes de cada actualización. Si tus datos desaparecieran, Ancla te ofrecería recuperarlos.
        </Text>
        <Text style={[estilos.dato, { color: t.ink }]}>
          {copias[0]
            ? `La última, ${describirFecha(copias[0].creadaEn, ahora)}.`
            : 'La primera se hará el día que practiques.'}
        </Text>
        <View style={estilos.fila}>
          <Text style={[estilos.dato, { color: t.ink, flex: 1 }]}>Protección del navegador</Text>
          <Text style={[estilos.estado, { color: colorProteccion }]}>{etiquetaProteccion}</Text>
        </View>
        {proteccion === 'sin-proteccion' ? (
          <Text style={[estilos.cuerpo, { color: t.inkMuted }]}>
            Si el teléfono se queda sin espacio, el navegador podría borrar datos. Un respaldo te cubre.
          </Text>
        ) : null}
      </View>

      <View style={tarjeta}>
        <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>Respaldo en Archivos o iCloud</Text>
        <Text style={[estilos.cuerpo, { color: t.inkMuted }]}>
          Las copias automáticas viven dentro de la app: si la quitas de la pantalla de inicio o cambias de teléfono, se
          van con ella. Un respaldo guardado fuera, no.
        </Text>
        {respaldoDisponible ? (
          <>
            <Text style={[estilos.dato, { color: t.ink }]}>
              Último respaldo: {ultimo ? describirFecha(ultimo, ahora) : 'nunca'}
            </Text>
            <Pressable
              onPress={crearRespaldo}
              disabled={ocupado !== null}
              accessibilityRole="button"
              style={({ pressed }) => [
                estilos.boton,
                { backgroundColor: t.accent1, borderRadius: forma.rBtn },
                (pressed || ocupado === 'crear') && estilos.presionado,
              ]}
            >
              <Text style={[estilos.textoBoton, { color: t.inkOnAccent, fontFamily: tipografia.display }]}>
                {ocupado === 'crear' ? 'Preparando…' : 'Crear respaldo'}
              </Text>
            </Pressable>
            <Pressable
              onPress={restaurarDesdeArchivo}
              disabled={ocupado !== null}
              accessibilityRole="button"
              style={({ pressed }) => [
                estilos.boton,
                { backgroundColor: t.track, borderRadius: forma.rBtn },
                (pressed || ocupado === 'restaurar') && estilos.presionado,
              ]}
            >
              <Text style={[estilos.textoBoton, { color: t.ink, fontFamily: tipografia.display }]}>
                {ocupado === 'restaurar' ? 'Revisando el archivo…' : 'Restaurar desde un archivo'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={[estilos.dato, { color: t.inkMuted }]}>El respaldo solo está disponible en la app web.</Text>
        )}
      </View>

      {copias.length > 0 ? (
        <View style={tarjeta}>
          <Text style={[estilos.titulo, { color: t.ink, fontFamily: tipografia.display }]}>Copias en este teléfono</Text>
          {copias.map((copia) => (
            <View key={copia.id} style={[estilos.fila, estilos.filaCopia, { borderTopColor: t.borderMuted ?? t.track }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[estilos.dato, { color: t.ink }]}>
                  {mayuscula(describirFecha(copia.creadaEn, ahora))} · {ETIQUETA_TIPO[copia.tipo]}
                </Text>
                <Text style={[estilos.cuerpo, { color: t.inkMuted }]}>{resumenLegible(copia.resumen)}</Text>
              </View>
              <Pressable
                onPress={() => restaurarCopia(copia)}
                disabled={ocupado !== null}
                accessibilityRole="button"
                accessibilityLabel={`Restaurar la copia ${describirFecha(copia.creadaEn, ahora)}`}
                hitSlop={8}
              >
                <Text style={[estilos.enlace, { color: t.accent1 }]}>Restaurar</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: 12 },
  subtitulo: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 4 },
  intro: { fontSize: 13.5, lineHeight: 19 },
  tarjeta: { padding: 16, gap: 8, borderWidth: 1 },
  titulo: { fontSize: 15, fontWeight: '700' },
  cuerpo: { fontSize: 13, lineHeight: 18 },
  dato: { fontSize: 14, fontWeight: '600' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filaCopia: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 2 },
  estado: { fontSize: 13.5, fontWeight: '800' },
  boton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textoBoton: { fontSize: 15, fontWeight: '800' },
  presionado: { opacity: 0.8 },
  enlace: { fontSize: 14, fontWeight: '800' },
});
