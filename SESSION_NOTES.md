# SESSION_NOTES

**Sesión:** 2026-08-11 → 2026-08-12 · **Modelo:** Opus (Plan Mode) → Sonnet (implementación)
**Fase:** 2 (Colgadero) — **cerrada**. Siguiente: Fase 3 (Naipes), bloqueada por P-1.

## Estado de la fase

Fases 0, 1 y 2 **cerradas**, cada una con commit + verificación manual real en el
iPhone del operador (no solo declarada). Fase 3 no empezada — tiene un bloqueo
real que impide siquiera arrancarla sin antes preguntar al operador.

## Qué se hizo

Sesión larga, continua, que cubrió el ciclo completo Plan→Implement de tres fases:

- **Plan Mode:** `CLAUDE.md`, 6 Skills, 4 comandos, `agent_docs/` completo (specs de
  9 módulos, modelo de datos, plan de 9 fases). Repo git propio inicializado
  (`git init` en `memory-trainer/`, aislado de `~/Código`).
- **Fase 0:** scaffold Expo + TS strict + expo-router. **Downgrade real de SDK 57 a
  54** (§7 abajo) tras un problema real reportado por el operador. → `c157ae4`,
  `f159ea1`, `1c9b7f9`, `faa8c1c`.
- **Fase 1:** `ts-fsrs` integrado vía envoltorio delgado, esquema SQLite
  (mazo/tarjeta/revision/sesion_estudio/migracion), repositorio. Se descubrió que
  `expo-sqlite` no corre bajo Jest → `ConexionBD` propia + adaptador sobre
  `node:sqlite` para tests reales (ADR-014). Se corrigió un hueco real de esquema
  (`fsrs_learning_steps` faltante) antes de commitear. → `5999dbe`, `99b24b3`.
- **Fase 2:** decodificador fonético con TDD (124 tests, las 100 palabras semilla
  verificadas a mano contra las reglas antes de escribir código), migración de
  siembra, motor de sesión, store Zustand, 3 pantallas de práctica. El operador
  probó una sesión real de 20 tarjetas y reportó dos problemas reales (espaciado
  de UI, y que la selección secuencial de tarjetas nuevas delataba el número en
  modo Reverso) — ambos corregidos y reverificados en dispositivo antes de
  commitear (ADR-015). → `57f68d4`, `603b287`.

## Qué archivos se tocaron y por qué

Resumen — el detalle línea por línea está en los propios mensajes de commit
(`git log --stat`), que son más fiables que repetirlo aquí:

| Área | Archivos | Por qué |
|---|---|---|
| Gobernanza | `CLAUDE.md`, `.claude/`, `agent_docs/` | Plan Mode: capas 1-2-3 del brief |
| Scaffold | `app.json`, `package.json`, `tsconfig.json`, `jest.config.js`, `app/_layout.tsx` | Fase 0 |
| FSRS | `src/domain/fsrs/{config,scheduler,estado}.ts` + tests | Fase 1 |
| BD | `src/db/{client,repository,tipos,conexionDePrueba}.ts`, `src/db/migrations/*` | Fases 1-2 |
| Fonética | `src/domain/fonetica/{tabla,decodificador}.ts` + test | Fase 2 |
| Sesión | `src/domain/sesion/motor.ts`, `src/stores/sesion.ts` | Fase 2 |
| UI | `src/components/*.tsx`, `app/colgadero/*.tsx`, `app/index.tsx` | Fase 2 |

## Verificado vs. sin verificar

**Verificado (con evidencia real, no solo declarado):**
- Las 3 fases: `tsc --noEmit` limpio, `npm test` en verde (156 tests finales),
  `npx expo export --platform ios` bundlea sin error, `npx expo-doctor` 18/18.
- **Confirmado por el operador en su iPhone real**, no solo server-side: Fase 0
  (pantalla visible), Fase 1 (BD creada y consultada), Fase 2 (sesión de 20
  tarjetas completa en Flash y Reverso, dos veces — antes y después del fix de
  barajado).
- Los tests que dependen de `Math.random()` (barajado) se corrieron 5 veces
  seguidas sin fallos antes de aceptarlos como no-flaky.

**Sin verificar / incompleto — no maquillar esto:**
- `src/components/EstadisticasPalabra.tsx` y `src/db/repository.ts:280`
  (`resumenDeTarjeta`) **existen y compilan, pero no están conectados a ninguna
  pantalla** (grep confirma cero usos fuera de su propia definición) **y
  `resumenDeTarjeta` no tiene test propio**. Cumplen la letra del archivo
  declarado en `PLAN-FASES.md` para la Fase 2, pero no la función real de
  `modulos/02-colgadero.md` §4 ("estadísticas por palabra"). No bloqueaba el
  `done when` de la fase (que es sobre completar una sesión, no sobre
  estadísticas), así que se cerró la fase igual, pero queda como deuda explícita.

## Qué sigue (lo primero que debe hacer la próxima sesión)

1. **Si se sigue con Fase 3:** primero preguntar al operador por P-1 (consonantes
   reservadas de Sota/Reina/Rey) — `agent_docs/seeds/naipes-52.md` §4. Sin esa
   respuesta no se puede validar 12 de las 52 cartas. `/nueva-fase 3` ya incluye
   este paso.
2. **Deuda pendiente, no bloqueante:** conectar `EstadisticasPalabra` a una
   pantalla real (candidato natural: un tap/long-press sobre cada tarjeta en
   `app/colgadero/index.tsx`, o esperar a que exista una vista de detalle) y
   escribirle un test a `resumenDeTarjeta`. Se puede hacer como parte de la Fase
   3 (mismo patrón para naipes) o antes, a discreción del operador.
3. Cambiar el modelo a Sonnet si la sesión arranca en Opus/Plan Mode (§12.3).

## Bloqueos actuales

| Bloqueo | Dueño | Bloquea a |
|---|---|---|
| P-1 · Consonantes reservadas de Sota/Reina/Rey | Operador | **Inicio de la Fase 3** |
| P-2 · Visto bueno a ADR-002 (dirección inversa = misma tarjeta) | Operador | Fase 4 |
| P-3 · ¿Palabra colgadero para el `0` suelto y el trozo `00`? | Operador | Fase 4 |
| P-4 · ¿`expo-notifications` funciona en Expo Go SDK 54? | Agente (spike) | Fase 8 |
| P-5 · Simulador iOS sin runtime (conveniencia, no bloquea) | Operador | Ninguna fase |
| P-6 · Verificar disponibilidad real en App Store antes de subir de SDK | Agente | Cualquier fase que toque SDK |

## Qué debe saber la próxima sesión antes de continuar

- **La app corre en SDK 54, a propósito, no en "la última".** ADR-012 + P-6: antes
  de subir de SDK, verificar contra `apps.apple.com/us/app/expo-go/id982107779`
  que la nueva versión ya está en el App Store — Apple tarda meses en aprobar
  cada build nueva de Expo Go. No repetir el error de asumir "última = usable".
- **`expo-sqlite` no corre bajo Jest.** Cualquier test de repositorio nuevo debe
  usar `crearConexionDePrueba()` (`src/db/conexionDePrueba.ts`, adaptador sobre
  `node:sqlite`), nunca intentar mockear `expo-sqlite` directamente ni asumir que
  correrá en el entorno de test.
- **`armarSesion()` separa selección de presentación** (ADR-015): la selección de
  qué tarjetas entran sigue en orden (vencidas por urgencia, nuevas por número);
  el barajado es un paso aparte, inyectable vía `aleatorizar`, para que los tests
  de orden exacto pasen `(arr) => arr` y no sean flaky. La Fase 3 (Baraja
  Completa) probablemente reusa esta misma función `barajar()`.
- **Callejón ya explorado — no repetir:** intentar correr `npx expo start` en
  segundo plano (background) para que el operador escanee el QR no funciona: sin
  TTY el QR no se renderiza. Siempre pedirle al operador que lo corra en su
  propia terminal.
- **Deuda conocida:** ver "Sin verificar / incompleto" arriba — `EstadisticasPalabra`
  no está conectada a ninguna pantalla.
- **Numeración del brief tiene deriva interna** (ya explicado en la sesión de
  Plan Mode, sigue aplicando): guiarse por contenido, no por número de sección.

## Decisiones que fueron a DECISIONS.md

ADR-011 (versiones verificadas SDK 57), ADR-012 (downgrade a SDK 54), ADR-013
(API real de ts-fsrs/expo-sqlite), ADR-014 (ConexionBD + node:sqlite para tests),
ADR-015 (selección vs. presentación barajada en armarSesion). Pendientes P-1 a
P-6 actualizados con P-1 marcado explícitamente como bloqueante de la Fase 3.
