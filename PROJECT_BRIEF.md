## 1. IDENTIDAD DEL PROYECTO (Prompt Contract — Capa 1)

**Objetivo exacto:** construir una app iOS personal, sin fines comerciales, que sistematice la práctica diaria de las técnicas de memoria del libro *"Cómo adquirir una supermemoria"* de Harry Lorayne (Sistema de la Cadena, Alfabeto Fonético, Sistema del Colgadero, naipes), con seguimiento de retención por repetición espaciada FSRS y un sistema de racha estilo Duolingo.

**Entradas que Claude Code recibirá:** este documento (`PROJECT_BRIEF.md`), la lista de 100 palabras colgadero del usuario (Sección 4.3, ya validada fonéticamente), y las decisiones de arquitectura tomadas durante Plan Mode.

**Salida esperada al final del proyecto:** una app Expo funcional en el iPhone del usuario vía Expo Go, cubriendo los 9 módulos de la Sección 5, con datos 100% locales.

**Restricciones no negociables (repetidas al final de esta sección por sesgo de recencia — el modelo pesa más las instrucciones cercanas al final del prompt):**
- Cero backend, cero autenticación, cero sincronización en la nube, cero SDKs de terceros/analítica/publicidad.
- Cero intención de publicación en App Store — solo Expo Go para desarrollo y uso personal.
- Nunca generar código de la aplicación durante Plan Mode.
- Nunca expandir `CLAUDE.md` más allá de 200 líneas.
- **Repetición final: no backend, no autenticación, no nube, no código en modo Plan.**

***

## 2. ARQUITECTURA DE TRES CAPAS PARA GOBERNAR A CLAUDE CODE

Este proyecto usa la arquitectura de gobierno recomendada para Claude Code en 2026: `CLAUDE.md` (verdad del proyecto, siempre cargado), **Skills** (procedimientos modulares, cargados solo cuando se necesitan) y **Custom Commands** (flujos de trabajo repetibles). Esto existe para minimizar consumo de tokens: cada línea de `CLAUDE.md` cuesta contexto en *cada* turno de *cada* sesión, mientras que una Skill solo carga su cuerpo completo cuando el agente decide invocarla.

### 2.1 Capa 1 — `CLAUDE.md` (raíz del proyecto, ≤200 líneas)
Debe contener únicamente:
- Descripción de una línea del proyecto.
- Stack técnico (tabla de la Sección 6).
- Comandos exactos de arranque (`npx expo start`, `npm test`, etc.).
- Arquitectura de carpetas (máximo 5 directorios de primer nivel).
- Las 2 a 4 convenciones de código más importantes (ej. "todo acceso a SQLite pasa por `db/repository.ts`, nunca queries sueltas").
- Lista "NUNCA HACER" (ver Sección 3).
- Punteros por ruta a `agent_docs/` y `.claude/skills/` — nunca pegar su contenido aquí.

### 2.2 Capa 2 — Skills (`.claude/skills/<nombre>/SKILL.md`, ≤500 líneas cada una)
Crear una Skill por cada procedimiento que se repetirá muchas veces durante el desarrollo, con frontmatter YAML de `name` y `description` (el trigger que decide cuándo el agente la carga automáticamente):

- **`.claude/skills/nueva-fase/SKILL.md`**: procedimiento fijo para iniciar cualquier fase de la Sección 9 — leer plan, listar archivos a tocar, escribir tests primero, implementar, correr tests, commit.
- **`.claude/skills/fsrs-review/SKILL.md`**: procedimiento para tocar cualquier lógica del motor de repetición espaciada, incluyendo qué invariantes de FSRS nunca deben romperse (ver 5.1).
- **`.claude/skills/verificacion/SKILL.md`**: checklist de verificación obligatoria antes de marcar cualquier tarea como terminada (ver Sección 4.2).

Cada `SKILL.md` debe seguir el patrón de fases con criterios de salida verificables ("exit criteria"), no solo instrucciones sueltas — si un paso no aplica, el agente debe documentarlo explícitamente como N/A con justificación, nunca omitirlo en silencio.

### 2.3 Capa 3 — Custom Commands (`.claude/commands/`)
Definir al menos:
- `/nueva-fase [N]`: dispara el flujo completo de la Skill `nueva-fase` para la fase N del plan.
- `/verificar`: corre la checklist de verificación de la Sección 4.2 sobre el estado actual del código.
- `/cerrar-sesion`: ejecuta el ritual de handoff de la Sección 8.4 y escribe `SESSION_NOTES.md`.

***

## 3. LISTA "NUNCA HACER" (constraints duras — van en `CLAUDE.md` tal cual, en positivo cuando sea posible)

Los modelos procesan mejor reglas afirmativas que negaciones ("nunca"); por eso cada restricción dura se acompaña de su versión afirmativa:

| Restricción (negativa) | Regla afirmativa equivalente |
|---|---|
| Nunca agregar backend, auth o sync en la nube | Todo el almacenamiento vive en `expo-sqlite`, local al dispositivo |
| Nunca usar Redux | Usar Zustand o Context API nativo para todo el estado |
| Nunca generar código en Plan Mode | En Plan Mode, la única salida son archivos `.md` |
| Nunca superar 200 líneas en `CLAUDE.md` | Todo detalle extra va en `agent_docs/` o `.claude/skills/` |
| Nunca implementar Palacio de la Memoria o PAO todavía | Solo dejar el modelo de datos de la Sección 6 extensible para ellos |
| Nunca marcar una fase como terminada sin correr la app en Expo Go | Cada fase cierra con verificación manual + commit |
| Nunca escribir queries SQL sueltas fuera de la capa de repositorio | Todo acceso a datos pasa por `db/repository.ts` |

Estas reglas deben citarse **al final** del `CLAUDE.md`, no solo al principio, porque los tokens más cercanos al punto de generación ejercen mayor influencia sobre el comportamiento inmediato del modelo.

***

## 4. PROTOCOLO ANTI-ALUCINACIÓN Y VERIFICACIÓN (crítico para este proyecto)

Esta sección existe porque un asistente de código que "alucina" — inventa que una librería existe, asume una API que no verificó, o marca una tarea como completa sin probarla — es el riesgo más caro en un proyecto de este tamaño. Se adoptan las técnicas oficiales de reducción de alucinaciones de Anthropic, adaptadas a un flujo de codificación:

### 4.1 Reglas de admisión de incertidumbre
- Dar permiso explícito a Claude Code para decir "no estoy seguro de que esta API de Expo funcione así" en vez de inventar una firma de función. Esto reduce drásticamente la información falsa.
- Ante cualquier duda sobre una API de una librería (`expo-sqlite`, `ts-fsrs`, `expo-notifications`), Claude Code debe **verificar contra la documentación oficial o el código fuente del paquete instalado** antes de escribir código que la use — nunca asumir la firma de una función por similitud con otra librería conocida.
- Restricción de conocimiento externo: para cuestiones de la app, usar solo lo especificado en este brief y en `agent_docs/`; no inventar requisitos que no están aquí.

### 4.2 Checklist de verificación obligatoria (Skill `verificacion`, se corre antes de cada commit)
1. ¿El código compila sin errores de TypeScript?
2. ¿Corre en Expo Go sin crashear al abrir la pantalla afectada?
3. ¿Existen tests de Jest para la lógica nueva (especialmente cálculos de FSRS)? ¿Pasan?
4. ¿Se tocó algún archivo fuera del alcance declarado para esta tarea? Si sí, reportarlo explícitamente, no ocultarlo.
5. ¿La funcionalidad nueva respeta el modelo de datos de la Sección 6 sin romper datos existentes (migraciones no destructivas)?
6. Si la tarea se marca como "hecha", debe ir acompañada de la evidencia concreta (output de test, captura de pantalla textual, comando ejecutado) — nunca una declaración de éxito sin evidencia adjunta.

### 4.3 Cadena de verificación con citas internas
Para cualquier afirmación sobre el estado del proyecto que Claude Code haga en su respuesta al usuario ("ya implementé X", "el módulo Y está listo"), debe poder señalar el archivo y la línea exacta que lo prueba. Si no puede señalarlo, debe retractar la afirmación en vez de mantenerla.

### 4.4 Test-Driven cuando aplique
Para toda la lógica de negocio no trivial (especialmente el motor FSRS de la Sección 5.1 y el algoritmo de decodificación fonética de la Sección 4.2 del dominio), escribir primero el test que describe el comportamiento esperado, luego el código que lo satisface, luego correrlo y confirmar que pasa. Esto ancla al modelo a un criterio de éxito objetivo en vez de a su propia declaración subjetiva de que "debería funcionar".

***

## 5. GESTIÓN DE CONTEXTO Y MEMORIA DURANTE EL DESARROLLO (crítico dado el uso de Opus + Sonnet)

Claude Code no tiene memoria persistente real entre sesiones — solo tiene una ventana de contexto que se llena y se resetea. Esta sección define cómo evitar que el proyecto "olvide" decisiones ya tomadas o repita trabajo.

### 5.1 Umbral de intervención proactiva
- Intervenir a **60% de utilización del contexto**, no esperar al 80-90% donde ya empieza la degradación silenciosa de calidad (el modelo empieza a olvidar instrucciones tempranas y a repetir sugerencias ya rechazadas).
- Correr `/compact` cada 25–30 minutos de trabajo activo o al completar cada subtarea, lo que ocurra primero — no esperar a que Claude Code fuerce la compactación automáticamente.
- Ver el porcentaje de contexto en la barra de estado antes de iniciar cada tarea nueva; si es una tarea multi-archivo y el contexto ya supera 60%, compactar primero.

### 5.2 Memoria persistida en el sistema de archivos (la única memoria real)
Tres niveles de persistencia, del más volátil al más permanente:

1. **`SESSION_NOTES.md`** (se sobrescribe cada sesión): qué se hizo, qué archivos se tocaron y por qué, qué sigue, qué decisiones o restricciones debe conocer la próxima sesión.
2. **`agent_docs/DECISIONS.md`** (acumulativo, nunca se borra): registro de decisiones de arquitectura irreversibles (ej. "se eligió `ts-fsrs` sobre implementación propia el [fecha], razón: X").
3. **`CLAUDE.md`** (la única memoria que se carga automáticamente en cada sesión nueva sin que se le pida): reglas permanentes, no bitácora de progreso.

### 5.3 Ritual de recuperación si Claude Code "se confunde"
Si Claude Code contradice una decisión ya tomada o parece perdido, el operador debe ejecutar: *"Vuelve a leer CLAUDE.md y SESSION_NOTES.md completos. Resume el estado actual del proyecto antes de continuar."* — esto re-ancla el modelo sin gastar los tokens de reconstruir todo el razonamiento desde cero.

### 5.4 Uso de subagentes para tareas que ensuciarían el contexto principal
Cuando una tarea requiera explorar mucho código o investigar una librería externa sin que ese ruido quede en la conversación principal, delegar a un subagente con alcance estrictamente acotado:

- El subagente recibe: la tarea exacta, los archivos o carpetas a los que tiene permiso de acceso, las restricciones (ej. "no instalar dependencias nuevas"), y el formato de salida esperado (resumen markdown, nunca el volcado completo de lo que leyó).
- Ejemplo de uso correcto: *"Lanza un subagente de solo lectura que investigue cómo `expo-notifications` maneja permisos en iOS y devuelva un resumen de 10 líneas con la API exacta a usar — no debe modificar ningún archivo."*
- Nunca lanzar subagentes con tareas que dependen secuencialmente unas de otras si se busca ahorrar tokens; los subagentes paralelos solo valen la pena cuando las tareas son genuinamente independientes.

***

## 6. STACK TÉCNICO OBLIGATORIO

| Capa | Tecnología | Razón |
|---|---|---|
| Framework | **Expo (SDK más reciente estable) + React Native** | Corre directamente en Expo Go sin build nativo ni cuenta de desarrollador de Apple. |
| Lenguaje | **TypeScript** | Tipado fuerte reduce errores en modelos de datos de tarjetas, palacios y sesiones. |
| Almacenamiento local | **expo-sqlite** | Base de datos SQL persistente entre reinicios, funciona dentro de Expo Go sin módulos nativos adicionales. |
| Repetición espaciada | **FSRS vía `ts-fsrs`** | Algoritmo de repetición espaciada más preciso disponible hoy, corre 100% local. |
| Navegación | **expo-router** (file-based) | Estándar recomendado por Expo para apps nuevas. |
| Notificaciones locales | **expo-notifications** | Recordatorios de racha y revisión, sin servidor push. |
| Estado | **Zustand o Context API** | Evitar Redux; complejidad innecesaria en proyecto de un solo usuario. |
| Testing | **Jest** | Cubrir la lógica de FSRS y decodificación fonética (Sección 4.2 del dominio). |

**Nota sobre RAM/memoria del dispositivo:** el iPhone 17 Pro Max tiene recursos de sobra; el cuello de botella real es el consumo de tokens de Claude Code, no el hardware. Todas las decisiones de arquitectura deben optimizar simplicidad de código, no rendimiento del dispositivo. Evitar librerías pesadas de animación (Reanimated complejo, Skia) salvo necesidad estricta.

***

## 7. FUNDAMENTOS DE MEMORIA QUE LA APP DEBE MODELAR (dominio)

### 7.1 Sistema de la Cadena
Asociación consecutiva: cada objeto de una lista se enlaza con el siguiente mediante una imagen absurda, exagerada y en movimiento.

### 7.2 Alfabeto Fonético (base del Colgadero)

| Dígito | Sonido(s) | Regla mnemónica |
|---|---|---|
| 1 | T, D | La T tiene un palo vertical |
| 2 | N, Ñ | La N tiene dos palos |
| 3 | M | La M tiene tres palos |
| 4 | C(ca,co,cu), K, Q | C es inicial de "cuatro" |
| 5 | L, LL | L es cifra romana de 50 |
| 6 | S, Z, C(ce,ci) | S es inicial y final de "seis" |
| 7 | F, J, G(ge,gi) | F invertida se parece a un 7 |
| 8 | Ch, G(ga,go,gu) | Ch tiene la forma cerrada del 8 |
| 9 | V, B, P | P invertida se parece a un 9 |
| 0 | R, RR | El cero es redondo como una rueda |

Vocales y H, W, X, Y no tienen valor numérico. **Esta tabla debe estar codificada en `agent_docs/decodificacion-fonetica.md`** junto con la función de validación fonética, porque Claude Code la necesitará para implementar el generador de ejercicios (5.2) y el decodificador automático de números (5.5) sin inventar reglas por su cuenta.

### 7.3 Lista personal de 100 palabras colgadero (dato semilla)

```
1-Tea, 2-Noé, 3-Amo, 4-Oca, 5-Ley, 6-Oso, 7-Fea, 8-Hucha, 9-Ave, 10-Torre,
11-Teta, 12-Tina, 13-Tomo, 14-Taco, 15-Tela, 16-Tez, 17-Tufo, 18-Techo, 19-Tubo, 20-Nuera,
21-Nido, 22-Niño, 23-Nomo, 24-Eunuco, 25-Nilo, 26-Nuez, 27-Naife, 28-Noche, 29-Nube, 30-Mar,
31-Mito, 32-Mono, 33-Mamá, 34-Meca, 35-Miel, 36-Mesa, 37-Mofa, 38-Mecha, 39-Mapa, 40-Corro,
41-Codo, 42-Cuna, 43-Cama, 44-Coco, 45-Cola, 46-Cazo, 47-Café, 48-Coche, 49-Cubo, 50-Lira,
51-Loto, 52-Luna, 53-Lima, 54-Loco, 55-Lulú, 56-Lazo, 57-Lofio, 58-Lucha, 59-Lupa, 60-Suero,
61-Sota, 62-Zona, 63-Sima, 64-Saco, 65-Sol, 66-Seso, 67-Sofá, 68-Acecho, 69-Sapo, 70-Faro,
71-Foto, 72-Fauna, 73-Fama, 74-Foca, 75-Fiel, 76-Fosa, 77-Fofo, 78-Ficha, 79-Fobia, 80-Chorro,
81-Choto, 82-Chino, 83-Chama, 84-Cheque, 85-Chal, 86-Choza, 87-Chafa, 88-Chacha, 89-Chapa, 90-Burra,
91-Pito, 92-Pino, 93-Puma, 94-Vaca, 95-Bala, 96-Buzo, 97-Befo, 98-Bache, 99-Pipa, 100-Torero
```

### 7.4 Sistema del Colgadero para naipes (52 cartas)
Cada carta recibe una imagen construida con la misma lógica fonética: la primera consonante indica el palo, el resto codifica el valor. La app debe permitir definir/editar las 52 imágenes (dato semilla editable) y practicarlas como categoría independiente.

### 7.5 Método de Palabras Clave (textos, discursos, listas de conceptos)
Extraer una palabra evocadora por idea/párrafo, encadenarla con el Sistema de la Cadena.

### 7.6 Extensibilidad futura (no implementar aún, solo dejar espacio en el modelo de datos)
Palacio de la Memoria / Método de Loci, y Sistema PAO (Persona-Acción-Objeto). Ver Sección 8.

***

## 8. MÓDULOS FUNCIONALES DE LA APP

### 8.1 Motor de Repetición Espaciada (núcleo transversal)
Cada elemento memorizable es una **tarjeta** con estado FSRS propio: dificultad, estabilidad, retrievability, próxima fecha de repaso. Calificación en 4 niveles (Otra vez / Difícil / Bien / Fácil). El agente **nunca debe reimplementar el algoritmo FSRS a mano** sin verificar contra la librería `ts-fsrs` o su documentación oficial — este es el punto de mayor riesgo de alucinación numérica del proyecto.

### 8.2 Práctica de las 100 Palabras Colgadero
Modo Fonética Flash (número → palabra), Modo Reverso (palabra → número), Modo Velocidad (cronometrado, serie de 10–20). Estadísticas por palabra: veces revisada, tasa de aciertos, próxima fecha.

### 8.3 Práctica de Naipes (52 cartas)
Mismos 3 modos que 8.2, más Modo Baraja Completa (52 cartas en orden aleatorio, reproducción de memoria con tiempo y precisión medidos).

### 8.4 Práctica de Listas de Objetos (Sistema de la Cadena)
CRUD de listas personalizadas. Modo de estudio: mostrar T segundos configurables → reproducir en orden y orden inverso. Decisión de diseño a resolver en Plan Mode: ¿una tarjeta FSRS por lista completa, o una por par consecutivo de objetos?

### 8.5 Práctica de Números Importantes
Guardar números con etiqueta (fechas, claves, cédulas). Descomposición fonética automática mostrando las palabras colgadero correspondientes. Modo de repaso: etiqueta → número, calificado en FSRS.

### 8.6 Creación de Ejercicios Personalizados (extensibilidad)
Formulario CRUD genérico para añadir/editar/eliminar ítems en cualquier categoría existente, sin tocar código. Modelo de datos preparado para agregar Palacio de Loci y PAO sin migración destructiva.

### 8.7 Sistema de Racha (estilo Duolingo)
Contador de días consecutivos, meta diaria configurable, **congelador de racha manual** (mecanismo que casi duplica la duración promedio de rachas activas frente a no tenerlo), indicador de racha "en riesgo" con notificación local nocturna, vista de calendario/heatmap de ~90 días. Nunca penalizar duramente por fallar una tarjeta — el progreso de sesión debe seguir sintiéndose hacia adelante.

### 8.8 Panel de Evaluación de Retención
Estadísticas por categoría: % retención, tarjetas nuevas/aprendiendo/maduras/en riesgo. Historial de sesiones. Vista de "tarjetas problemáticas" (consistentemente olvidadas).

### 8.9 Dashboard principal
Racha actual, meta diaria, tarjetas pendientes por categoría, botón único "Practicar ahora" que arma sesión mixta priorizada según FSRS.

***

## 9. MODELO DE DATOS (borrador orientativo, a refinar en Plan Mode — no copiar literalmente)

```
Tarjeta {
  id, categoria (enum: colgadero | naipe | lista_item | numero | palabra_clave | [futuro: loci | pao]),
  contenido_frente, contenido_reverso,
  fsrs_dificultad, fsrs_estabilidad, fsrs_retrievability,
  fecha_ultima_revision, fecha_proxima_revision,
  estado (nueva | aprendiendo | madura | en_riesgo),
  metadata_categoria (JSON flexible por tipo)
}

Mazo { id, nombre, categoria, tarjetas[], fecha_creacion }

SesionEstudio { id, fecha, duracion_segundos, tarjetas_revisadas[], aciertos, fallos }

Racha { dias_consecutivos, fecha_ultima_practica, congeladores_disponibles, historial_calendario[] }
```

***

## 10. PRINCIPIOS DE DISEÑO VISUAL Y EXPERIENCIA

- Idioma: español (Colombia) en toda la interfaz.
- Estética simple y funcional — prioriza claridad sobre pulido visual innecesario.
- Sesiones diseñadas para completarse en 10–20 minutos.
- Flashcard: pausa deliberada para visualización mental antes de revelar el reverso (fuerza recuerdo activo).
- Indicador de racha con animación simple (llama que cambia de intensidad si está en riesgo avanzada la noche).
- Modo oscuro por defecto (uso probable nocturno).

***

## 11. FASES DE IMPLEMENTACIÓN (cada una con criterio de "hecho" verificable, no solo descripción de tarea)

| Fase | Contenido | Done when (criterio verificable) |
|---|---|---|
| 0 — Scaffold | Proyecto Expo + TS + expo-router | Corre en Expo Go mostrando pantalla en blanco sin errores en consola |
| 1 — Motor FSRS + esquema | `ts-fsrs` integrado, SQLite, CRUD de tarjetas/mazos | Tests de Jest pasan sobre 5 escenarios de cálculo FSRS documentados en `agent_docs/` |
| 2 — Colgadero | Seed de 100 palabras, 3 modos de práctica (8.2) | Se completa una sesión real de 20 tarjetas en el dispositivo sin crash |
| 3 — Naipes | 52 cartas, mismo patrón + Modo Baraja Completa | Se mide y muestra tiempo+precisión de una baraja completa |
| 4 — Listas y números | CRUD + modos de práctica (8.4, 8.5) | Se crea, estudia y repasa una lista personalizada real de punta a punta |
| 5 — Racha y Dashboard | Racha, congelador, sesión mixta priorizada (8.7, 8.9) | La racha persiste correctamente tras cerrar y reabrir la app dos días distintos |
| 6 — Panel de retención | Estadísticas e historial (8.8) | Los números de retención mostrados coinciden con los datos crudos de SQLite (verificado con query manual) |
| 7 — Ejercicios personalizados | CRUD genérico por categoría (8.6) | Se agrega un ítem nuevo sin tocar código y aparece en la próxima sesión de repaso |
| 8 — Pulido | Notificaciones, modo oscuro, animaciones | Notificación local de racha en riesgo se dispara correctamente en un test manual |

Cada fase cierra con: tests pasando, commit de git, y verificación manual real en el iPhone vía Expo Go — nunca avanzar a la siguiente fase con la anterior en estado dudoso.

***

## 12. PROTOCOLO DE SESIÓN CON CLAUDE CODE

1. **Explore:** Claude Code (Opus, Plan Mode) lee este brief y pregunta lo que necesite antes de planear — nunca debe rellenar ambigüedades con suposiciones silenciosas.
2. **Plan:** Opus produce `CLAUDE.md`, Skills, `agent_docs/` y el plan de fases de la Sección 11. El operador lo revisa como PR.
3. **Implement:** Sonnet ejecuta fase por fase, sin saltarse el orden, aplicando la Skill `nueva-fase` en cada una.
4. **Verify:** antes de cualquier commit, correr la checklist de la Sección 4.2 vía `/verificar`.
5. **Compact:** proactivamente cada 25–30 min o al completar una subtarea (Sección 5.1) — nunca esperar al límite duro.
6. **Handoff:** al cerrar cualquier sesión (aunque la fase no esté terminada), ejecutar `/cerrar-sesion` y producir `SESSION_NOTES.md` con: qué se hizo, qué archivos se tocaron y por qué, qué falta, bloqueos actuales, y qué debe saber la próxima sesión antes de continuar.
7. Si en cualquier punto la realidad diverge del plan (ej. una librería no funciona en Expo Go), volver a Plan Mode antes de seguir improvisando — nunca parchear silenciosamente una decisión de arquitectura ya aprobada.

***

## 13. RESUMEN DE RESTRICCIONES (repetición final por sesgo de recencia)

No backend. No autenticación. No nube. No analítica de terceros. No Redux. No código en Plan Mode. No superar 200 líneas en `CLAUDE.md`. No Palacio de Loci ni PAO todavía — solo el modelo de datos preparado. No marcar nada como "hecho" sin evidencia verificable adjunta. No dejar que el contexto supere 60% sin compactar. No cerrar una sesión sin `SESSION_NOTES.md`.