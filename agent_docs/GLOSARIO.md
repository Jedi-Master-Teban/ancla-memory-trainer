# Glosario

La UI va en **español (Colombia)** (§10). El código también usa español para los
términos de dominio, para que no haya dos vocabularios. Las excepciones son los
nombres que vienen de librerías externas (`ts-fsrs`), que se dejan tal cual.

## Dominio (Lorayne)

| Término | En código | Qué es |
|---|---|---|
| Sistema de la Cadena | `cadena` | Enlazar cada objeto con el siguiente por una imagen absurda |
| Eslabón | `eslabon` | Un par consecutivo A→B de una cadena. **Es la unidad de tarjeta FSRS** (ADR-001) |
| Alfabeto Fonético | `fonetica` | Tabla dígito ↔ sonido de §7.2 |
| Colgadero | `colgadero` | Palabra fija asociada a un número, de la lista de 100 |
| Naipe | `naipe` | Una de las 52 cartas y su palabra-imagen |
| Baraja Completa | `baraja` | Memorizar y reproducir las 52 cartas en orden |
| Método de Palabras Clave | `palabra_clave` | **Fuera de alcance activo** (ADR-003) |
| Palacio de la Memoria / Loci | `loci` | **Fuera de alcance** (§7.6) |
| PAO (Persona-Acción-Objeto) | `pao` | **Fuera de alcance** (§7.6) |

## Repetición espaciada

| Término | En código | Qué es |
|---|---|---|
| Tarjeta | `tarjeta` | Unidad memorizable con estado FSRS propio |
| Mazo | `mazo` | Agrupación de tarjetas de una categoría |
| Revisión | `revision` | Una calificación registrada. Log inmutable |
| Sesión de estudio | `sesion_estudio` | Un bloque de práctica |
| Calificación | `calificacion` | Otra vez / Difícil / Bien / Fácil → `Rating` de `ts-fsrs` |
| Estabilidad | `fsrs_estabilidad` | Parámetro de `ts-fsrs`. Nunca se calcula a mano |
| Dificultad | `fsrs_dificultad` | Ídem |
| Retrievability | — | **Derivada, nunca almacenada** (ADR-006) |
| Estado visual | `estadoVisual()` | nueva / aprendiendo / madura / en_riesgo, **derivado** del `State` |
| Lapso | `fsrs_lapses` | Veces que una tarjeta madura volvió a fallarse |

## Racha

| Término | En código | Qué es |
|---|---|---|
| Racha | `racha` | Días consecutivos cumpliendo la meta |
| Meta diaria | `meta_diaria` | Tarjetas por día para que el día cuente |
| Congelador | `congelador` | Consumible manual que salva un día no cumplido |
| Día de práctica | `dia_practica` | Una fila por fecha **local** (ADR-010) |
| En riesgo | `en_riesgo` | Meta de hoy sin cumplir y ya pasó la hora tope |

## Convenciones de nombres

- Tablas y columnas SQL: `snake_case` en español (`fecha_proxima_revision`).
- Tipos y componentes: `PascalCase` (`Tarjeta`, `Flashcard`).
- Funciones y variables: `camelCase` en español (`calcularRacha`, `estadoVisual`).
- Columnas que provienen de `ts-fsrs`: prefijo `fsrs_`, para que se vea de un vistazo
  que **ese valor no se toca a mano**.
- Fechas de dominio: sufijo `fecha_` y formato ISO-8601 UTC. Única excepción:
  `fecha_local` de la racha, en `YYYY-MM-DD` local.
