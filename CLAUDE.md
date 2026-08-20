# memory-trainer

App iOS personal (Expo Go, sin backend) para practicar a diario las técnicas de memoria
de Harry Lorayne, con repetición espaciada FSRS y racha estilo Duolingo.

Especificación completa: `PROJECT_BRIEF.md`. Este archivo es el resumen operativo;
cuando se contradigan, manda el brief.

## Stack (fijo, no sustituir sin ADR)

| Capa | Tecnología |
|---|---|
| Framework | Expo (SDK estable) + React Native |
| Lenguaje | TypeScript (`strict: true`) |
| Almacenamiento | `expo-sqlite` — 100 % local |
| Repetición espaciada | `ts-fsrs` |
| Navegación | `expo-router` (file-based) |
| Notificaciones | `expo-notifications` (locales) |
| Estado | Zustand |
| Tests | Jest |

## Comandos

```bash
npx expo start          # arrancar; escanear el QR con Expo Go
npm test                # Jest
npm test -- --watch     # Jest en watch
npx tsc --noEmit        # comprobar tipos
```

## Estructura (5 directorios de primer nivel)

```
app/          Pantallas (expo-router). Solo UI y navegación.
src/          db/ domain/ stores/ components/ seed/ notificaciones/ tema/
assets/       Iconos e imágenes.
agent_docs/   Specs, decisiones y modelo de datos. Ver agent_docs/README.md
.claude/      skills/ y commands/
```

## Convenciones

1. **Todo acceso a datos pasa por `src/db/repository.ts`.** Ninguna query SQL suelta
   en pantallas, componentes o stores. `expo-sqlite` solo se importa en `src/db/`.
2. **Todo scheduling pasa por `src/domain/fsrs/scheduler.ts`**, que envuelve `ts-fsrs`.
   Nunca aritmética de fechas o intervalos fuera de ahí. Nunca fijar
   `fecha_proxima_revision` a mano.
3. **`src/domain/` es lógica pura: prohibido importar React o `expo-*` ahí.** Es lo que
   permite probar FSRS y fonética con Jest sin mocks nativos (ADR-007).
4. **Toda la UI en español (Colombia).** Nombres de dominio en español también en el
   código (ver `agent_docs/GLOSARIO.md`).

## Anti-alucinación (resumen — completo en `agent_docs/ANTI-ALUCINACION.md`)

- Tienes **permiso explícito** para decir "no estoy seguro de que esta API funcione
  así". Decirlo es correcto; inventar una firma plausible es el fallo.
- Antes de usar cualquier API de `expo-sqlite`, `ts-fsrs`, `expo-notifications` o
  `expo-router`: **verifícala contra el paquete instalado en `node_modules/`**. Nunca
  la asumas de memoria ni por analogía con otra librería.
- Requisitos de la app: solo `PROJECT_BRIEF.md`, `agent_docs/` y `DECISIONS.md`. No
  inventes funcionalidad, campos "por si acaso", ni contenido de dominio (palabras
  colgadero, imágenes de naipes, reglas fonéticas). Si falta un dato, **pregunta**.
- Toda afirmación de estado ("ya implementé X", "los tests pasan") va con evidencia:
  archivo y línea, o salida real del comando. Si no puedes señalarla, **retráctala**.
- TDD obligatorio en `src/domain/fsrs/`, `src/domain/fonetica/`, `src/domain/racha/`
  y `src/domain/numeros/`: primero el test, luego el código, luego correrlo.

## Dónde está cada cosa

| Necesitas | Ruta |
|---|---|
| Plan de fases y archivos por fase | `agent_docs/PLAN-FASES.md` |
| Por qué algo se hizo así | `agent_docs/DECISIONS.md` |
| Esquema, migraciones, derivaciones | `agent_docs/MODELO-DATOS.md` |
| Alfabeto fonético y dígrafos | `agent_docs/decodificacion-fonetica.md` |
| Reglas de las 52 cartas | `agent_docs/seeds/naipes-52.md` |
| Spec de un módulo de §8 | `agent_docs/modulos/0N-*.md` |
| Estado de la sesión anterior | `SESSION_NOTES.md` |

## Skills (`.claude/skills/`)

| Skill | Cuándo |
|---|---|
| `nueva-fase` | Al empezar cualquier fase del plan |
| `verificacion` | Antes de **cada** commit |
| `fsrs-review` | Al tocar cualquier cosa de scheduling o estado de tarjetas |
| `verificar-api-libreria` | Antes de usar una API que no has leído en esta sesión |
| `db-migracion` | Al crear o modificar cualquier migración |
| `cierre-sesion` | Al terminar cualquier sesión, aunque la fase quede a medias |

Comandos: `/nueva-fase N`, `/verificar`, `/cerrar-sesion`, `/estado`.

## Protocolo de sesión

1. **Explore** (Opus, Plan Mode) — leer y preguntar. En Plan Mode la única salida son `.md`.
2. **Plan** — `CLAUDE.md`, Skills, `agent_docs/`, plan de fases. El operador lo revisa como PR.
3. **Implement** (Sonnet) — fase por fase, en orden, con la Skill `nueva-fase`.
4. **Verify** — `/verificar` antes de cualquier commit.
5. **Compact** — proactivamente al **60 %** de contexto, o cada 25–30 min, o al terminar
   una subtarea. Nunca esperar al límite duro.
6. **Handoff** — `/cerrar-sesion` y `SESSION_NOTES.md` al cerrar. Sin excepción.
7. Si la realidad diverge del plan (una librería no funciona en Expo Go), **volver a
   Plan Mode**. Nunca parchear en silencio una decisión ya aprobada.

Cada fase cierra con: tests pasando + commit + verificación manual real en el iPhone
vía Expo Go. Nunca avanzar con la fase anterior en estado dudoso.

## Estado actual

Fases 0-4 completas y verificadas en Expo Go (iPhone real, SDK 54). Colgadero,
Naipes, Listas Encadenadas y Números Importantes funcionales: decodificador
fonético, 52+100 palabras sembradas, eslabones por identidad de objeto
(ADR-020), descomposición numérica con casos Oro/Rara (ADR-019), navegación
nativa por Stack (ADR-018, no Slot; `headerBackTitle` va en la pantalla de
destino, no en la de origen). Fase 5 (Racha y Dashboard) **completa y
cerrada** (2026-08-13→14): racha con congelador manual, sesión mixta
priorizada, dashboard como pantalla de inicio. Confirmación de 2 días
recibida (07-racha.md §7) — con una nota honesta: el operador no tocó la app
el primer día, así que confirma que la racha en cero persiste bien entre
reinicios, pero no probó todavía que una racha con progreso real sobreviva un
día completo; queda como candidato a una prueba más exigente si surge duda
más adelante. Diseño visual de Fase 8 (pulido) ya investigado y documentado
por adelantado — ver `PLAN-FASES.md` §Fase 8. Fase 6 (Panel de Retención)
**completa y cerrada** (2026-08-15): panel por categoría/ventana, tarjetas
problemáticas, historial de sesiones en pantalla propia (feedback real de
dispositivo — no inline). `done when` verificado con SQL manual contra la
BD real exportada del dispositivo (`agent_docs/consultas-verificacion.sql`,
botón "Exportar BD" vía `expo-sharing`, ADR-024): los 4 porcentajes de
retención, los 4 conteos de estado por categoría y las 52 tarjetas
problemáticas coinciden exactamente. En el camino: `mezclarSesion` corregida
para que ninguna categoría monopolice las vencidas (ADR-023, corrección de
causa en Corrección-a-ADR-023 — el mecanismo real era Learning atascado, no
lapses).

Fase 7 (Ejercicios Personalizados) **completa y cerrada** (2026-08-20):
`REGISTRO`/`GUARDAR_CATEGORIA`/`ARCHIVAR_CATEGORIA` (§8.6) — formulario
genérico dirigido por tabla, cero cambios en `FormularioGenerico.tsx` al
agregar una categoría de prueba (criterio §3 probado y revertido). Naipe sin
creación ni archivado, solo edición — mazo cerrado de 52 cartas (ADR-025).
Verificado en Expo Go por el operador: crear en colgadero/número/lista_item,
editar un naipe, cerrar y reabrir con las 4 categorías apareciendo en sesión,
y archivar un colgadero con persistencia confirmada tras cerrar Expo Go del
todo (no solo recargar). En el camino: `useFocusEffect` corregido en
`listas/[id].tsx`, `listas/index.tsx`, `naipes/index.tsx` y
`numeros/index.tsx` (el Stack no desmonta pantallas al volver — mismo bug ya
conocido de Fase 5, reaparecido por no haberse aplicado ahí en su momento);
cadena mnemotécnica visible al editar un número (antes solo al crearlo);
listado completo de palabras colgadero en su pantalla de índice (hueco real
que impedía llegar a una palabra sin historial de revisión problemático).
Hallazgo aparte, sin tocar código: 3 palabras colgadero (números 28/37/40)
pueden seguir desactualizadas en dispositivos que sembraron antes de la
corrección del 2026-08-12 (commit `7f95d46`) — las migraciones no
resiembran; se corrigen a mano, tarjeta por tarjeta, con el editor nuevo.

---

## NUNCA HACER (constraints duras — §3 del brief)

| Nunca | En positivo |
|---|---|
| Agregar backend, auth o sync en la nube | Todo el almacenamiento vive en `expo-sqlite`, local al dispositivo |
| Usar Redux | Zustand para todo el estado |
| Generar código en Plan Mode | En Plan Mode la única salida son archivos `.md` |
| Superar 200 líneas en `CLAUDE.md` | Todo detalle extra va a `agent_docs/` o `.claude/skills/` |
| Implementar Palacio de Loci o PAO todavía | Solo dejar el modelo de datos extensible para ellos |
| Marcar una fase terminada sin correrla en Expo Go | Cada fase cierra con verificación manual + commit |
| Escribir queries SQL sueltas fuera del repositorio | Todo acceso a datos pasa por `src/db/repository.ts` |
| Reimplementar FSRS a mano | Usar `ts-fsrs`; verificar contra el paquete instalado |
| Inventar contenido de dominio | Preguntar al operador y esperar |
| Cerrar una sesión sin `SESSION_NOTES.md` | Ejecutar `/cerrar-sesion` siempre |

## Repetición final (las que más se olvidan)

**No backend. No autenticación. No nube. No analítica de terceros. No Redux.
No código en Plan Mode. No más de 200 líneas aquí. No Loci ni PAO todavía.
Nada marcado como "hecho" sin evidencia verificable adjunta. No pasar del 60 % de
contexto sin compactar. No cerrar sesión sin `SESSION_NOTES.md`.**
