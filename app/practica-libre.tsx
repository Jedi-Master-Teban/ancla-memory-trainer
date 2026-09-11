import { router } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeaderFlotante } from '../src/components/HeaderFlotante';
import { BotonesCalificacion } from '../src/components/BotonesCalificacion';
import { Flashcard } from '../src/components/Flashcard';
import { PausaVisualizacion } from '../src/components/PausaVisualizacion';
import { TramosProgreso } from '../src/components/TramosProgreso';
import { obtenerBD } from '../src/db/client';
import { cerrarSesion, crearSesion, listarMazos, listarTarjetasPorMazo } from '../src/db/repository';
import type { ConexionBD } from '../src/db/tipos';
import { barajar } from '../src/domain/aleatorio';
import type { Calificacion } from '../src/domain/fsrs/scheduler';
import { TOPE_POR_DEFECTO } from '../src/domain/sesion/motor';
import { useSesionStore } from '../src/stores/sesion';
import { useTema } from '../src/stores/tema';
import type { TokensColor } from '../src/tema/colores';

/**
 * "Todo al día" (09-dashboard.md §4): repaso sin impacto en el scheduling
 * FSRS. Estructuralmente separada de practicar.tsx (no un flag de modo) para
 * que sea IMPOSIBLE, no solo evitado, llamar `calificarTarjeta` aquí:
 * `onCalificar` solo toca el store local, nunca el repositorio de tarjetas
 * — así ni fsrs_state ni la racha se mueven un milímetro.
 */
export default function PracticaLibre() {
  const { colores: t } = useTema();
  const estilos = useMemo(() => crearEstilos(t), [t]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<ConexionBD | null>(null);

  const { tarjetas, sesionId, indice, revelada, aciertos, fallos, iniciar, revelar, avanzar, reiniciar } =
    useSesionStore();

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const conexion = await obtenerBD();
        const mazos = await listarMazos(conexion);
        const listas = await Promise.all(mazos.map((m) => listarTarjetasPorMazo(conexion, m.id)));
        const seleccion = barajar(listas.flat()).slice(0, TOPE_POR_DEFECTO);
        const sesion = await crearSesion(conexion, { modo: 'practica_libre' }, new Date());
        if (!cancelado) {
          setDb(conexion);
          iniciar(seleccion, sesion.id);
          setCargando(false);
        }
      } catch (e) {
        if (!cancelado) {
          setError(String(e));
          setCargando(false);
        }
      }
    })();
    return () => {
      cancelado = true;
      reiniciar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (db && sesionId && tarjetas.length > 0 && indice >= tarjetas.length) {
      cerrarSesion(db, { sesionId, duracionSegundos: 0, aciertos, fallos }, new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  function onCalificar(calificacion: Calificacion) {
    avanzar(calificacion);
  }

  if (cargando) {
    return (
      <View  style={estilos.centro}>
        <ActivityIndicator color={t.ink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>Error: {error}</Text>
      </View>
    );
  }

  if (tarjetas.length === 0) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.texto}>Todavía no hay ninguna tarjeta creada.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (indice >= tarjetas.length) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>Práctica libre completa</Text>
        <Text style={estilos.texto}>
          {aciertos} aciertos · {fallos} fallos — no afecta tu racha ni tus repasos programados
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const actual = tarjetas[indice];

  return (
    <>
      <HeaderFlotante
        titulo="Práctica libre"
        volverA="/"
        derecha={
          <Text style={estilos.progresoChico}>
            {indice + 1}/{tarjetas.length}
          </Text>
        }
      />
      <View style={estilos.tramos}>
        <TramosProgreso total={tarjetas.length} indice={indice} />
      </View>
      <View style={estilos.contenedor}>
        <Text style={estilos.aviso}>práctica libre — no afecta tu racha ni tus repasos</Text>
        <Flashcard frente={actual.contenido_frente} reverso={actual.contenido_reverso} revelada={revelada} />
        {!revelada ? (
          <PausaVisualizacion clave={actual.id}>
            <Pressable onPress={revelar} style={estilos.botonRevelar}>
              <Text style={estilos.textoRevelar}>Ver respuesta</Text>
            </Pressable>
          </PausaVisualizacion>
        ) : (
          // Sin `intervalos` a propósito: esta pantalla no reprograma la
          // tarjeta (ver comentario del componente arriba) — mostrar un
          // intervalo FSRS real que luego no se aplica sería mentirle al
          // usuario sobre lo que su calificación va a hacer.
          <BotonesCalificacion onCalificar={onCalificar} />
        )}
      </View>
    </>
  );
}

const crearEstilos = (t: TokensColor) => StyleSheet.create({
  // Los tramos van pegados al header, fuera del contenedor centrado.
  tramos: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10 },
  contenedor: { flex: 1, backgroundColor: t.bg, justifyContent: 'center', gap: 12 },
  centro: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  progreso: { color: t.inkMuted, textAlign: 'center' },
  progresoChico: { color: t.inkMuted, fontSize: 12, fontWeight: '600' },
  aviso: { color: t.inkMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  titulo: { color: t.ink, fontSize: 20, fontWeight: '600' },
  texto: { color: t.inkMuted, textAlign: 'center', paddingHorizontal: 24 },
  error: { color: t.otraVez, padding: 24, textAlign: 'center' },
  enlace: { color: t.accent1, marginTop: 12 },
  botonRevelar: {
    alignSelf: 'center',
    backgroundColor: t.accent1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoRevelar: { color: t.inkOnAccent, fontWeight: '600' },
});
