---
name: verificacion
description: Checklist de verificación obligatoria antes de marcar cualquier tarea como terminada o hacer cualquier commit. Úsala antes de todo commit, cuando el operador ejecute /verificar, y siempre que estés a punto de afirmar que algo está hecho, funciona o pasa los tests.
---

# Skill: verificación obligatoria

Implementa §4.2 del brief. Se corre **antes de cada commit** y antes de cualquier
afirmación de que algo está terminado.

**Regla de fases:** se responden los 6 puntos **en orden** y **por separado**. Si uno
no aplica, se escribe **"N/A — [razón]"**. Prohibido: responder "todo bien",
agrupar puntos, o saltarse uno porque "es obvio".

**Regla de evidencia:** cada respuesta lleva la salida real del comando o la
referencia `archivo:línea`. Una respuesta sin evidencia es un fallo del punto.

---

## Punto 1 — ¿Compila sin errores de TypeScript?

```bash
npx tsc --noEmit
```

Pegar la salida. Cero errores. Warnings: se listan y se dice si se aceptan.

**No cuenta:** "no vi errores en el editor".

## Punto 2 — ¿Corre en Expo Go sin crashear al abrir la pantalla afectada?

```bash
npx expo start
```

Reportar: qué pantalla se abrió, qué se hizo en ella, qué apareció en la consola de
Metro. Un warning conocido se nombra; no se oculta.

Si el operador todavía no ha podido probarlo, la respuesta es
**"pendiente de verificación en dispositivo"** — no "sí".

## Punto 3 — ¿Hay tests de Jest para la lógica nueva? ¿Pasan?

```bash
npm test
```

Pegar la salida. Además, responder explícitamente:

- ¿Qué lógica nueva se añadió?
- ¿Qué test la cubre? (`archivo:línea`)
- Si es lógica de FSRS, fonética, racha, números o cadena y **no** tiene test:
  el punto está **reprobado**. Se escribe el test antes de seguir.
- Si es UI pura sin lógica: **N/A justificado**.

## Punto 4 — ¿Se tocó algún archivo fuera del alcance declarado?

```bash
git status --short
```

Comparar con la lista del paso 3 de `nueva-fase`.

- Si todo está dentro del alcance: decirlo.
- Si hay archivos de más: **listarlos con la razón**. Reportarlos es lo correcto;
  ocultarlos es el fallo. Si algún cambio no debía estar ahí, se revierte.

Comprobaciones mecánicas de convenciones:

```bash
# Convención 1: nada de SQL fuera de src/db/
grep -rn "execAsync\|getAllAsync\|getFirstAsync\|runAsync\|expo-sqlite" src app --include=*.ts --include=*.tsx | grep -v "^src/db/"

# Convención 3: src/domain/ es lógica pura
grep -rn "from 'react\|from \"react\|from 'expo-\|from \"expo-" src/domain --include=*.ts
```

Ambos deben salir **vacíos**. Cualquier línea es una violación de convención que se
reporta y se corrige antes del commit.

## Punto 5 — ¿Respeta el modelo de datos, con migraciones no destructivas?

- ¿Se tocó el esquema? Si no: **N/A**.
- Si sí: ¿la migración es aditiva (`CREATE`, `ADD COLUMN` con default, `UPDATE` de
  backfill)? Cualquier `DROP`, `DELETE` masivo o cambio de tipo requiere
  autorización explícita del operador (`agent_docs/MODELO-DATOS.md` §3).
- ¿Se probó sobre una BD **con datos** de la versión anterior, no solo vacía?
- ¿Los datos existentes en el dispositivo del operador sobreviven?

Detalle: Skill `db-migracion`.

## Punto 6 — Si se marca como "hecho": ¿va con evidencia concreta?

Antes de escribir "listo", "hecho" o "funcionando", comprobar que en la respuesta
existe, de verdad:

- [ ] Salida real de `npx tsc --noEmit`
- [ ] Salida real de `npm test`
- [ ] Referencias `archivo:línea` de lo implementado
- [ ] Descripción de lo probado en el dispositivo, o "pendiente de verificación"
- [ ] El `done when` de la fase citado y contestado (si se cierra una fase)

Si falta alguna casilla, **no se dice "hecho"**. Se dice qué falta.

---

## Veredicto final (obligatorio)

Terminar siempre con una de estas tres líneas, literal:

- **VERIFICACIÓN COMPLETA — los 6 puntos en verde. Listo para commit.**
- **VERIFICACIÓN PARCIAL — puntos [N] pendientes: [qué falta].**
- **VERIFICACIÓN REPROBADA — punto [N]: [qué falló]. No se hace commit.**

Nunca terminar esta Skill sin uno de esos tres veredictos.
