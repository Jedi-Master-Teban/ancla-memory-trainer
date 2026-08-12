import { COLGADERO_100 } from '../../seed/colgadero';
import { crearMazo, crearTarjeta } from '../repository';
import type { ConexionBD } from '../tipos';

export const version = 2;

/**
 * Siembra el mazo `colgadero` con las 100 palabras del operador (§7.3).
 * Reusa `crearTarjeta` del repositorio para que cada tarjeta nazca con
 * estado FSRS real (invariante I-1/I-2) — nunca se hand-craftea `fsrs_state`.
 * Idempotente por construcción: el corredor de migraciones nunca vuelve a
 * llamar `aplicar()` una vez la versión 2 quedó registrada.
 */
export async function aplicar(db: ConexionBD, ahora: Date): Promise<void> {
  const mazo = await crearMazo(db, { nombre: 'Colgadero', categoria: 'colgadero' }, ahora);

  for (const { numero, palabra } of COLGADERO_100) {
    await crearTarjeta(
      db,
      {
        mazoId: mazo.id,
        categoria: 'colgadero',
        contenidoFrente: String(numero),
        contenidoReverso: palabra,
        metadataCategoria: { numero },
      },
      ahora
    );
  }
}
