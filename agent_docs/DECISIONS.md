# DECISIONS — registro acumulativo

Bitácora de decisiones de arquitectura **irreversibles o caras de revertir** (§5.2
del brief). Este archivo **nunca se borra ni se reescribe**: solo se le añaden
entradas al final. Si una decisión se revierte, se añade una entrada nueva que la
supersede — no se edita la vieja.

Formato: `ADR-NNN · fecha · estado · decisión · razón · consecuencia`.

---

## ADR-001 · 2026-08-10 · Aceptada
**Decisión:** una tarjeta FSRS **por par consecutivo** en el Sistema de la Cadena,
sin tarjeta adicional de "lista completa".
**Razón:** decisión del operador sobre la pregunta que §8.4 dejaba abierta para
Plan Mode. Máxima granularidad: FSRS puede atacar el eslabón débil.
**Consecuencia:** una lista de N objetos genera N−1 tarjetas. La reproducción
completa de la lista existe como **modo de estudio** (§8.4) pero no como tarjeta; al
reproducirla, cada transición acertada/fallada califica su eslabón.
**Pendiente derivado:** ver ADR-002.

## ADR-002 · 2026-08-10 · **Propuesta — requiere visto bueno del operador**
**Decisión propuesta:** el eslabón A→B es **una sola** tarjeta; el modo inverso
(B→A) es una *dirección de presentación* de esa misma tarjeta, no una segunda
tarjeta. Si en una sesión se prueban ambas direcciones, la tarjeta se califica con
la **peor** de las dos notas.
**Razón:** ADR-001 dice "una tarjeta por par consecutivo" (singular). Duplicar por
dirección daría 2(N−1) tarjetas y no fue lo que se pidió. Tomar la peor nota evita
inflar la estabilidad con la dirección fácil.
**Consecuencia:** `revision.direccion` registra qué dirección se probó, para poder
separarlo después si el operador cambia de opinión.
**Alternativa descartada:** dos tarjetas por eslabón (duplica la carga diaria).

## ADR-003 · 2026-08-10 · Aceptada
**Decisión:** `palabra_clave` sale del enum activo y pasa al grupo de
extensibilidad futura, junto a `loci` y `pao`.
**Razón:** decisión del operador. §7.5 lo describe como método pero §8 no le da
módulo y §11 no le da fase; un valor de enum sin implementación es deuda.
**Consecuencia:** enum activo = `colgadero | naipe | lista_item | numero`. Enmienda
formal a §9 del brief.

## ADR-004 · 2026-08-10 · Aceptada
**Decisión:** las 52 imágenes de naipes se derivan de **reglas dictadas por el
operador**, no de contenido inventado por el agente. El agente implementa el
validador y **propone** candidatas marcadas como sugerencias; solo se persiste lo
que el operador aprueba.
**Razón:** §4.1 prohíbe inventar requisitos y contenido de dominio.
**Consecuencia:** ver `seeds/naipes-52.md`. **Bloqueo abierto:** faltan las
consonantes reservadas de Sota / Reina / Rey (12 de 52 cartas). Se necesita al
inicio de la Fase 3.

## ADR-005 · 2026-08-10 · Aceptada
**Decisión:** `git init` dentro de `memory-trainer/`, con su propio `.gitignore`.
**Razón:** decisión del operador. La raíz git actual es `~/Código`, que contiene
~50 proyectos sin trackear y sin `.gitignore`; un `git add -A` descuidado
contaminaría el commit de fase con proyectos ajenos.
**Consecuencia:** los commits por fase (§11) viven en un historial aislado. No se
toca el repo padre.

## ADR-006 · 2026-08-10 · Aceptada
**Decisión:** `fsrs_retrievability` y el `estado` de 4 valores del brief **no se
almacenan**; se derivan.
**Razón:** la retrievability depende del tiempo transcurrido y queda obsoleta al
instante; un segundo diagrama de estados mantenido a mano se desincroniza del
`State` de `ts-fsrs`.
**Consecuencia:** refinamiento de §9, permitido por el propio brief ("borrador
orientativo, no copiar literalmente"). Detalle en `MODELO-DATOS.md` §1.

## ADR-007 · 2026-08-10 · Aceptada
**Decisión:** `src/domain/` es lógica pura: **prohibido importar React o `expo-*`**
dentro de esa carpeta.
**Razón:** §4.4 exige TDD sobre FSRS y fonética. Lógica pura se prueba con Jest sin
mocks de módulos nativos; lógica mezclada con UI obliga a montar todo el entorno.
**Consecuencia:** el acceso a datos y a la plataforma entra por parámetros. Es
verificable mecánicamente con un grep en la checklist de `/verificar`.

## ADR-008 · 2026-08-10 · Aceptada
**Decisión:** Zustand como gestor de estado (§6 permitía Zustand o Context API).
**Razón:** sesiones de estudio con estado que cambia en cada tarjeta; Context
provoca re-render de todo el árbol. Zustand es una dependencia pequeña y sin
providers anidados.
**Consecuencia:** `src/stores/`. Redux sigue prohibido (§3).

## ADR-009 · 2026-08-10 · Aceptada
**Decisión:** `categoria` sin restricción `CHECK` en SQLite; se valida en el borde
del repositorio con un tipo unión de TypeScript.
**Razón:** SQLite no permite alterar un `CHECK`; añadir `loci` exigiría reconstruir
la tabla, que es justo la migración destructiva que §3 prohíbe.
**Consecuencia:** la seguridad de tipos es de compilación, no de motor.

## ADR-010 · 2026-08-10 · Aceptada
**Decisión:** la racha usa `fecha_local` (`YYYY-MM-DD` en el huso del dispositivo),
no UTC.
**Razón:** una racha es un concepto de calendario humano; el día termina a la
medianoche del usuario.
**Consecuencia:** cambiar de huso horario puede alargar o acortar un día. Aceptado y
documentado; no se "arregla" con UTC.

---

## ADR-011 · 2026-08-11 · Aceptada
**Decisión:** versiones exactas del stack, verificadas contra `node_modules/` real
(Skill `verificar-api-libreria`) durante el scaffold de la Fase 0 — no de memoria.

| Paquete | Versión instalada | Fuente |
|---|---|---|
| expo | 57.0.12 | `npm view` + confirmado en `node_modules` |
| expo-router | 57.0.12 | ídem |
| expo-sqlite | 57.0.1 (verificada, **no instalada aún** — entra en Fase 1) | `npm view` |
| ts-fsrs | 5.4.1 (verificada, **no instalada aún** — entra en Fase 1) | `npm view` |
| expo-notifications | 57.0.10 (verificada, **no instalada aún** — entra en Fase 8) | `npm view` |
| zustand | 5.0.14 (verificada, **no instalada aún** — entra en Fase 2) | `npm view` |
| jest-expo | 57.0.4 | instalada |
| jest | 29.7.0 | resuelta transitivamente por `jest-expo`, no declarada aparte |
| typescript | **6.0.3** (NO 7.0.2) | ver hallazgo abajo |
| react | 19.2.8 | instalada — ver hallazgo abajo |
| react-native | 0.86.2 | instalada |

**Hallazgo — la trampa que este ADR existe para registrar:** `npm view typescript
version` devuelve `7.0.2` (la última publicada en el registro), pero la plantilla
oficial de Expo SDK 57 fija `typescript: ~6.0.3` en sus `devDependencies`. Instalar
"la última" a ciegas habría introducido una versión no probada contra el toolchain
de Expo/Metro de esta SDK. Se siguió la versión que trae el ecosistema Expo
(confirmada también al instalarla vía `expo install typescript --dev`, que resolvió
independientemente el mismo `~6.0.3`), no la última del registro npm.

**Hallazgo secundario:** `expo-router@57.0.12` depende (no como peer opcional, sino
de forma dura vía `@expo/ui`) de un árbol que involucra a `react-dom` como peer. Un
primer intento de fijar `react` a `19.2.3` (visto en una plantilla de prueba en el
scratchpad) chocó en `ERESOLVE` contra un `react-dom@19.2.8` ya resuelto
transitivamente. Se corrigió fijando `react` a `19.2.8` — la versión que el propio
árbol de dependencias ya había resuelto como correcta — en vez de forzar con
`--legacy-peer-deps`, que el propio `npm` advierte como "potentially broken".

**Hallazgo de estructura:** se verificó en el código fuente instalado
(`node_modules/expo/node_modules/@expo/cli/build/src/start/server/metro/router.js:125-133`)
que `expo-router` usa `src/app/` solo si esa carpeta existe; si no, cae a `app/` en
la raíz. Como `src/` de este proyecto no tiene subcarpeta `app/`, la estructura ya
documentada en `CLAUDE.md`, `PLAN-FASES.md` y los 9 specs de módulo (`app/` como
directorio de primer nivel, sibling de `src/`) es válida sin cambios.

**Consecuencia:** ninguna decisión de arquitectura previa se revierte. Este ADR es
el registro de que las versiones se verificaron activamente, con sus trampas, en
vez de asumirse.

## ADR-012 · 2026-08-11 · Aceptada — supersede parcialmente a ADR-011
**Decisión:** downgrade de Expo SDK 57 → **SDK 54 (`expo@54.0.36`)**. Este es el
evento de "la realidad diverge del plan" que §12.7 del brief anticipa
explícitamente ("ej. una librería no funciona en Expo Go") — se registra aquí en
vez de parchear en silencio.

**Razón, con evidencia verificada, no asumida:**
El operador reportó que Expo Go decía necesitar "una versión más nueva" pese a estar
ya actualizada. Se verificó contra fuentes oficiales de Expo, no de memoria (el
conocimiento del agente no cubre nada posterior a mayo 2026, y SDK 57 es de después):

- Changelog oficial de SDK 57 (30 jun 2026), cita textual: *"We'd like to release a
  new version for SDK 57, but we're still waiting on approval"* — el build de Expo
  Go para SDK 57 seguía en cola de revisión de Apple.
- Ficha real del App Store (`apps.apple.com/us/app/expo-go/id982107779`), consultada
  el 11 ago 2026: **versión publicada 54.0.2**, sin actualizar desde el 23 sep 2025.
- Conclusión: el Expo Go que el operador tiene instalado (desde el App Store, la
  única fuente permitida por §3 — "cero intención de publicación en App Store") solo
  soporta hasta SDK 54. Instalar "la última" SDK (57) fue exactamente el tipo de
  suposición que el protocolo anti-alucinación existe para evitar — en este caso no
  sobre una API, sino sobre la disponibilidad real de una plataforma externa.

**Dos hallazgos adicionales durante el downgrade:**
1. `expo-status-bar` había quedado en el array `plugins` de `app.json` desde el
   scaffold original (SDK 57), auto-añadido por `expo install` sin que el agente lo
   pidiera. Se verificó que el paquete **no tiene `app.plugin.js`** (no es un config
   plugin real, es solo un componente `<StatusBar>`) y se retiró de `plugins`. La
   propia CLI lo señaló al fallar su verificación interna por un problema de Node.js
   ajeno a este proyecto (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`).
2. `expo-router` trae, también en la línea de SDK 54, una dependencia dura (vía
   `@expo/ui`/`@radix-ui`) que resuelve `react-dom@19.2.8` como peer opcional —
   incompatible con el `react@19.1.0` real que pide React Native 0.81.5 en esta SDK.
   Se resolvió con `"overrides": { "react-dom": "19.1.0" }` en `package.json` en vez
   de forzar con `--legacy-peer-deps` (que `npm` advierte como "potentially
   broken" para todo el árbol). El proyecto no usa `react-dom` en ningún punto —
   no hay soporte web — así que fijar su versión solo satisface la consistencia
   de peers de `npm`, no afecta funcionalidad real.

**Versiones finales de Fase 0 (reemplazan a la tabla "no instalada aún" de
ADR-011 para lo que Fase 0 sí instala):**

| Paquete | Versión | Nota |
|---|---|---|
| expo | 54.0.36 | antes 57.0.12 |
| expo-router | ~6.0.24 | antes ~57.0.12 — numeración propia, no sigue al SDK |
| expo-constants | ~18.0.13 | |
| expo-linking | ~8.0.12 | |
| expo-status-bar | ~3.0.9 | fuera de `plugins`, ver hallazgo 1 |
| react | 19.1.0 | antes 19.2.8 |
| react-native | 0.81.5 | antes 0.86.2 |
| react-native-safe-area-context | ~5.6.0 | |
| react-native-screens | ~4.16.0 | |
| typescript | ~5.9.2 | antes ~6.0.3 |
| @types/react | ~19.1.10 | |
| jest-expo | ~54.0.17 | antes ~57.0.4 |

**Re-verificado tras el downgrade:** `npx tsc --noEmit` limpio, `npm test` verde,
`npx expo export --platform ios` bundlea 964 módulos sin error. Estructura `app/` en
la raíz sin cambios (confirmado empíricamente: el bundle encuentra las rutas sin
error, no hace falta releer el código fuente de `expo-router` para esta versión).

**Consecuencia:** ninguna decisión de arquitectura del proyecto cambia — esto es un
ajuste de versión de plataforma externa, no de diseño propio. **Nuevo pendiente:**
ver P-6 abajo, sobre cuándo revisitar SDK 57.

## ADR-013 · 2026-08-12 · Aceptada
**Decisión:** API real de `ts-fsrs@5.4.1` y `expo-sqlite@16.0.10` (SDK 54), leída de
`node_modules/ts-fsrs/dist/index.d.ts` y `node_modules/expo-sqlite/build/*.d.ts`
antes de escribir `scheduler.ts` — Skill `verificar-api-libreria`, paso 6 de
`modulos/01-motor-fsrs.md`.

**Hallazgos de `ts-fsrs` que el spec original no anticipaba:**
- La fábrica es `fsrs(params?): FSRS`, función suelta, no `new FSRS()` directo
  (aunque la clase también se exporta).
- `Rating`: `Manual=0, Again=1, Hard=2, Good=3, Easy=4`. `Grade` = los 4 sin Manual.
- `State`: `New=0, Learning=1, Review=2, Relearning=3`.
- **`get_retrievability(card, now?, format?: false): number` existe en la
  librería.** `estadoVisual()` no necesita reimplementar la curva de olvido a
  mano — se llama a la librería, tal como exige el invariante I-7.
- `Card.elapsed_days` está **deprecado, se elimina en la versión 6.0.0**. No se
  persiste (ya no estaba en el esquema de `MODELO-DATOS.md`, confirmado correcto).
- `CardInput` acepta `due`/`last_review` como `Date | number | string` — un ISO
  string guardado en SQLite se puede pasar tal cual, sin parsear a mano.
- `TypeConvert.state(value): State` normaliza `State | StateType` (número o
  string) — se usa en `estadoVisual()` en vez de comparar a mano.
- `f.repeat(card, now)` devuelve los 4 grados a la vez (`IPreview`); `f.next(card,
  now, grade)` devuelve uno. El wrapper usa `next()` para calificar.

**Hallazgos de `expo-sqlite` que confirman el plan sin cambios:**
- `openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`,
  `withTransactionAsync` — todos existen tal como se asumió en la Skill
  `verificacion` (los greps de convención de la Fase 0 ya buscaban estos nombres).
- **No hay mecanismo de versionado de esquema integrado** (`SQLiteOpenOptions` no
  tiene nada de esto) — confirma que la tabla `migracion` propia de
  `MODELO-DATOS.md` §3 es necesaria, no redundante.

**Consecuencia:** ninguna decisión de arquitectura cambia; esto es la verificación
que el spec pedía, ahora con evidencia. `scheduler.ts` usa `get_retrievability` y
`TypeConvert.state` en vez de reimplementarlos.

## ADR-015 · 2026-08-12 · Aceptada
**Decisión:** `armarSesion()` baraja la **presentación** final de la sesión
(Fisher-Yates, vía un parámetro `aleatorizar` inyectable — mismo patrón que el
reloj `ahora` de I-6). La **selección** de qué tarjetas entran no cambia:
vencidas por urgencia, luego nuevas en orden de número.

**Razón:** el operador probó una sesión real de 20 tarjetas en modo Reverso y
notó que, al ir siempre en orden ascendente, la posición dentro de la sesión
delataba el número sin necesidad de recordar nada (si vas por la tarjeta 25 de
una sesión que arrancó en la 21, el rango ya está resuelto). §7.2/modulos/02
nunca contemplaron esto — se verificó explícitamente contra todo `agent_docs/`
(único "aleatorio" existente era el de Baraja Completa de naipes, §8.3, un
concepto distinto) antes de asumir que hacía falta diseñarlo de cero.

**Por qué la selección no cambió:** elegir las tarjetas nuevas en orden
ascendente sigue siendo lo correcto — garantiza cobertura sistemática del
corpus de 100 sin huecos. El problema era solo que ese orden de SELECCIÓN se
filtraba a la PRESENTACIÓN. Separar ambas cosas resuelve el problema sin tocar
la lógica de priorización ya probada.

**Consecuencia:** los tests de orden exacto en `motor.test.ts` y
`repository.test.ts` pasan `aleatorizar: (arr) => arr` para aislar la selección
del barajado (si no, serían flaky). Se verificó 5 ejecuciones seguidas sin
fallos antes de aceptar el diseño. `modulos/02-colgadero.md` §3 actualizado.
Este mismo `aleatorizar` inyectable lo reusará la Fase 3 (Baraja Completa ya
pide barajado con semilla — incluso podría compartir la función `barajar()`).

## ADR-016 · 2026-08-12 · Aceptada — corrige terminología de ADR-004
**Decisión:** las figuras del mazo se llaman **J, Q, K** en toda la documentación
activa, nunca "Sota, Reina, Rey". Además, el origen de las 52 palabras cambia:
**el operador las dicta directamente** (como hizo con `colgadero-100.md`), no
"agente propone candidatas → operador aprueba" como decía originalmente
`seeds/naipes-52.md` §5 / ADR-004.

**Razón — terminología:** al preguntar por P-1, el operador aclaró que el mazo de
referencia es el **francés estándar de 52 cartas con J/Q/K** (♠♦♣♥), no la baraja
española tradicional (Oros/Copas/Espadas/Bastos, sin Reina, con Sota/Caballo/Rey).
"Sota, Reina, Rey" mezclaba vocabulario de los dos mazos — de hecho la baraja
española tradicional ni siquiera tiene Reina. Los **palos** (Regla 1: Espadas =
Spades, Diamantes = Diamonds, Palos = Clubs, Corazones = Hearts) ya eran
correctos, porque ya eran la traducción del mazo francés — solo las figuras
estaban mal nombradas. `type Valor` en `naipes-52.md` §6 ya decía `'J'|'Q'|'K'`
desde Plan Mode; el error estaba solo en la prosa. **Nunca usar iconografía de
la baraja española en la UI** (§8.3 no la pide, y ahora está prohibida explícitamente).

**Razón — origen de las palabras:** el operador prefiere palabras personalmente
evocativas (como su colgadero-100) sobre palabras genéricas que solo cumplen la
regla fonética mecánicamente. Dado que Lorayne depende de que la imagen le
signifique algo específico a quien la usa, una palabra "correcta pero genérica"
propuesta por el agente vale menos que una elegida por el operador mismo.

**Consecuencia:** `seeds/naipes-52.md`, `modulos/03-naipes.md` y la fila P-1 de
este archivo actualizados. `EditorNaipe.tsx` (Fase 3) sigue siendo necesario —
el operador querrá editar palabras después igual que edita el colgadero — pero
ya no como mecanismo de "aprobar sugerencias del agente".

## ADR-017 · 2026-08-12 · Aceptada — resuelve P-1 sin necesitar la regla original de Lorayne
**Decisión:** las figuras (J, Q, K) siguen la **Regla 1** (empiezan con la letra
del palo: E/D/P/C) pero **no tienen equivalente de Regla 2** — ninguna
restricción de sonido consonante final. El operador elige libremente la palabra
de cada una de las 12 cartas de figura, memorizada directamente, no decodificada.

**Razón:** el operador cuestionó si hacía falta perseguir "la regla exacta de
Lorayne" para J/Q/K en absoluto, con dos argumentos válidos: (1) el texto
original es inglés traducido a español de España — ya se demostró con la
confusión Sota/Reina/Rey (ADR-016) que esa cadena de traducción es lossy; (2) los
naipes son un conjunto **cerrado** de 52 — no hay necesidad de una regla
*generativa* como la Regla 2 (que existe porque reutiliza la tabla fonética de
§7.2 para un rango de valores 0-9 que si tiene estructura sistemática). Para 3
figuras × 4 palos, una "regla especial de una consonante" no sería más que 3
entradas fijas en una tabla — exactamente equivalente a que el operador asigne
la palabra de cada figura directamente, que es lo que ya iba a hacer de todos
modos (ADR-016: el operador dicta las 52 palabras, no aprueba candidatas).

**Por qué Regla 1 sí se mantiene:** consistencia visual con las 40 cartas
numéricas, a coste cero — no requería ningún dato nuevo del operador, así que se
adoptó como default y se le avisó para que corrija si prefiere lo contrario.

**Consecuencia:** `validarPalabraNaipe` valida el marcador de palo para las 12
figuras igual que para las 40 numéricas, pero no aplica ninguna regla de
"último sonido" a las figuras. `cartaDesdePalabra` para figuras es una búsqueda
directa contra las 12 palabras asignadas, no una decodificación fonética.
**P-1 queda resuelto — nada bloquea ya el inicio de la Fase 3.**
`seeds/naipes-52.md` actualizado.

## ADR-018 · 2026-08-12 · Aceptada
**Decisión:** `app/_layout.tsx` usa `<Stack>` de `expo-router`, no `<Slot>`.
Cabecera nativa oscura (`headerStyle`/`headerTintColor`/`contentStyle` en
`screenOptions`), con un `<Stack.Screen name="..." options={{ title }}>` por
ruta para los títulos en español. `index` además fija
`headerBackTitle: 'Inicio'` para que las pantallas siguientes no muestren
"memory-trainer" como texto del botón de volver.

**Razón:** `Slot` (elegido en la Fase 0 sin discutirlo explícitamente, por ser
la opción más simple para una sola pantalla) no da gesto nativo de deslizar ni
botón de back en ninguna pantalla. El operador reportó dos síntomas del mismo
problema: `colgadero/index.tsx` no tenía forma de volver al menú principal, y
las 7 pantallas de sesión activa (Flash/Reverso/Velocidad × 2 categorías,
Baraja Completa) no tenían forma de salir a mitad de sesión — solo al
terminar. Parchear pantalla por pantalla con un botón "Volver" manual (como
se hizo primero en los dos `index.tsx`) resuelve el síntoma reportado pero no
el problema de fondo, y obliga a acordarse de repetirlo en cada pantalla
nueva de las fases que faltan.

**Consecuencia — regla para fases futuras:** toda ruta nueva se declara en
`app/_layout.tsx` como `<Stack.Screen name="ruta/archivo" options={{ title:
'...' }} />` para que tenga título correcto. No hace falta (ni se debe)
añadir un botón "Volver" manual a mano — el back nativo ya cubre eso. Se
retiraron los títulos y botones "Volver" que habían quedado duplicados con
la cabecera en `app/index.tsx`, `colgadero/index.tsx` y `naipes/index.tsx`.
`SafeAreaView` de ADR-anterior (fix del choque con el notch en
`naipes/index.tsx`) se retiró del layout raíz: la cabecera nativa ya respeta
el área segura superior por sí sola, mantenerlo habría duplicado el espacio
vacío arriba. `SafeAreaProvider` se conserva como contexto disponible para
`useSafeAreaInsets()` si alguna pantalla futura lo necesita para el borde
inferior.

## Pendientes de decisión

| # | Tema | Dueño | Se necesita para |
|---|---|---|---|
| ~~P-1~~ | ~~Consonantes reservadas de J / Q / K~~ — **resuelto por ADR-017**, ya no bloquea nada | — | — |
| P-2 | Visto bueno a ADR-002 (dirección inversa = misma tarjeta) | Operador | Fase 4 |
| P-3 | ¿Palabra colgadero para el dígito `0` suelto y el trozo `00`? | Operador | Fase 4 |
| P-4 | ¿`expo-notifications` dispara notificaciones locales en Expo Go con el SDK que se fije en Fase 0? | Agente (spike) | Fase 8 |
| P-5 | Simulador de iOS sin runtime descargado (`xcrun simctl list runtimes` vacío). Xcode está instalado pero falta la plataforma iOS, una descarga de varios GB que normalmente pide contraseña de administrador. No bloquea ninguna fase (el objetivo real es Expo Go en el iPhone físico), pero impide usar el simulador como verificación intermedia. | Operador | Ninguna fase (solo conveniencia) |
| P-6 | El proyecto quedó fijado en SDK 54 por ADR-012, no en "la última" a propósito. Antes de subir de SDK en cualquier fase futura, verificar primero contra `apps.apple.com/us/app/expo-go/id982107779` (o preguntar al operador qué ve en Expo Go) que la nueva versión ya está disponible en el App Store — nunca asumir que "más nueva" significa "usable". | Agente | Cualquier fase futura que toque versión de Expo SDK |

## ADR-014 · 2026-08-12 · Aceptada
**Decisión:** `src/db/tipos.ts` define una interfaz propia `ConexionBD`
(`execAsync`/`runAsync`/`getAllAsync`/`getFirstAsync`/`withTransactionAsync`),
sin importar nada de `expo-sqlite`. `client.ts` la satisface con la BD real del
dispositivo; `repository.test.ts` la satisface con un adaptador sobre
`node:sqlite` (`src/db/conexionDePrueba.ts`).

**Razón, con evidencia:** `expo-sqlite` es un módulo nativo real (bindings JSI).
Se comprobó empíricamente que **no corre bajo Jest**: `openDatabaseAsync` revienta
con `TypeError: _ExpoSQLite.default.NativeDatabase is not a constructor` porque
el módulo nativo no existe fuera de un runtime iOS/Android/Expo Go. `PLAN-FASES.md`
asumía que `repository.test.ts` podría probar directo contra `expo-sqlite`; esa
suposición era falsa.

La alternativa de mockear la BD con un objeto JS en memoria se descartó: no
probaría el DDL/DML real, y `db-migracion` Paso 4 exige probar migraciones sobre
una BD **con datos**, no sobre una simulación. `node:sqlite` (built-in de Node
desde v22, confirmado disponible: `node -v` → v22.22.3) ejecuta el mismo motor
SQLite real, así que los tests siguen siendo honestos.

**Consecuencia:** `src/db/tipos.ts` no importa `expo-sqlite` ni siquiera como
tipo. Solo `client.ts` lo hace (verificado con grep: única línea `import ...
from 'expo-sqlite'` del proyecto). Cualquier fase futura que añada tablas sigue
este mismo patrón para sus propios tests de repositorio.

**Hallazgo adicional, corregido antes de commitear:** el esquema de `tarjeta` en
`MODELO-DATOS.md` y la migración `001_inicial.ts` no tenían columna para
`learning_steps` de `ts-fsrs` (campo requerido de `Card`/`CardInput`, distinto de
`elapsed_days` que sí está deprecado). Sin persistirlo, releer una tarjeta desde
la BD reiniciaría su paso de aprendizaje a 0 en cada carga — pérdida silenciosa de
estado, justo lo que el invariante I-2 prohíbe. Se añadió `fsrs_learning_steps`
a la tabla, a `FilaTarjeta` y al mapeo `filaACardInput`/`calificarTarjeta` antes de
que ningún archivo con el hueco se commiteara. `MODELO-DATOS.md` §2.2 actualizado.
