---
name: db-migracion
description: Procedimiento para crear o modificar cualquier migración de SQLite sin destruir datos existentes. Úsala al añadir tablas o columnas, al cambiar el esquema, al sembrar datos, y siempre que un cambio pueda afectar a la base de datos que ya vive en el iPhone del operador.
---

# Skill: migración de base de datos

Existe porque los datos del operador son **irrecuperables**: no hay backend, no hay
nube, no hay backup (§3 del brief). Una migración destructiva borra meses de
historial de repetición espaciada y no hay de dónde restaurarlo.

**Regla de fases:** en orden. Un paso que no aplique se marca **"N/A — [razón]"**.

---

## Paso 1 — Clasificar el cambio

| Tipo | Ejemplos | ¿Permitido? |
|---|---|---|
| Aditivo | `CREATE TABLE`, `CREATE INDEX`, `ADD COLUMN` con default, `UPDATE` de backfill | **Sí**, es el camino normal |
| Destructivo | `DROP TABLE`, `DROP COLUMN`, cambio de tipo, reconstrucción de tabla, `DELETE` masivo | **Solo con autorización explícita del operador**, pedida antes de escribir el código |

Si el cambio es destructivo: **parar aquí y preguntar.** Explicar qué datos se
pierden y proponer la alternativa aditiva.

**Criterio de salida:** tipo declarado. Si es destructivo, autorización textual del
operador citada en la conversación.

## Paso 2 — Comprobar si hay alternativa aditiva

Casi siempre la hay:

| En vez de… | Hacer… |
|---|---|
| `DROP COLUMN` obsoleta | Dejarla, dejar de leerla, documentarla como muerta |
| Cambiar el tipo de una columna | Columna nueva + backfill + dejar de usar la vieja |
| `DELETE` de filas obsoletas | `archivada = 1` |
| Renombrar una columna | Columna nueva + backfill; la vieja se queda |
| Recrear una tabla para añadir un `CHECK` | Validar en el repositorio (ADR-009) |

Una columna muerta cuesta unos bytes. Un `DROP` mal puesto cuesta el historial.

**Criterio de salida:** alternativa aditiva encontrada y adoptada, o razón por la
que no existe.

## Paso 3 — Escribir la migración

- Archivo `src/db/migrations/NNN_nombre.ts`, numeración correlativa sin huecos.
- **Idempotente**: `CREATE TABLE IF NOT EXISTS`, siembra que comprueba antes de insertar.
- Registrada en la tabla `migracion(version, aplicada_en)`.
- Nunca se edita una migración ya aplicada en el dispositivo del operador: se
  añade una nueva. Editar una vieja hace que dispositivos distintos tengan esquemas
  distintos con el mismo número de versión.

**Criterio de salida:** migración escrita, numerada e idempotente.

## Paso 4 — Probarla sobre una BD con datos

Este es **el paso que se salta todo el mundo** y el que realmente importa.

1. Test que crea una BD en el estado de la versión **anterior**.
2. Insertar datos representativos: tarjetas con historial FSRS, revisiones, sesiones,
   días de racha.
3. Aplicar la migración.
4. Verificar: los datos anteriores **siguen ahí y siguen siendo correctos**, y lo
   nuevo funciona.

Probar solo sobre una BD vacía no verifica nada: la BD vacía siempre migra bien.

**Criterio de salida:** test sobre BD con datos, en verde, con su salida pegada.

## Paso 5 — Verificar la idempotencia y el reinicio

- Aplicar la migración dos veces seguidas: no debe fallar ni duplicar datos.
- Arrancar desde cero (BD inexistente): todas las migraciones en orden, sin error.

**Criterio de salida:** ambos casos probados.

## Paso 6 — Verificar en el dispositivo

Abrir la app en Expo Go **con la base de datos real ya existente** del operador y
confirmar que:

- La app arranca.
- Los datos previos siguen visibles (racha, tarjetas, historial).
- La funcionalidad nueva aparece.

Si el operador tiene datos que le importan, **avisar antes** de que instale la
versión con la migración.

**Criterio de salida:** confirmado en dispositivo, o declarado "pendiente de
verificación en dispositivo" sin ambigüedad.

## Paso 7 — Documentar

- Actualizar `agent_docs/MODELO-DATOS.md` si cambió el esquema.
- ADR al final de `agent_docs/DECISIONS.md` si la decisión es cara de revertir.

**Criterio de salida:** documentación actualizada, o "N/A — el esquema no cambió".

---

## Prohibido explícitamente

- `DROP TABLE` o `DROP COLUMN` sin autorización textual del operador.
- Borrar filas de `revision`. Es el histórico crudo contra el que se verifica la Fase 6.
- Editar una migración ya aplicada.
- "Borra la app y reinstala" como solución a un problema de migración.
- Reiniciar el estado FSRS de tarjetas existentes como efecto secundario de un
  cambio de esquema.
