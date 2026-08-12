# Módulo 03 — Práctica de Naipes (§8.3)

- **Fase:** 3
- **Depende de:** módulos 01 y 02, `seeds/naipes-52.md`
- **Archivos:** `src/domain/fonetica/naipes.ts`, `src/seed/naipes.ts`,
  `app/naipes/*`, `src/components/EditorNaipe.tsx`

## 1. Bloqueo conocido al empezar la fase

Faltan las consonantes reservadas de **J, Q y K** (12 de 52 cartas) —
pendiente P-1 en `DECISIONS.md`. Al iniciar la Fase 3: **preguntar al operador y
esperar**. Nunca inventarlas.

Lo que **sí** se puede construir sin ese dato: validador de las 40 cartas
numéricas, editor CRUD, los cuatro modos de práctica y todos los tests. Las figuras
lanzan un error explícito de "regla pendiente" hasta que llegue el dato.

## 2. Datos

Mazo `naipe` con 52 tarjetas. Frente: la carta (p. ej. "10 ♠"). Reverso: la palabra
aprobada por el operador. `metadata_categoria`: `{ palo, valor, aprobada_por_operador }`.

Una carta con reverso vacío **existe pero no entra en sesiones de repaso**. El
contador de la app debe distinguir "52 cartas" de "N cartas listas para practicar" y
no fingir que están completas.

## 3. Reutilización, no copia

Los tres modos de §8.2 (Flash, Reverso, Velocidad) deben salir del **mismo motor de
sesión** que el colgadero, parametrizado por mazo. Si la Fase 3 obliga a copiar y
pegar las pantallas de la Fase 2, la abstracción de la Fase 2 estaba mal y hay que
arreglarla — ese es justamente el valor de que estas dos fases sean consecutivas.

## 4. Modo Baraja Completa (exclusivo de este módulo)

52 cartas en orden aleatorio, reproducción de memoria con tiempo y precisión.

Flujo: se fija una semilla aleatoria y se muestra el orden → el usuario memoriza →
la app oculta y pide reproducir en orden → se compara posición a posición.

Salida: tiempo total de memorización, tiempo de reproducción, cartas correctas /52,
y la lista de cuáles falló.

**Calificación FSRS:** cada carta acertada en su posición correcta cuenta "Bien";
cada fallo, "Otra vez". Una baraja completa genera 52 filas en `revision`.

**Nunca penalizar duramente** (§8.7): el resumen muestra el progreso ("38/52, tu
mejor marca fue 31"), no un veredicto de fracaso.

## 5. Validación al editar

Al guardar una palabra, `validarPalabraNaipe` responde una de tres cosas:
válida · válida con advertencia (consonantes intermedias) · inválida con motivo
legible ("empieza por 'ch': ambiguo para Corazones").

Una palabra inválida **advierte pero no bloquea**: el mazo es del usuario. Lo que sí
hace es marcar `aprobada_por_operador` y mostrar el aviso en el editor.

## 6. `done when` de la Fase 3

Literal de §11: **se mide y muestra tiempo + precisión de una baraja completa.**

Evidencia exigida:
1. `npm test` verde, incluyendo los 6 contratos de `seeds/naipes-52.md` §7.
2. `npx tsc --noEmit` limpio.
3. Baraja completa ejecutada en el iPhone, con los números que mostró la pantalla.
4. Confirmación de que las 52 filas correspondientes entraron en `revision`.
5. Estado explícito del bloqueo P-1: resuelto, o declarado como pendiente con las
   12 cartas de figuras marcadas sin aprobar.
