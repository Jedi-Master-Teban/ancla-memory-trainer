import { etiquetaCarta } from '../../domain/fonetica/naipes';
import { NAIPES_52 } from '../../seed/naipes';
import { crearMazo, crearTarjeta } from '../repository';
import type { ConexionBD } from '../tipos';

export const version = 3;

/**
 * Siembra el mazo `naipe` con las 52 palabras del operador (§7.4). Mismo
 * patrón que 002_seed_colgadero.ts: reusa `crearTarjeta` para que cada
 * tarjeta nazca con estado FSRS real, nunca hand-crafteado.
 *
 * Todas las 52 palabras fueron validadas contra `validarPalabraNaipe` antes
 * de llegar aquí (dictadas por el operador, dos rondas de ajuste — ver
 * agent_docs/DECISIONS.md). `aprobada_por_operador: true` porque el
 * operador las escribió y confirmó directamente, no son sugerencias.
 */
export async function aplicar(db: ConexionBD, ahora: Date): Promise<void> {
  const mazo = await crearMazo(db, { nombre: 'Naipes', categoria: 'naipe' }, ahora);

  for (const { palo, valor, palabra } of NAIPES_52) {
    await crearTarjeta(
      db,
      {
        mazoId: mazo.id,
        categoria: 'naipe',
        contenidoFrente: etiquetaCarta({ palo, valor }),
        contenidoReverso: palabra,
        metadataCategoria: { palo, valor, aprobada_por_operador: true },
      },
      ahora
    );
  }
}
