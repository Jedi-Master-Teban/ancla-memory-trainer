# Protocolo anti-alucinación y verificación

Versión completa de §4 del brief. `CLAUDE.md` lleva la versión condensada (se carga
en cada turno); este archivo lleva el detalle y los procedimientos. Las Skills
`verificacion` y `verificar-api-libreria` son su implementación ejecutable.

## 1. Permiso explícito para no saber

El agente **tiene permiso y obligación** de decir "no estoy seguro de que esta API
de Expo funcione así" en vez de inventar una firma de función. Decirlo no es un
fallo de desempeño: es el comportamiento correcto. Inventar una firma plausible es
el fallo.

Formas admitidas de admitir incertidumbre:

- "No verifiqué esta firma. Voy a leerla en `node_modules/<paquete>` antes de usarla."
- "El brief no cubre este caso. Necesito que lo decidas: A o B."
- "Implementé esto asumiendo X. Si X es falso, se rompe Y."

Forma prohibida: escribir el código igual y esperar que compile.

## 2. Nunca asumir una API por analogía

Ante cualquier duda sobre `expo-sqlite`, `ts-fsrs`, `expo-notifications`,
`expo-router` u otra dependencia, **verificar contra el paquete instalado o su
documentación oficial** antes de escribir código que la use.

Orden de autoridad, de mayor a menor:

1. Los `.d.ts` del paquete instalado en `node_modules/` — es lo que realmente
   compila en esta máquina, con esta versión.
2. El README / CHANGELOG del paquete instalado.
3. La documentación oficial en línea, **con la versión comprobada** contra la que
   está en `package.json`.
4. Nada más. Ni memoria del modelo, ni analogía con otra librería, ni un blog.

Riesgo específico documentado: `ts-fsrs` y `expo-sqlite` han cambiado su API entre
versiones mayores. Una firma recordada "de memoria" tiene alta probabilidad de
corresponder a una versión distinta de la instalada.

Procedimiento paso a paso: `.claude/skills/verificar-api-libreria/SKILL.md`.

## 3. Restricción de conocimiento externo

Para todo lo que sea **requisitos de la app**, la única fuente válida es
`PROJECT_BRIEF.md` + `agent_docs/` + decisiones registradas en `DECISIONS.md`.

El agente **no** añade funcionalidad que le parezca buena idea, no añade campos "por
si acaso", y no completa contenido de dominio (palabras colgadero, imágenes de
naipes, reglas fonéticas) que el operador no haya dictado.

Si algo falta, se marca como abierto y se pregunta. Un hueco declarado es barato;
un hueco rellenado con invención cuesta la confianza en todo lo demás.

## 4. Checklist de verificación obligatoria

Se corre **antes de cada commit**, vía `/verificar`. Definición ejecutable en
`.claude/skills/verificacion/SKILL.md`. Los 6 puntos de §4.2:

1. ¿Compila sin errores de TypeScript?
2. ¿Corre en Expo Go sin crashear al abrir la pantalla afectada?
3. ¿Hay tests de Jest para la lógica nueva (sobre todo FSRS)? ¿Pasan?
4. ¿Se tocó algún archivo fuera del alcance declarado? Si sí, **reportarlo**, no ocultarlo.
5. ¿Respeta el modelo de datos, con migraciones no destructivas?
6. Si se marca "hecho": ¿va con evidencia concreta adjunta?

Ningún punto se salta en silencio. Si uno no aplica, se escribe **N/A con
justificación**.

## 5. Cadena de verificación con citas internas

Toda afirmación sobre el estado del proyecto debe poder señalar **archivo y línea**.

| Afirmación | Evidencia mínima aceptable |
|---|---|
| "Implementé X" | `ruta/archivo.ts:120-158` |
| "Los tests pasan" | salida real de `npm test`, pegada |
| "Compila" | salida real de `npx tsc --noEmit` |
| "Corre en el iPhone" | qué pantalla se abrió, qué se hizo, qué se vio |
| "La fase está lista" | el `done when` de esa fase, punto por punto |

Si el agente no puede señalar la evidencia, **retracta la afirmación** en vez de
sostenerla. Retractar es correcto; sostener sin prueba es el fallo.

Prohibido en particular: decir "debería funcionar", "ya quedó listo" o "todo
correcto" sin haber ejecutado nada.

## 6. TDD donde importa

Para lógica de negocio no trivial se escribe **primero el test**, luego el código,
luego se corre y se confirma que pasa. Obligatorio en:

- Motor FSRS (`src/domain/fsrs/`) — riesgo de alucinación numérica más alto del proyecto.
- Decodificador fonético (`src/domain/fonetica/`) — dígrafos y casos borde.
- Validador de naipes (`src/domain/fonetica/naipes.ts`) — la trampa del marcador de palo.
- Cálculo de racha (`src/domain/racha/`) — fechas, medianoche, congeladores.
- Descomposición de números (`src/domain/numeros/`).

Corolario de arquitectura: por eso `src/domain/` **no importa React ni `expo-*`**.
Lógica pura se prueba sin mocks nativos; lógica mezclada con UI, no.

## 7. Señales de que el agente está alucinando (para el operador)

- Da una firma de función sin haber leído ningún archivo en este turno.
- Dice "los tests pasan" sin que haya salida de `npm test` en la conversación.
- Aparece una dependencia nueva que nadie aprobó.
- Cambia una decisión de `DECISIONS.md` sin mencionarlo.
- Aparecen palabras colgadero o de naipes que el operador no dictó.

Reacción: ejecutar `/estado` (ritual de §5.3 — releer `CLAUDE.md` y
`SESSION_NOTES.md` y resumir el estado real antes de continuar).
