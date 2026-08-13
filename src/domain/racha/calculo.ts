import type { FilaDiaPractica, FilaRachaConfig } from '../../db/tipos';

/**
 * Distinto de `EstadoVisual` (riesgo de retención de UNA tarjeta,
 * src/domain/fsrs/estado.ts) — aquí `en_riesgo` es sobre la meta de HOY,
 * no sobre una tarjeta. Mismo nombre de valor, conceptos sin relación:
 * tipos separados a propósito.
 */
export type EstadoRacha = 'activa' | 'en_riesgo' | 'rota';

export interface ResultadoRacha {
  diasConsecutivos: number;
  estado: EstadoRacha;
  metaDeHoyCumplida: boolean;
  congeladoresDisponibles: number;
}

/** 'YYYY-MM-DD' en hora LOCAL del dispositivo (ADR-010) — nunca UTC. */
export function fechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function horaLocal(fecha: Date): string {
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Un día antes de `fecha_local`, cruzando meses/años correctamente. Nunca
 * `new Date(fechaLocalStr)`: esa forma interpreta la cadena como UTC
 * medianoche y reintroduciría justo el bug que ADR-010 evita. Se construye
 * con el constructor numérico (local) y se deja que `setDate` haga el
 * desbordamiento de mes/año — es lo que resuelve el caso borde 6 gratis.
 */
export function diaAnterior(fechaLocalStr: string): string {
  const [anio, mes, dia] = fechaLocalStr.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setDate(fecha.getDate() - 1);
  return fechaLocal(fecha);
}

/**
 * Racha (§7.7, agent_docs/modulos/07-racha.md). Un día "cuenta" si cumplió
 * la meta O si se le aplicó un congelador — ambos ya decididos y guardados
 * en la fila de ese día, nunca recalculados aquí contra el `meta_diaria`
 * VIGENTE: si el operador sube la meta mañana, no debe romper retroactivamente
 * un día que ya cumplió con la meta de ayer (excepción deliberada y angosta
 * a "derivar, no guardar").
 *
 * "Hoy" nunca rompe la racha por sí solo mientras el día no ha terminado —
 * se camina hacia atrás desde AYER para decidir continuidad, y HOY se suma
 * aparte solo si ya cumplió.
 */
export function calcularRacha(dias: FilaDiaPractica[], config: FilaRachaConfig, ahora: Date): ResultadoRacha {
  const hoy = fechaLocal(ahora);
  const porFecha = new Map(dias.map((d) => [d.fecha_local, d]));
  const cuenta = (fecha: string): boolean => {
    const fila = porFecha.get(fecha);
    return fila !== undefined && (fila.meta_cumplida === 1 || fila.congelador_usado === 1);
  };

  let diasConsecutivosHastaAyer = 0;
  let cursor = diaAnterior(hoy);
  while (cuenta(cursor)) {
    diasConsecutivosHastaAyer += 1;
    cursor = diaAnterior(cursor);
  }

  const filaHoy = porFecha.get(hoy);
  const metaDeHoyCumplida = filaHoy?.meta_cumplida === 1;
  const diasConsecutivos = metaDeHoyCumplida ? diasConsecutivosHastaAyer + 1 : diasConsecutivosHastaAyer;

  let estado: EstadoRacha;
  if (metaDeHoyCumplida) {
    estado = 'activa';
  } else if (horaLocal(ahora) < config.hora_recordatorio) {
    estado = 'activa';
  } else if (diasConsecutivosHastaAyer >= 1) {
    estado = 'en_riesgo';
  } else {
    estado = 'rota';
  }

  return {
    diasConsecutivos,
    estado,
    metaDeHoyCumplida,
    congeladoresDisponibles: config.congeladores_disponibles,
  };
}
