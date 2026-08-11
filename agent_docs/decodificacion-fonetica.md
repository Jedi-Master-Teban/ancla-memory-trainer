# Decodificación fonética (Alfabeto Fonético — §7.2 del brief)

> **Ruta exigida por el brief.** §7.2 ordena literalmente que esta tabla viva en
> `agent_docs/decodificacion-fonetica.md`. No mover este archivo.
>
> **Regla de oro:** el agente NUNCA inventa una regla fonética. Si un caso no está
> resuelto aquí, se marca como abierto y se pregunta al operador. No se "deduce por
> analogía" con el inglés ni con otras adaptaciones del sistema Major.

## 1. Tabla canónica (fuente de verdad)

| Dígito | Sonido(s) | Regla mnemónica |
|---|---|---|
| 1 | T, D | La T tiene un palo vertical |
| 2 | N, Ñ | La N tiene dos palos |
| 3 | M | La M tiene tres palos |
| 4 | C(ca,co,cu), K, Q | C es inicial de "cuatro" |
| 5 | L, LL | L es cifra romana de 50 |
| 6 | S, Z, C(ce,ci) | S es inicial y final de "seis" |
| 7 | F, J, G(ge,gi) | F invertida se parece a un 7 |
| 8 | Ch, G(ga,go,gu) | Ch tiene la forma cerrada del 8 |
| 9 | V, B, P | P invertida se parece a un 9 |
| 0 | R, RR | El cero es redondo como una rueda |

**Sin valor numérico:** todas las vocales (a, e, i, o, u), H (salvo dentro de "ch"),
W, X, Y.

> Nota explícita sobre X: fonéticamente suena /ks/, pero el brief la declara sin
> valor. Se respeta el brief. No "corregir" esto por iniciativa propia.
>
> Nota explícita sobre Y: incluso cuando actúa como consonante ("yo", "ya"), no
> tiene valor. Se respeta el brief.

## 2. Normalización previa

Antes de recorrer la palabra:

1. Pasar a minúsculas.
2. Quitar tildes de vocales: á→a, é→e, í→i, ó→o, ú→u, ü→u.
3. **Conservar la ñ** (vale 2). Nunca normalizar ñ→n con un `NFD` ciego: eso
   funcionaría por accidente aquí (ambas valen 2) pero rompe la trazabilidad.
4. Descartar espacios, guiones y signos.

## 3. Algoritmo de decodificación (palabra → número)

Recorrido izquierda→derecha, tomando **siempre la regla de mayor prioridad que
coincida**. El orden importa: los dígrafos van antes que sus letras sueltas.

| # | Patrón | Consume | Dígito |
|---|---|---|---|
| 1 | `ch` | 2 | 8 |
| 2 | `ll` | 2 | 5 |
| 3 | `rr` | 2 | 0 |
| 4 | `qu` seguido de `e`/`i` | 2 | 4 |
| 5 | `gu` seguido de `e`/`i` | 2 | 8 |
| 6 | `c` seguido de `e`/`i` | 1 | 6 |
| 7 | `c` en cualquier otro caso | 1 | 4 |
| 8 | `g` seguido de `e`/`i` | 1 | 7 |
| 9 | `g` en cualquier otro caso | 1 | 8 |
| 10 | `t`, `d` | 1 | 1 |
| 11 | `n`, `ñ` | 1 | 2 |
| 12 | `m` | 1 | 3 |
| 13 | `k`, `q` | 1 | 4 |
| 14 | `l` | 1 | 5 |
| 15 | `s`, `z` | 1 | 6 |
| 16 | `f`, `j` | 1 | 7 |
| 17 | `v`, `b`, `p` | 1 | 9 |
| 18 | `r` | 1 | 0 |
| 19 | `a e i o u h w x y` | 1 | — (ignorar) |

Cualquier carácter que no encaje en ninguna regla ⇒ **error explícito**, nunca
ignorar en silencio.

### Casos que el algoritmo debe resolver bien (y por qué)

- **"Techo" = 18**: `t`→1, `e` ignorada, `ch`→8. Si `ch` no tuviera prioridad
  sobre `c`, saldría 14 (`c`→4) y luego `h` ignorada. Este es el bug número uno.
- **"Hucha" = 8**: la `h` inicial se ignora, la `ch` interna vale 8.
- **"Cheque" = 84**: `ch`→8, `qu`+`e`→4. La `u` es muda y NO debe contarse.
- **"Acecho" = 68**: `c`+`e`→6, `ch`→8.
- **"Coco" = 44**: ambas `c` van seguidas de `o`.
- **"Meca" = 34**: la `c` va seguida de `a`.
- **"Torero" = 100** y **"Corro" = 40**: `r` y `rr` valen ambas 0.
- **"Niño" = 22**: la `ñ` vale 2.
- **"Guerra" = 80**: `gu`+`e`→8, `rr`→0.
- **"Guante" = 821**: `g`+`u`→8 (regla 9), `u` ignorada, `n`→2, `t`→1. Coincide con
  la lectura fonética; no hace falta regla extra para `gu` ante `a/o`.
- **"Pingüino" = 9282**: tras normalizar `ü`→`u`, la regla 5 da `gu`+`i`→8. El
  resultado es el mismo por ambos caminos.

## 4. Firmas previstas (TypeScript, lógica pura, sin React ni expo-*)

```ts
// src/domain/fonetica/decodificador.ts
type Fonema = { sonido: string; digito: number; indice: number };

decodificar(palabra: string): { digitos: number[]; fonemas: Fonema[] };
aNumero(palabra: string): number;              // 1234, no "1234"
validarColgadero(numero: number, palabra: string): boolean;
explicar(palabra: string): string;             // "T(1) + e + ch(8) → 18", para la UI
```

`explicar()` no es adorno: la app la usa para mostrarle al usuario POR QUÉ una
palabra codifica un número (§8.5), y sirve como salida legible en los tests.

## 5. Codificación inversa (número → palabras colgadero)

Usada por el módulo de Números Importantes (§8.5). **No genera palabras nuevas:**
solo busca en la lista semilla de 100 (ver `seeds/colgadero-100.md`).

Regla de troceo: pares de dígitos de izquierda a derecha, preservando el orden de
lectura. Si la cantidad de dígitos es impar, el dígito sobrante queda **al final**
y se resuelve con el colgadero 1–9.

- `12345` → `12 | 34 | 5` → Tina, Meca, Ley
- `3001234567` → `30 | 01 | 23 | 45 | 67` → …

### Casos abiertos (NO inventar solución)

| Caso | Estado | Nota |
|---|---|---|
| Trozo `00` | **ABIERTO** | No existe colgadero 0 ni 00. Por defecto se muestra el dígito crudo y se marca visualmente como "sin colgadero". |
| Dígito suelto final `0` | **ABIERTO** | Mismo tratamiento. Si el operador quiere una palabra para el 0 (p. ej. "Oro"), la define él; el agente no la inventa. |
| Trozo con cero a la izquierda (`01`, `07`) | Resuelto | Se lee como el colgadero 1 y 7 respectivamente, mostrando el cero en la etiqueta. |

## 6. Corpus mínimo de test (Jest, Fase 2)

El test de `decodificador.test.ts` debe cubrir, como mínimo:

1. Las **100 palabras semilla** de `seeds/colgadero-100.md`: cada una decodifica
   exactamente a su número. Este test es la red de seguridad de todo el módulo.
2. Los 12 casos difíciles de la sección 3 de este documento.
3. Rechazo de entradas inválidas: cadena vacía, dígitos dentro de la palabra,
   caracteres no alfabéticos.
4. Idempotencia de la normalización: `decodificar("Café") === decodificar("cafe")`.
5. `explicar()` produce una cadena que contiene todos los dígitos del resultado.

## 7. Ver también

- `seeds/colgadero-100.md` — la lista semilla y su validación.
- `seeds/naipes-52.md` — la variante de estas reglas aplicada a las 52 cartas.
- `modulos/02-colgadero.md`, `modulos/05-numeros.md` — quién consume esto.
