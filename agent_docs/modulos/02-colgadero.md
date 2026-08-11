# Módulo 02 — Práctica de las 100 Palabras Colgadero (§8.2)

- **Fase:** 2
- **Depende de:** módulo 01 (FSRS), `decodificacion-fonetica.md`, `seeds/colgadero-100.md`
- **Archivos:** `src/seed/colgadero.ts`, `src/domain/fonetica/*`,
  `app/colgadero/*`, `src/components/Flashcard.tsx`

## 1. Datos

Un mazo `colgadero` con 100 tarjetas, sembrado en la primera apertura.

- Frente: el número (`1`…`100`) · Reverso: la palabra
- `metadata_categoria`: `{ numero }`
- El **modo reverso no crea tarjetas nuevas**: es una dirección de presentación de la
  misma tarjeta. 100 tarjetas en total, no 200. Se registra en `revision.direccion`.

## 2. Los tres modos (§8.2)

### Fonética Flash — número → palabra
Muestra el número. **Pausa deliberada** de visualización mental (§10) antes de poder
revelar: el botón "Ver respuesta" aparece tras ~2 s. No es decoración; fuerza el
recuerdo activo. Se revela, se califica en 4 niveles.

### Reverso — palabra → número
Idéntico, invertido. Califica la misma tarjeta con `direccion='inversa'`.

### Velocidad — serie cronometrada de 10 a 20
Serie continua sin pausa de visualización, con cronómetro visible. Al final:
tiempo total, tiempo medio por tarjeta, aciertos/fallos.

**Regla:** el modo Velocidad **sí** califica FSRS. Un acierto rápido cuenta como
"Bien"; un fallo, como "Otra vez". La correspondencia exacta se documenta en el
código y no se cambia sin ADR.

## 3. Selección de tarjetas de la sesión

Vía repositorio, nunca con SQL suelto en la pantalla:

1. Tarjetas vencidas (`fecha_proxima_revision <= ahora`), más urgente primero.
2. Si faltan para llenar la sesión, tarjetas nuevas en orden de número.
3. Tope por sesión configurable; por defecto 20 (§10: sesiones de 10–20 min).

## 4. Estadísticas por palabra (§8.2)

Veces revisada, tasa de aciertos, próxima fecha, estado visual. Todo derivado de
`revision` y `tarjeta` — nada de contadores paralelos que puedan desincronizarse.

## 5. Decodificación fonética en la UI

Al revelar el reverso se muestra la explicación de `explicar()`: *"Techo → T(1) +
ch(8) = 18"*. Es el valor pedagógico real del módulo. Fuente única de la regla:
`decodificacion-fonetica.md`.

## 6. `done when` de la Fase 2

Literal de §11: **se completa una sesión real de 20 tarjetas en el dispositivo sin crash.**

Evidencia exigida para cerrar:
1. `npm test` verde, incluyendo el test de las 100 semillas.
2. `npx tsc --noEmit` limpio.
3. Sesión de 20 tarjetas hecha en el iPhone vía Expo Go, descrita paso a paso.
4. Query de verificación: la sesión quedó en `sesion_estudio` y hay 20 filas nuevas
   en `revision`.
