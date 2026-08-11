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

## Pendientes de decisión

| # | Tema | Dueño | Se necesita para |
|---|---|---|---|
| P-1 | Consonantes reservadas de Sota / Reina / Rey | Operador | Fase 3 |
| P-2 | Visto bueno a ADR-002 (dirección inversa = misma tarjeta) | Operador | Fase 4 |
| P-3 | ¿Palabra colgadero para el dígito `0` suelto y el trozo `00`? | Operador | Fase 4 |
| P-4 | ¿`expo-notifications` dispara notificaciones locales en Expo Go con el SDK que se fije en Fase 0? | Agente (spike) | Fase 8 |
| P-5 | Simulador de iOS sin runtime descargado (`xcrun simctl list runtimes` vacío). Xcode está instalado pero falta la plataforma iOS, una descarga de varios GB que normalmente pide contraseña de administrador. No bloquea ninguna fase (el objetivo real es Expo Go en el iPhone físico), pero impide usar el simulador como verificación intermedia. | Operador | Ninguna fase (solo conveniencia) |
