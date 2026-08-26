# Módulo 04 — Listas de Objetos / Sistema de la Cadena (§8.4)

- **Fase:** 4
- **Depende de:** módulo 01
- **Archivos:** `src/domain/cadena/eslabones.ts`, `src/db/migrations/003_*`,
  `app/listas/*`, `src/components/EditorLista.tsx`, `TemporizadorEstudio.tsx`

## 1. Decisión resuelta (era la pregunta abierta de §8.4)

**Una tarjeta FSRS por par consecutivo.** Sin tarjeta de "lista completa".
→ ADR-001. Una lista de N objetos genera **N−1** tarjetas.

```
Lista: [martillo, elefante, semáforo, guitarra]
Tarjetas: martillo→elefante · elefante→semáforo · semáforo→guitarra   (3 = 4−1)
```

**Pendiente de visto bueno (P-2 / ADR-002):** la dirección inversa (B→A) es una
dirección de presentación de la misma tarjeta, no una segunda tarjeta. Si en una
sesión se prueban ambas direcciones, se califica con la **peor** de las dos notas.
Confirmar con el operador antes de implementar.

## 2. Datos

- `lista(id, nombre, segundos_estudio, creada_en)`
- `lista_objeto(id, lista_id, posicion, texto)`
- Eslabones = filas de `tarjeta` con `categoria='lista_item'` y
  `metadata_categoria = { lista_id, id_objeto_a, id_objeto_b }` — identidad por
  id de `lista_objeto`, no por posición (ADR-020): así se reconoce el mismo
  eslabón aunque se desplace de posición por una inserción anterior en la
  lista, y solo se archiva/crea cuando la **adyacencia** cambia de verdad.

Frente del eslabón: el texto del objeto `id_objeto_a`. Reverso: el texto del
objeto `id_objeto_b`. El orden de presentación (para el modo de estudio) se
deriva uniendo `id_objeto_a` contra la posición vigente en `lista_objeto` —
nunca se guarda un número de posición aparte que se pueda desincronizar.

## 3. Reordenar, insertar y borrar (la parte delicada)

Insertar un objeto en medio **rompe** un eslabón y crea dos. Regla:

- El eslabón roto se marca `archivada = 1`. Conserva todo su histórico.
- Los eslabones nuevos nacen como tarjetas nuevas, con estado FSRS nuevo.
- **Prohibido** reescribir el contenido de un eslabón existente conservando su
  estado FSRS: falsearía la estadística de retención (diría que dominas un enlace
  que nunca has practicado).

Borrar la lista hace `CASCADE` sobre objetos y archiva sus eslabones. Las filas de
`revision` **no se borran nunca**.

## 4. Modo de estudio (§8.4)

1. Se muestra la lista completa durante **T segundos configurables** (`segundos_estudio`,
   por lista, por defecto 30).
2. Se oculta.
3. Reproducción **en orden**: se pide objeto 1, luego 2… Cada transición acertada
   califica su eslabón con "Bien"; cada fallo, con "Otra vez".
4. Reproducción **en orden inverso**: igual, hacia atrás. Califica los mismos
   eslabones con `direccion='inversa'`.

Al terminar: cuántos eslabones salieron en cada dirección y cuáles fallaron. La
lista de fallos es la que le sirve al usuario para reforzar la imagen absurda (§7.1).

## 5. CRUD

Crear lista, renombrar, añadir/editar/reordenar/eliminar objetos, fijar T. Todo
desde la app, sin tocar código.

Sugerencia de imagen: la app **no genera** imágenes mnemónicas. La imagen absurda
la crea el usuario; la app solo guarda un campo de nota opcional por eslabón. No es
un generador creativo, y no debe pretender serlo.

## 6. `done when` de la Fase 4 (parte de listas)

Literal de §11: **se crea, estudia y repasa una lista personalizada real de punta a punta.**

Evidencia exigida:
1. Test: una lista de N objetos produce exactamente N−1 tarjetas.
2. Test: insertar en medio archiva 1 eslabón y crea 2, sin tocar el histórico.
3. `npm test` verde + `npx tsc --noEmit` limpio.
4. En el iPhone: crear una lista real, estudiarla, reproducirla en ambos sentidos y
   verla aparecer al día siguiente en pendientes.
5. Query manual confirmando el conteo de eslabones y de filas en `revision`.
