---
name: verificar-api-libreria
description: Procedimiento para verificar la API real de una dependencia antes de escribir código que la use. Úsala antes de llamar a cualquier función de expo-sqlite, ts-fsrs, expo-notifications, expo-router o cualquier paquete cuya firma no hayas leído en esta sesión, y siempre que dudes de si una función existe o de qué parámetros recibe.
---

# Skill: verificar API de librería

Implementa §4.1 del brief. Existe porque la forma más común de alucinación en código
es escribir una firma **plausible** en vez de la **real** — y las APIs de Expo y de
`ts-fsrs` han cambiado entre versiones mayores.

**Regla de fases:** en orden. Un paso que no aplique se marca **"N/A — [razón]"**.

---

## Paso 1 — Fijar la versión exacta

```bash
grep -n "<paquete>" package.json
cat node_modules/<paquete>/package.json | grep '"version"'
```

Ambos números. Si difieren, manda `node_modules/` (es lo que compila).
Si el paquete no está instalado, **parar**: no se escribe código contra una
dependencia ausente. Se instala primero o se consulta al operador.

**Criterio de salida:** versión instalada anotada en la conversación.

## Paso 2 — Leer los tipos reales

```bash
ls node_modules/<paquete>/         # buscar dist/, build/, types/, index.d.ts
grep -rn "export" node_modules/<paquete>/*.d.ts | head -50
```

Leer la declaración de **cada** función que se va a llamar: nombre exacto,
parámetros, tipos, si devuelve promesa, si es método de instancia o función suelta.

**Criterio de salida:** la firma completa de cada función a usar, copiada del `.d.ts`,
con la ruta del archivo del que salió.

## Paso 3 — Contrastar con la documentación de esa versión

Solo si el paso 2 dejó dudas (tipos genéricos, sobrecargas, efectos secundarios).

Orden de autoridad, de mayor a menor:
1. Los `.d.ts` instalados
2. El README / CHANGELOG del paquete instalado
3. La doc oficial **de la versión instalada**
4. Nada más — ni memoria, ni analogía, ni blogs

Si la doc en línea describe otra versión, **manda el paso 2**.

**Criterio de salida:** duda resuelta, con la fuente citada; o duda declarada abierta.

## Paso 4 — Casos de riesgo específicos de este proyecto

| Paquete | Qué verificar siempre |
|---|---|
| `ts-fsrs` | Forma de `Card`, cómo se crea el scheduler, valores reales de `Rating` y `State`, si la API es de instancia o funcional |
| `expo-sqlite` | API síncrona vs asíncrona, nombres reales de los métodos de ejecución, cómo se abre la BD, si hay API legacy y cuál está deprecada |
| `expo-notifications` | **Si las notificaciones locales funcionan dentro de Expo Go** en esta versión de SDK (pendiente P-4), cómo se piden permisos en iOS, forma del trigger |
| `expo-router` | Convención de rutas de esta versión, grupos `(tabs)`, layouts anidados |

**Criterio de salida:** para el paquete en cuestión, sus puntos de la tabla anotados.

## Paso 5 — Si sigue habiendo duda: decirlo

Si tras los pasos 1–4 la duda persiste, el resultado correcto es **decirlo**:

> "No estoy seguro de que `<paquete>.<función>` se comporte así. Lo que verifiqué:
> [X]. Lo que no pude verificar: [Y]. Opciones: (a) escribir un test mínimo que lo
> compruebe, (b) que lo confirmes tú."

Esto no es un fallo de desempeño. Escribir la llamada igual y esperar que compile,
sí lo es.

**Criterio de salida:** duda resuelta, o duda comunicada al operador con opciones.

## Paso 6 — Registrar

Si la verificación descubrió algo que afecta a la arquitectura (una API deprecada,
una función que no existe en Expo Go, un cambio de firma entre versiones), añadir un
ADR al final de `agent_docs/DECISIONS.md`.

**Criterio de salida:** ADR añadido, o "N/A — hallazgo rutinario".

---

## Prohibido explícitamente

- Escribir una llamada a una API que no se ha leído en esta sesión.
- Deducir una firma por parecido con otra librería o con otro lenguaje.
- Suponer que una API es igual que en la versión anterior del paquete.
- Envolver una llamada dudosa en `try/catch` y llamarlo "manejo de errores".
- Instalar una dependencia nueva sin aprobación del operador.
