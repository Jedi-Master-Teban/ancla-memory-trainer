# Modelo de datos

Refina el borrador de §9 del brief, que se declara explícitamente "orientativo, a
refinar en Plan Mode — no copiar literalmente". Las divergencias respecto al brief
están justificadas abajo y registradas en `DECISIONS.md`.

## 1. Tres divergencias deliberadas respecto a §9

### 1.1 `fsrs_retrievability` NO se almacena

La retrievability es función de la estabilidad **y del tiempo transcurrido**. Guardarla
la deja obsoleta al segundo siguiente. Se calcula al vuelo desde `ts-fsrs`.

### 1.2 `estado (nueva|aprendiendo|madura|en_riesgo)` NO se almacena

`ts-fsrs` ya mantiene su propio `State` canónico. Mantener a mano un segundo
diagrama de estados garantiza que ambos se desincronicen. Se guarda el `State` de
`ts-fsrs` como fuente de verdad y los 4 estados del brief se **derivan** con una
función pura:

```
estadoVisual(tarjeta, ahora):
  State.New                                  → 'nueva'
  State.Learning | State.Relearning          → 'aprendiendo'
  State.Review && retrievability < 0.9       → 'en_riesgo'
  State.Review && estabilidad >= 21 días     → 'madura'
  State.Review                               → 'aprendiendo'
```

El umbral de 21 días y el 0.9 viven en una constante única, no repetidos por la app.

### 1.3 `categoria` sin `CHECK` en SQL

SQLite no permite alterar un `CHECK`; habría que reconstruir la tabla para añadir
`loci` o `pao`, y eso es exactamente la migración destructiva que el brief prohíbe.
La validación vive en el borde del repositorio, con un tipo unión de TypeScript.

Enum activo (§7.5 movido a futuro por decisión del operador):

```ts
type Categoria = 'colgadero' | 'naipe' | 'lista_item' | 'numero';
// futuro, no implementar: 'palabra_clave' | 'loci' | 'pao'
```

## 2. Esquema

Todas las fechas de dominio en **ISO-8601 UTC**. La única excepción es `fecha_local`
de la racha (ver 2.6).

### 2.1 `mazo`
`id` TEXT PK · `nombre` TEXT · `categoria` TEXT · `creado_en` TEXT

### 2.2 `tarjeta`
`id` TEXT PK · `mazo_id` TEXT FK→mazo ON DELETE CASCADE · `categoria` TEXT ·
`contenido_frente` TEXT · `contenido_reverso` TEXT ·
`fsrs_state` INTEGER · `fsrs_dificultad` REAL · `fsrs_estabilidad` REAL ·
`fsrs_reps` INTEGER · `fsrs_lapses` INTEGER · `fsrs_scheduled_days` INTEGER ·
`fsrs_learning_steps` INTEGER ·
`fecha_ultima_revision` TEXT NULL · `fecha_proxima_revision` TEXT NOT NULL ·
`metadata_categoria` TEXT NOT NULL DEFAULT '{}' (JSON) ·
`creada_en` TEXT · `archivada` INTEGER DEFAULT 0

Índices: `(fecha_proxima_revision, archivada)` y `(categoria, archivada)` — son las
dos consultas calientes (armar sesión, contar pendientes por categoría).

**`metadata_categoria` por tipo:**

| categoría | JSON |
|---|---|
| `colgadero` | `{ numero: 1..100 }` |
| `naipe` | `{ palo, valor, aprobada_por_operador: bool }` |
| `lista_item` | `{ lista_id, id_objeto_a, id_objeto_b }` — el eslabón A→B, por id de `lista_objeto` (ADR-020; no por posición, para poder identificar el mismo eslabón aunque se desplace de posición) |
| `numero` | `{ numero_id }` |

### 2.3 `revision` (log inmutable, una fila por calificación)
`id` · `tarjeta_id` FK · `sesion_id` FK · `calificacion` INTEGER (1..4) ·
`fecha` TEXT · `estabilidad_antes` REAL · `estabilidad_despues` REAL ·
`elapsed_days` INTEGER · `direccion` TEXT NULL (`'directa'|'inversa'`)

Sin esta tabla el Panel de Retención (§8.8) no tiene de dónde salir. Nunca se borran
filas: es el histórico crudo contra el que se verifica la Fase 6.

### 2.4 `sesion_estudio`
`id` · `iniciada_en` · `terminada_en` NULL · `duracion_segundos` · `aciertos` ·
`fallos` · `modo` TEXT

`tarjetas_revisadas[]` de §9 se deriva de `revision`, no se duplica como array.

### 2.5 Listas encadenadas (§8.4)
- `lista`: `id` · `nombre` · `segundos_estudio` INTEGER · `creada_en`
- `lista_objeto`: `id` · `lista_id` FK · `posicion` INTEGER · `texto` TEXT

Los eslabones **son** filas de `tarjeta` con `categoria='lista_item'`. Una lista de
N objetos genera **N−1** tarjetas (decisión del operador: una tarjeta por par
consecutivo).

**Reordenar o insertar en medio:** el eslabón roto se marca `archivada=1`
(conserva su histórico) y se crean los eslabones nuevos como tarjetas nuevas. Nunca
se borra ni se reescribe el contenido de un eslabón existente conservando su
estado FSRS: eso falsearía la estadística.

### 2.6 `numero_importante` (§8.5)
`id` · `etiqueta` TEXT · `digitos` TEXT · `creado_en`

Se guarda como TEXT, no INTEGER: los ceros a la izquierda son significativos.

### 2.7 Racha (§8.7)
- `dia_practica`: `fecha_local` TEXT PK (`YYYY-MM-DD`) · `tarjetas_revisadas` ·
  `meta_cumplida` INTEGER · `congelador_usado` INTEGER
- `racha_config`: fila única — `meta_diaria` · `congeladores_disponibles` ·
  `hora_recordatorio`

**`fecha_local` es local a propósito.** Una racha es un concepto de calendario
humano: el día termina a la medianoche del dispositivo, no en UTC. Consecuencia
aceptada y documentada: viajar entre husos puede alargar o acortar un día. No se
"arregla" con UTC, que rompería el caso normal para arreglar el caso raro.

### 2.8 `preferencias` (Fase 8, ADR-026 y ADR-027)
Fila única — `id` INTEGER PK CHECK(id=1) · `tema` TEXT (`'arcade'` | `'papel'`)
· `tipografia` TEXT (`'sistema'` | `'tematica'`).
`tema` lo siembra la migración 006 con `'arcade'`; `tipografia` la agrega la
migración 007 como `ADD COLUMN ... DEFAULT 'tematica'` (aditiva, conserva el
tema ya elegido en el dispositivo). Dos ejes independientes: el tema decide la
paleta y qué familia tipográfica, la preferencia decide si esa familia se usa o
se cae a la letra del sistema.

## 3. Política de migraciones

- Archivos numerados en `src/db/migrations/NNN_nombre.ts`, aplicados en orden y
  registrados en una tabla `migracion(version, aplicada_en)`.
- Solo se permite: `CREATE TABLE`, `CREATE INDEX`, `ADD COLUMN` con default,
  backfill por `UPDATE`.
- Prohibido sin autorización explícita del operador: `DROP TABLE`, `DROP COLUMN`,
  `DELETE` masivo, reconstrucción de tabla, y cambiar el tipo de una columna.
- Toda migración se prueba sobre una BD **con datos** de la versión anterior, no
  solo sobre una BD vacía.

Detalle operativo en `.claude/skills/db-migracion/SKILL.md`.

## 4. Extensibilidad futura (§7.6 — no implementar)

`palabra_clave`, `loci` y `pao` entran añadiendo un valor al tipo unión y usando
`metadata_categoria`. Ninguno requiere tocar la tabla `tarjeta`. Ese es el criterio
de éxito del diseño: **si añadir Palacio de Loci exige un `ALTER TABLE` destructivo,
el modelo está mal.**
