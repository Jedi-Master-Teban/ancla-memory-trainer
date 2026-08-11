# Módulo 05 — Números Importantes (§8.5)

- **Fase:** 4
- **Depende de:** módulo 01, módulo 02 (necesita las 100 palabras sembradas)
- **Archivos:** `src/domain/numeros/descomposicion.ts`, `app/numeros/*`

## 1. Datos

`numero_importante(id, etiqueta, digitos, creado_en)`. `digitos` es **TEXT**: los
ceros a la izquierda son significativos (una clave `0453` no es `453`).

Una tarjeta por número, `categoria='numero'`:
frente = etiqueta ("Clave de la caja fuerte") · reverso = los dígitos.

## 2. Descomposición fonética automática

Al guardar y al repasar, la app muestra el número troceado en pares y las palabras
colgadero correspondientes, con la explicación fonética de cada una:

```
3145  →  31 | 45  →  Mito | Cola
         M(3)+T(1)      C(4)+L(5)
```

La regla de troceo, el caso impar y los casos abiertos (`00` y el `0` suelto) están
en `decodificacion-fonetica.md` §5. **No se resuelven aquí ni se improvisan**: si
aparece un trozo sin colgadero, se muestra el dígito crudo marcado como "sin
colgadero" y se deja constancia. Pendiente P-3 en `DECISIONS.md`.

## 3. Modo de repaso

Etiqueta → número, calificado en FSRS con los 4 niveles. Con pausa de visualización
antes de revelar, igual que el resto de flashcards.

Tras revelar se muestra siempre la descomposición: el usuario no memoriza dígitos,
memoriza la cadena de imágenes. Ese recordatorio es el módulo.

## 4. Reglas

- La descomposición **se deriva, no se persiste**. Si el usuario edita una palabra
  colgadero (§8.6), la descomposición debe reflejarlo sin migración.
- Editar los dígitos de un número **no** reinicia su estado FSRS, pero sí lo anota
  en la nota de la tarjeta: es información honesta para el panel de retención.
- Sin límite de longitud impuesto por la app; la UI trocea visualmente en filas.

## 5. `done when`

Cubierto por el `done when` conjunto de la Fase 4. Aporte específico de este módulo:

1. Test: `3145` → `[31, 45]` → `["Mito", "Cola"]`.
2. Test: número impar de dígitos → el dígito suelto queda **al final**.
3. Test: `0453` conserva el cero inicial y no se convierte en `453`.
4. Test: un trozo `00` no revienta — devuelve el marcador de "sin colgadero".
5. En el iPhone: guardar un número real, ver su descomposición, repasarlo.
