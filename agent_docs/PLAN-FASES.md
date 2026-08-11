# Plan de fases

Deriva de §11 del brief. Los `done when` son **literales del brief**; lo que este
documento añade es la lista concreta de archivos por fase y la evidencia exigida.

**Reglas transversales a todas las fases:**
- Se entra con la Skill `nueva-fase` (o `/nueva-fase N`). Sin excepción.
- Se cierra con `/verificar` en verde, commit, y verificación manual en Expo Go.
- Nunca se avanza con la fase anterior en estado dudoso.
- Si la realidad diverge del plan, se vuelve a Plan Mode (§12.7). No se parchea en silencio.

---

## Fase 0 — Scaffold

**Objetivo:** proyecto Expo + TypeScript + expo-router que arranca en Expo Go.

**Archivos a crear**
| Archivo | Para qué |
|---|---|
| `.gitignore` | `node_modules/`, `.expo/`, `*.db`, `dist/`, `.DS_Store` |
| `package.json`, `package-lock.json` | dependencias con **versiones fijadas** |
| `app.json` | config de Expo |
| `tsconfig.json` | `strict: true` |
| `babel.config.js`, `jest.config.js` | build y tests |
| `app/_layout.tsx`, `app/index.tsx` | raíz de expo-router, pantalla vacía |
| `src/dominio-smoke.test.ts` | test trivial que prueba que Jest corre |

**Antes de escribir nada:** `git init` (ADR-005) y Skill `verificar-api-libreria`
sobre Expo SDK, `expo-router`, `expo-sqlite` y `ts-fsrs` → anotar en `DECISIONS.md`
las versiones exactas instaladas.

**`done when` (§11):** corre en Expo Go mostrando pantalla en blanco sin errores en consola.
**Evidencia:** salida de `npx expo start`, `npx tsc --noEmit` limpio, `npm test` en
verde, y descripción de lo que se vio en el iPhone.

---

## Fase 1 — Motor FSRS + esquema

**Objetivo:** `ts-fsrs` integrado, SQLite con esquema completo, CRUD de tarjetas y mazos.
**Spec:** `modulos/01-motor-fsrs.md`, `MODELO-DATOS.md`

| Archivo | Para qué |
|---|---|
| `src/db/client.ts` | única apertura de la BD; único punto que importa `expo-sqlite` |
| `src/db/migrations/001_inicial.ts` | `mazo`, `tarjeta`, `revision`, `sesion_estudio`, `migracion` |
| `src/db/migrations/index.ts` | corredor de migraciones con tabla de versión |
| `src/db/tipos.ts` | `Categoria`, filas, DTOs |
| `src/db/repository.ts` | **única** superficie de acceso a datos |
| `src/domain/fsrs/config.ts` | parámetros y retención objetivo, en un solo sitio |
| `src/domain/fsrs/scheduler.ts` | envoltorio delgado de `ts-fsrs` |
| `src/domain/fsrs/estado.ts` | `estadoVisual()` derivado |
| `src/domain/fsrs/scheduler.test.ts` | **los 5 escenarios E-1…E-5** |
| `src/db/repository.test.ts` | CRUD + migración sobre BD con datos |
| `agent_docs/DECISIONS.md` | versión de `ts-fsrs` y forma real de su API |

**`done when` (§11):** tests de Jest pasan sobre los 5 escenarios documentados en
`modulos/01-motor-fsrs.md` §4.
**Evidencia:** salida de `npm test` mostrando E-1…E-5, `tsc` limpio, y la app
abriendo en el iPhone con la BD creada.

---

## Fase 2 — Colgadero

**Objetivo:** seed de 100 palabras y los 3 modos de práctica.
**Spec:** `modulos/02-colgadero.md`, `decodificacion-fonetica.md`, `seeds/colgadero-100.md`

| Archivo | Para qué |
|---|---|
| `src/domain/fonetica/tabla.ts` | tabla canónica de §7.2 |
| `src/domain/fonetica/decodificador.ts` | `decodificar`, `aNumero`, `validarColgadero`, `explicar` |
| `src/domain/fonetica/decodificador.test.ts` | **las 100 semillas** + 12 casos difíciles |
| `src/seed/colgadero.ts` | las 100 palabras |
| `src/db/migrations/002_seed_colgadero.ts` | siembra idempotente |
| `src/domain/sesion/motor.ts` | motor de sesión parametrizable (lo reusa la Fase 3) |
| `src/domain/sesion/motor.test.ts` | selección y orden de tarjetas |
| `src/stores/sesion.ts` | estado de la sesión en curso (Zustand) |
| `src/components/Flashcard.tsx`, `BotonesCalificacion.tsx`, `PausaVisualizacion.tsx` | UI de tarjeta |
| `app/(tabs)/colgadero.tsx` + `app/colgadero/{flash,reverso,velocidad}.tsx` | los 3 modos |
| `src/components/EstadisticasPalabra.tsx` | veces revisada, aciertos, próxima fecha |

**`done when` (§11):** se completa una sesión real de 20 tarjetas en el dispositivo sin crash.

---

## Fase 3 — Naipes

**Objetivo:** 52 cartas, mismos 3 modos + Modo Baraja Completa.
**Spec:** `modulos/03-naipes.md`, `seeds/naipes-52.md`
**Al entrar:** resolver el bloqueo P-1 con el operador (figuras). Preguntar y esperar.

| Archivo | Para qué |
|---|---|
| `src/domain/fonetica/naipes.ts` | marcador de palo + valor por último sonido |
| `src/domain/fonetica/naipes.test.ts` | los 6 contratos de `seeds/naipes-52.md` §7 |
| `src/seed/naipes.ts` | 52 cartas; palabras solo si el operador las aprobó |
| `src/db/migrations/003_seed_naipes.ts` | siembra idempotente |
| `src/components/EditorNaipe.tsx` | editar palabra con validación no bloqueante |
| `app/naipes/{index,flash,reverso,velocidad,baraja-completa}.tsx` | los 4 modos |
| `src/domain/naipes/baraja.ts` + test | barajado con semilla, comparación posicional |

**`done when` (§11):** se mide y muestra tiempo + precisión de una baraja completa.
**Señal de alarma:** si esta fase obliga a copiar y pegar las pantallas de la Fase 2,
la abstracción de `motor.ts` está mal y hay que arreglarla, no duplicarla.

---

## Fase 4 — Listas y números

**Objetivo:** CRUD y modos de práctica de §8.4 y §8.5.
**Spec:** `modulos/04-listas-cadena.md`, `modulos/05-numeros.md`
**Al entrar:** confirmar ADR-002 (P-2) y decidir P-3 con el operador.

| Archivo | Para qué |
|---|---|
| `src/db/migrations/004_listas_numeros.ts` | `lista`, `lista_objeto`, `numero_importante` |
| `src/domain/cadena/eslabones.ts` + test | N objetos → N−1 eslabones; insertar/reordenar |
| `src/domain/numeros/descomposicion.ts` + test | troceo, impares, ceros, casos sin colgadero |
| `src/db/repository.ts` | CRUD de listas, objetos y números |
| `src/components/EditorLista.tsx`, `TemporizadorEstudio.tsx` | UI |
| `app/listas/{index,[id],estudiar}.tsx` | CRUD y modo de estudio |
| `app/numeros/{index,nuevo,repasar}.tsx` | CRUD y repaso |

**`done when` (§11):** se crea, estudia y repasa una lista personalizada real de punta a punta.

---

## Fase 5 — Racha y Dashboard

**Objetivo:** racha, congelador, sesión mixta priorizada.
**Spec:** `modulos/07-racha.md`, `modulos/09-dashboard.md`

| Archivo | Para qué |
|---|---|
| `src/db/migrations/005_racha.ts` | `dia_practica`, `racha_config` |
| `src/domain/racha/calculo.ts` + test | los 7 casos borde, con reloj inyectado |
| `src/domain/sesion/mezcla.ts` + test | prioridad FSRS, reparto entre categorías |
| `src/stores/racha.ts` | estado de racha |
| `app/(tabs)/index.tsx` | dashboard |
| `app/racha.tsx` | detalle, congeladores, heatmap |
| `src/components/IndicadorRacha.tsx`, `Heatmap90.tsx` | UI |

**`done when` (§11):** la racha persiste correctamente tras cerrar y reabrir la app
dos días distintos.
**Nota honesta:** verificarlo toma dos días de calendario. Cierre en dos tiempos, según
`modulos/07-racha.md` §7. Hasta la confirmación del día +1, la fase se marca
**"cerrada a la espera de confirmación de 2 días"**, nunca "hecha".

---

## Fase 6 — Panel de retención

**Objetivo:** estadísticas por categoría, historial, tarjetas problemáticas.
**Spec:** `modulos/08-panel-retencion.md`

| Archivo | Para qué |
|---|---|
| `src/domain/estadisticas/retencion.ts` + test | métricas puras sobre `revision` |
| `src/db/repository.ts` | consultas agregadas |
| `app/(tabs)/estadisticas.tsx` | panel |
| `src/components/TarjetasProblematicas.tsx` | peores primero, enlace a editar |
| `agent_docs/consultas-verificacion.sql` | **una consulta manual por métrica** |

**`done when` (§11):** los números mostrados coinciden con los datos crudos de
SQLite, verificado con query manual.
**Prohibido:** ajustar la consulta para que coincida con la pantalla. Invierte el
sentido de la verificación.

---

## Fase 7 — Ejercicios personalizados

**Objetivo:** CRUD genérico por categoría, sin tocar código.
**Spec:** `modulos/06-ejercicios-custom.md`

| Archivo | Para qué |
|---|---|
| `src/domain/categorias/registro.ts` + test | registro declarativo de campos por categoría |
| `src/components/FormularioGenerico.tsx` | formulario dirigido por el registro |
| `app/crear/[categoria].tsx` | ruta dinámica |
| `app/(tabs)/gestionar.tsx` | listado y edición por categoría |

**`done when` (§11):** se agrega un ítem nuevo sin tocar código y aparece en la
próxima sesión de repaso.

---

## Fase 8 — Pulido

**Objetivo:** notificaciones, modo oscuro, animaciones.

**Primero, un spike (pendiente P-4):** verificar con la Skill
`verificar-api-libreria` si `expo-notifications` dispara **notificaciones locales**
dentro de **Expo Go** con el SDK fijado en la Fase 0. El soporte de este paquete en
Expo Go ha cambiado entre versiones; se comprueba contra el paquete instalado y la
doc oficial de esa versión, no de memoria.

- Si funciona → se implementa el recordatorio nocturno de racha en riesgo.
- Si **no** funciona en Expo Go → se implementa el **fallback**: aviso in-app de
  racha en riesgo al abrir la app, y se registra un ADR diciendo que el `done when`
  de §11 no es alcanzable bajo la restricción "solo Expo Go" (§3). La decisión de
  pasar o no a development build es **del operador**, no del agente.

| Archivo | Para qué |
|---|---|
| `src/notificaciones/racha.ts` | permisos y programación del recordatorio |
| `src/tema/{colores,tipografia}.ts` | modo oscuro por defecto (§10) |
| `app/_layout.tsx` | aplicar tema |
| `src/components/IndicadorRacha.tsx` | animación simple de la llama (sin Skia ni Reanimated complejo) |
| `app/(tabs)/ajustes.tsx` | meta diaria, hora de recordatorio, congeladores |

**`done when` (§11):** la notificación local de racha en riesgo se dispara
correctamente en un test manual — **o**, si el spike lo desmiente, el fallback
funcionando + el ADR que documenta la limitación.

---

## Matriz de cobertura módulo → fase

| Módulo (§8) | Spec | Fase |
|---|---|---|
| 8.1 Motor FSRS | `modulos/01-motor-fsrs.md` | 1 |
| 8.2 Colgadero | `modulos/02-colgadero.md` | 2 |
| 8.3 Naipes | `modulos/03-naipes.md` | 3 |
| 8.4 Listas / Cadena | `modulos/04-listas-cadena.md` | 4 |
| 8.5 Números | `modulos/05-numeros.md` | 4 |
| 8.6 Ejercicios personalizados | `modulos/06-ejercicios-custom.md` | 7 |
| 8.7 Racha | `modulos/07-racha.md` | 5 (+ notificación en 8) |
| 8.8 Panel de retención | `modulos/08-panel-retencion.md` | 6 |
| 8.9 Dashboard | `modulos/09-dashboard.md` | 5 |

Los 9 módulos tienen spec y fase asignada. §7.5 (Palabras Clave) queda fuera del
alcance activo por ADR-003.
