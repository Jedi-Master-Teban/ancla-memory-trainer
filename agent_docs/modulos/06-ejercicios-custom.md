# Módulo 06 — Creación de Ejercicios Personalizados (§8.6)

- **Fase:** 7
- **Depende de:** todos los módulos de categoría (02, 03, 04, 05)
- **Archivos:** `src/domain/categorias/registro.ts`,
  `src/components/FormularioGenerico.tsx`, `app/crear/[categoria].tsx`

## 1. Qué es

Un CRUD **genérico** que permite añadir, editar y eliminar ítems en cualquier
categoría existente **sin tocar código**. Es la prueba de que el modelo de datos
aguanta extensión.

Va en la Fase 7, después de las cuatro categorías, a propósito: un formulario
genérico diseñado antes de conocer los cuatro casos reales sale mal.

## 2. Registro de categorías

Una tabla de datos, no una cadena de `if`:

```ts
// src/domain/categorias/registro.ts
type CampoCategoria = {
  clave: string; etiqueta: string;
  tipo: 'texto' | 'numero' | 'seleccion';
  requerido: boolean; opciones?: string[];
  validar?: (valor: string) => { ok: boolean; motivo?: string; advertencia?: string };
};

REGISTRO: Record<Categoria, {
  etiquetaSingular: string; etiquetaPlural: string;
  campos: CampoCategoria[];
  aTarjeta: (valores) => { frente: string; reverso: string; metadata: object };
}>
```

Cada categoría engancha su validador de dominio (fonético para colgadero, de naipes
para naipe). El formulario **no reimplementa** ninguna validación: la llama.

## 3. Criterio de diseño que define el éxito del módulo

Añadir una categoría futura (`palabra_clave`, `loci`, `pao`) debe requerir:

1. Un valor nuevo en el tipo `Categoria`.
2. Una entrada nueva en `REGISTRO`.
3. **Cero** cambios en `FormularioGenerico.tsx` y **cero** migraciones destructivas.

Si hace falta algo más, el registro está mal diseñado. Es un criterio verificable, no
una aspiración: la Fase 7 lo prueba con una categoría de juguete en un test que se
borra después.

## 4. Advertencias, no bloqueos

Las validaciones de dominio **advierten** pero no impiden guardar. Los datos son del
usuario: si quiere una palabra colgadero que no cumple la fonética, es su decisión.
La app la marca visualmente; no la rechaza.

## 5. Reglas

- Editar un ítem **conserva** el `id` de la tarjeta y su estado FSRS.
- Eliminar un ítem lo **archiva** (`archivada = 1`), no lo borra: el histórico de
  `revision` debe seguir siendo interpretable.
- Un ítem nuevo nace como tarjeta `State.New` y entra en la siguiente sesión.

## 6. `done when` de la Fase 7

Literal de §11: **se agrega un ítem nuevo sin tocar código y aparece en la próxima
sesión de repaso.**

Evidencia exigida:
1. En el iPhone: crear un ítem nuevo en cada una de las 4 categorías, desde la app.
2. Cerrar y reabrir, iniciar sesión, y verificar que los 4 aparecen.
3. Test del criterio de la sección 3: una categoría de juguete se registra sin tocar
   el formulario.
4. `npm test` verde + `npx tsc --noEmit` limpio.
