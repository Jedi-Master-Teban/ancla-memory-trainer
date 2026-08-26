# SESSION_NOTES

**Última sesión:** 2026-08-20 → 2026-08-22 · **Modelo:** Opus (Plan Mode) → implementación
**Estado:** proyecto **detenido a voluntad del operador**. Fases 0-7 cerradas.
Fase 8 **parcial**, sin cumplir su `done when`. Ver ADR-028.

> Si retomas esto meses después: **lee este archivo entero antes de tocar
> código.** `README.md` te cuenta qué es el proyecto; este archivo te cuenta
> dónde quedó exactamente y qué está roto.

---

## 1. Por qué se detuvo

No fue un obstáculo técnico. El operador quería usar la app a diario sin tener
que arrancar `npx expo start` cada vez. Se investigó y solo existen dos caminos
(verificado contra la doc oficial de Apple y de Expo, detalle en ADR-028):

| Camino | Costo | Caducidad |
|---|---|---|
| Apple ID gratis + Xcode + cable | US$0 | **7 días**, luego hay que reinstalar |
| Apple Developer Program | **US$99/año** | 12 meses, instalación por aire |

No existe opción gratuita y permanente. El operador consideró el costo
desproporcionado para una app personal y prefirió parar aquí y explorar
alternativas por su cuenta.

**Nota para el futuro:** la vía gratuita **sí es viable** si no molesta un
ritual semanal de 2 minutos con el cable. Y sea cual sea el camino, un build de
Release **ya empaqueta el JS** — la app corre sin servidor Metro.

---

## 2. Estado por fase

| Fase | Estado | Commit |
|---|---|---|
| 0 — Scaffold | ✅ cerrada, verificada en iPhone | `faa8c1c` |
| 1 — Motor FSRS + esquema | ✅ cerrada, verificada | `99b24b3` |
| 2 — Colgadero | ✅ cerrada, verificada | `603b287` |
| 3 — Naipes | ✅ cerrada, verificada | `f926e6c` |
| 4 — Listas + Números | ✅ cerrada, verificada | `40a63ec` |
| 5 — Racha + Dashboard | ✅ cerrada, verificada | `9b5f86b` |
| 6 — Panel de Retención | ✅ cerrada, verificada con SQL manual real | `d980f76` |
| 7 — Ejercicios Personalizados | ✅ cerrada, verificada | `a76bccf` |
| 8 — Pulido | ⚠️ **PARCIAL** | este commit |

---

## 3. Fase 8 en detalle — qué hay y qué no

### ✅ Construido y con verificación automática (tipos + 369 tests en verde)

- **Tema dual** Arcade Neón / Papel y Tinta, con selector en vivo en Ajustes y
  persistencia en SQLite (migración 006). Los colores salieron de convertir a
  mano los `oklch()` de los mockups, porque **React Native 0.81.5 no los
  parsea** (verificado en dos capas del paquete instalado — ver ADR-026).
- **Selector de tipografía** independiente del tema (migración 007).
- **Íconos SVG** calcados de los mockups (`src/components/iconos.tsx`), con
  `react-native-svg`, que viene incluido en Expo Go — no requiere dev build.
- **Naipes lado a lado**: carta a la izquierda, palabra a la derecha
  (`CartaVisual.tsx`). Reemplazó un volteo 3D que tenía defectos reales.
- **Heatmap a tamaño real** (15 columnas, celda calculada) con tooltip al tocar.
- **Llama SVG animada** que pulsa más rápido cuando la racha está en riesgo.
- **`explicarNaipe()`** — cadena fonética en el reverso de los naipes, con TDD.
- **Conteo por inventario** en el dashboard (`contarElementosPorCategoria`).
- **Identidad "Ancla"**: nombre, ícono y splash en `assets/`.

### ⚠️ Construido pero SIN PROBAR EN DISPOSITIVO

**Todo lo de arriba.** Nada de esta sesión se corrió en el iPhone. El proyecto
exige verificación en Expo Go para cerrar una fase, y no se hizo.

### ❌ Sin construir

- **Notificaciones.** `src/notificaciones/racha.ts` **no existe**. Es el
  `done when` de la fase. `expo-notifications@0.32.17` está instalado y sus
  firmas fueron leídas, pero **la prueba en dispositivo nunca se corrió**, así
  que **P-4 sigue abierto**: no se sabe si las notificaciones locales funcionan
  en Expo Go SDK 54.
- **Barrido de tema en 24 archivos** que aún tienen color hardcodeado:
  todo Colgadero, Listas, Números, Estadísticas, y varios componentes
  (`Flashcard`, `EditorLista`, `EditorNaipe`, `FormularioGenerico`,
  `TarjetasProblematicas`, `TemporizadorEstudio`, `EstadisticasPalabra`).
  Localízalos con: `grep -rlE "#[0-9a-fA-F]{6}" app/ src/components/`

### 🐞 Bug abierto — el más importante para quien retome

**Los botones "Bien" y "Fácil" no aparecen** al revelar en Fonética Flash y en
Reverso. Reportado por el operador en dispositivo; en Velocidad **no** aplica
(esa pantalla tiene 2 botones por diseño del brief §8.2, no es un defecto).

Lo que se sabe:
- El análisis estático dice que los 4 caben y deberían pintarse (79.75 pt cada
  uno en 375 pt, sin recortes ni solapamientos). **El dispositivo dice que no.**
  Manda el dispositivo.
- Es muy probablemente una **regresión de esta sesión**:
  `BotonesCalificacion.tsx` se reescribió (recetas por tema + `fontFamily`).
  Antes eran 4 `Pressable` planos que funcionaron durante varias fases.
- Se aplicó una medida de robustez **sin confirmar que sea la causa**: ya no se
  combina `fontWeight` con una familia que lleva el peso en el nombre
  (`Fredoka_600SemiBold`), un fallo conocido de resolución de fuentes en iOS que
  puede dejar texto sin pintar.

**Diagnóstico más rápido:** en Ajustes, cambiar Tipografía a **"La del
sistema"**. Si con eso aparecen los botones, la causa es la fuente. Si no,
poner un `backgroundColor` de depuración en `estilos.fila` de
`BotonesCalificacion.tsx` para ver si la fila desborda horizontalmente.

**Comprobar también Colgadero** — usa el mismo componente y probablemente tiene
el mismo problema sin que nadie lo haya notado.

---

## 4. Trampas ya conocidas (no volver a caer)

- **`useFocusEffect`, no `useEffect`.** El Stack no desmonta pantallas al volver
  atrás. Cualquier pantalla que cargue datos y pueda revisitarse debe usar
  `useFocusEffect`, o mostrará datos obsoletos para siempre. Este bug apareció
  en 4 archivos distintos en fases distintas.
- **`expo-sqlite` no corre bajo Jest.** Los tests usan `crearConexionDePrueba()`
  (`src/db/conexionDePrueba.ts`, adaptador sobre `node:sqlite`). Nunca mockear
  `expo-sqlite` directamente (ADR-014).
- **Las migraciones nunca se re-ejecutan.** Si editas datos semilla después de
  que un dispositivo ya sembró, ese dispositivo se queda desactualizado para
  siempre. Se corrige a mano con el editor de la app.
- **No hay ESLint en el proyecto.** Los comentarios
  `// eslint-disable-next-line` que hay repartidos son **decorativos**, nada los
  aplica. Instalar `eslint-config-expo` habría atrapado la violación de Reglas
  de Hooks que sí ocurrió en `CartaVisual.tsx`.
- **SDK 54 a propósito, no "la última".** Antes de subir de SDK, verificar que
  Expo Go de esa versión ya esté en el App Store (ADR-012, P-6).
- **El archivo de BD se llama `memory-trainer.db`** aunque la app se llame
  Ancla. Renombrarlo dejaría huérfanos todos los datos del operador.

---

## 5. Lo primero que debe hacer la próxima sesión

1. Correr `npx expo start`, abrir en el iPhone, y **verificar el trabajo visual
   de la Fase 8** — nada de esto se probó.
2. Atacar el bug de los botones con el diagnóstico de §3.
3. Decidir si se resuelve P-4 (spike de notificaciones) o si se implementa el
   fallback in-app que el propio `PLAN-FASES.md` §Fase 8 ya contempla.
4. Si se quiere terminar el pulido: barrer los 24 archivos con color
   hardcodeado, siguiendo el patrón de `app/index.tsx` (tokens vía `useTema()`,
   override por array de estilos).

## 6. Pendientes abiertos

| Pendiente | Dueño | Bloquea |
|---|---|---|
| P-4 · ¿`expo-notifications` dispara notificaciones locales en Expo Go SDK 54? | Agente (spike) | El `done when` de la Fase 8 |
| P-5 · Simulador de iOS sin runtime descargado | Operador | Nada (solo conveniencia) |
| P-6 · Verificar disponibilidad en App Store antes de subir de SDK | Agente | Cualquier cambio de SDK |
| Bug de botones "Bien"/"Fácil" | Agente | Usar la app con normalidad |
| Distribución sin Expo Go | Operador | Uso diario sin servidor |
