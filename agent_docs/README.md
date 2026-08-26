# agent_docs — índice

Documentación de referencia para el agente. **No se carga automáticamente**: se lee
el archivo concreto que hace falta, cuando hace falta. Eso es deliberado —
`CLAUDE.md` cuesta contexto en cada turno; esto no.

## Cómo usar esto

| Vas a… | Lee primero |
|---|---|
| Empezar una fase | `PLAN-FASES.md` + el spec del módulo de esa fase |
| Tocar scheduling, intervalos o estado de tarjetas | `modulos/01-motor-fsrs.md` + Skill `fsrs-review` |
| Tocar el esquema o una migración | `MODELO-DATOS.md` + Skill `db-migracion` |
| Tocar fonética, colgadero o números | `decodificacion-fonetica.md` |
| Tocar naipes | `seeds/naipes-52.md` |
| Entender por qué algo está hecho así | `DECISIONS.md` |
| Dudar de una API de librería | `ANTI-ALUCINACION.md` + Skill `verificar-api-libreria` |

## Archivos

| Archivo | Contenido | Se edita |
|---|---|---|
| `PLAN-FASES.md` | Las 9 fases con archivos concretos y `done when` | Solo si cambia el plan, con ADR |
| `DECISIONS.md` | ADRs acumulativos + pendientes abiertos | **Solo se añade al final**, nunca se reescribe |
| `ANTI-ALUCINACION.md` | §4 del brief, completo y operacionalizado | Raramente |
| `MODELO-DATOS.md` | Esquema SQLite, derivaciones, política de migraciones | Con ADR |
| `decodificacion-fonetica.md` | Alfabeto fonético, dígrafos, algoritmo (**ruta exigida por §7.2**) | Con ADR |
| `GLOSARIO.md` | Términos de dominio ↔ nombres en código | Al añadir un término |
| `modulos/01..09` | Un spec por módulo de §8 | Con ADR |
| `seeds/colgadero-100.md` | Las 100 palabras del usuario y su validación | Solo el operador |
| `seeds/naipes-52.md` | Reglas de naipes dictadas por el operador | Solo el operador |
| `consultas-verificacion.sql` | Consultas manuales que verifican el panel (Fase 6) | En Fase 6 |

## Jerarquía de autoridad

Cuando dos fuentes se contradicen, gana la de arriba:

1. **`PROJECT_BRIEF.md`** — la especificación del operador.
2. **`DECISIONS.md`** — enmiendas y refinamientos ya acordados con el operador.
3. **`agent_docs/`** — el detalle derivado de los dos anteriores.
4. **`CLAUDE.md`** — el resumen operativo de todo lo anterior.
5. El código.

Si el agente encuentra una contradicción entre niveles, **la reporta**; no elige por
su cuenta cuál ignorar.
