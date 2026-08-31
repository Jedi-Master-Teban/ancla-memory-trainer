# Ancla — Gamificación y Ciencia de la Memoria

**Fecha:** 2026-08-31
**Propósito:** Justificar las decisiones de diseño UI/UX del rediseño de Ancla
**Fuentes citadas:** Roediger & Karpicke (2006), Ebbinghaus (1885), Skinner (1953), Yu-kai Chou Octalysis (2015), Duolingo public reports, Anki SM-2 algorithm.

---

## 1. Por qué la gamificación importa (pero hay que tener cuidado)

### Lo que funciona (evidencia)

**A. Racha / streak como compromiso conductual**
- Duolingo reporta que usuarios con racha > 7 días tienen 3.6× más probabilidad de retención a 30 días (Young Urban Project, 2025).
- El mecanismo NO es la racha en sí, es el **loss aversion**: perder la racha duele más que ganarla (Kahneman & Tversky, prospect theory).
- **Implicación para Ancla:** El StreakPill debe ser prominente, pero el costo emocional de perderla es lo que sostiene el hábito. Por eso cada vez que se cruza un umbral (7, 30, 100), el color del marco cambia — es un "shield" visual que el usuario no quiere perder.

**B. Variable rewards (recompensas variables)**
- Skinner (1953): las recompensas intermitentes generan más repetición de conducta que las fijas.
- Duolingo usa chests con recompensas aleatorias, lingots diarios, league placement sorpresa.
- **Implicación para Ancla:** Los insights contextuales ("⚠ Colgadero bajó a 62%") son recompensas variables de información — el usuario no sabe cuándo van a aparecer ni qué van a decir. Mantenerlos visibles pero no predictibles.

**C. Progreso visible (progress principle)**
- Amabile & Kramer (2011): documentar el progreso, incluso pequeño, aumenta la motivación intrínseca.
- **Implicación para Ancla:** El radar chart + line chart de XP NO son solo stats — son **pruebas de progreso**. Por eso deben ser la pantalla principal (Stats tab), no enterradas.

### Lo que falla (anti-patrones a evitar)

**D. Métricas de vanidad sin acción**
- Mostrar "nivel 47" sin decir qué hacer a continuación es vacío. Anki y Duolingo lo evitan dando siempre la próxima acción ("3 tarjetas listas para repaso").
- **Implicación:** Los insights deben incluir una CTA: "N tarjetas bastan para recuperarlo" — número concreto, accionable.

**E. Gamificación coercitiva (dark patterns)**
- Streaks con notificaciones push invasivas, "te quedaste a X XP de tu meta, vuelve mañana", FOMO manufactured.
- Duolingo fue criticada por esto en 2024 (The Guardian).
- **Implicación para Ancla:** El usuario debe poder configurar la meta diaria, silenciar notificaciones, y la racha debe ser **ganada** no **forzada**. Por eso la meta es configurable en Ajustes.

---

## 2. Ciencia de la memoria (lo que sustenta el flow Repasar/Editar)

### A. Testing Effect (Roediger & Karpicke, 2006)
- Tomar un test de memoria (recuperar activamente) mejora la retención **mucho más** que re-estudiar pasivamente.
- "Retrieval practice" produce ~50% más retención después de 1 semana vs releer.
- **Implicación para Ancla:**
  - **El modo Repasar ES la app** — es donde ocurre el aprendizaje.
  - **El modo Editar es meta-utility** — no debe contaminar el contexto del repaso.
  - **Por eso van separados** (Fase 3 del plan): cuando estás editando palabras, tu cerebro está en "modo organización"; cuando repasas, en "modo retrieval". Mezclar ambos contextos baja la efectividad del testing effect.

### B. Spaced Repetition (Ebbinghaus, 1885 / SM-2 de Anki)
- La curva del olvido es exponencial: revisando en intervalos crecientes se optimiza el tiempo de estudio.
- Anki usa SM-2: cada tarjeta tiene un "easiness factor" que crece con respuestas correctas.
- **Implicación:** Ancla NO implementa spaced repetition todavía (es un módulo futuro). PERO el flujo Repasar puede sentar las bases: cuando entremos a Fase 8+ con SR, el modo "Repaso libre" (mix adaptativo) será el que use SM-2.

### C. Dual Coding (Paivio, 1971)
- La memoria es más fuerte cuando se combina información verbal + visual.
- El método "colgadero" (número → palabra fonética) ya explota esto: el número es abstracto, la palabra es concreta y memorable.
- **Implicación:** El preview de descomposición (Entero: 3→Amo / Decimal: 14→Toro) muestra TANTO el número como la palabra, reforzando la asociación. **Esta es la razón del éxito del método fonético**, no debería diluirse.

### D. Desirable Difficulty (Bjork & Bjork, 1994)
- El aprendizaje óptimo requiere esfuerzo. Lo "fácil" se olvida; lo "moderadamente difícil" se retiene.
- **Implicación:** Ancla NO debe reducir la fricción del repaso (ej: auto-revelar la respuesta). El usuario debe tipear la palabra, no elegir de un menú. Si lo hacemos fácil, rompemos el aprendizaje.

---

## 3. Visualización de datos para aprendizaje

### Por qué radar chart para retención

**Stephen Few (Information Dashboard Design):** Para comparar performance entre 4-6 categorías con la misma métrica (%), el radar chart es la mejor opción cuando hay < 8 dimensiones. Más de 8 → bar chart.

- 4 categorías en Ancla = rango ideal para radar.
- Permite ver de un vistazo: "Colgadero es mi agujero, Naipes estoy bien, Números es mi fuerte, Listas necesita repaso".
- **NO usar pie chart** — los humanos percibimos ángulos peor que áreas/longitudes.
- **NO usar bar chart agrupado** — pierde la "forma" mental del conjunto.

### Por qué line chart para XP

**Cole Knaflic (Storytelling with Data):** Para mostrar cambio temporal de una sola métrica, line chart es óptimo.

- 14 días de XP = ver tendencia, identificar días fuertes/débiles.
- El área bajo la línea refuerza la magnitud acumulada.
- La línea meta punteada (20 XP) da contexto inmediato de cumplimiento.
- Selector Día/Semana/Mes/Todo permite drill-down.

### Por qué insights rule-based (no ML)

- Explicable: el usuario puede entender POR QUÉ aparece cada mensaje.
- Testeable: cada regla es un test unitario.
- Privado: no enviamos datos a APIs externas.
- Honesto: el sistema no inventa patrones que no existen.

### Mensajes — diseño de tono

**Referencias:** Duolingo (motivacional, a veces burlón), Calm (gentle), Apple Fitness (achievement-based).

**Tono Ancla:** Directo, motivador sin condescendencia. 1-2 frases. Siempre accionable.

| ❌ Mal | ✅ Bien |
|---|---|
| "¡Lo estás haciendo genial! Sigue así" | "Colgadero: 62%. 5 tarjetas para volver al 80%." |
| "Tu racha es increíble" | "Llevas 7 días. Hoy te faltan 12 XP para llegar a 30." |
| "XP ganado esta semana: 187" | "+23% vs semana anterior. Tu mejor día: martes (45 XP)." |

---

## 4. Síntesis — decisiones UX justificadas

| Decisión | Principio |
|---|---|
| Separar Repasar de Editar | Testing Effect + contexto cognitivo |
| StreakPill prominente en todas las pantallas | Loss aversion + Progress principle |
| Color del StreakPill cambia en umbrales | Achievements + tangible shield |
| Meta diaria configurable (no hardcoded) | Evitar dark patterns |
| FAB polimórfico contextual | Reducir fricción sin eliminar agency |
| Tab bar liquid glass con tabs claras | Information scent — el usuario sabe dónde está |
| Radar + line chart como vista Stats | Visualización óptima para 4-cat + serie temporal |
| Insights rule-based con CTA numérica | Actionable data + anti-vanity metrics |
| Odómetro animado al ganar racha | Variable reward + micro-celebration |
| Tipografía real (Inter/Newsreader/IBM Plex Mono) | Legibilidad + jerarquía visual clara |
| Pull-to-refresh con haptic | Confirmación de agencia del usuario |

---

## 5. Lo que NO vamos a hacer (por evidencia)

- **No añadir mascota** (descartado por memoria de Esteban): el testing effect requiere foco, no apego emocional al personaje.
- **No añadir gemas/coins como moneda virtual** (descartado por memoria): external rewards socavan la motivación intrínseca (Deci & Ryan, self-determination theory).
- **No añadir notificaciones push invasivas**: anti-dark-pattern, configurables.
- **No auto-revelar la respuesta**: rompe desirable difficulty.
- **No gamificar con leaderboards sociales**: no escala para app personal de memorización individual.
- **No heatmap calendar (estilo GitHub contributions)**: agrega ruido visual, no aporta información accionable vs la línea de XP.

---

**Próximo paso:** Esta investigación guía todas las decisiones del plan. Proceder con Fase 1 (sistema de tokens `src/tema/`).
