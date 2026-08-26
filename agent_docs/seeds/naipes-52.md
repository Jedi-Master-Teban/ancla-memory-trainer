# Semilla: 52 naipes

Fuente: §7.4 del brief + **reglas dictadas por el operador durante Plan Mode**
(2026-08-10). El brief no traía las 52 palabras; trae las reglas para construirlas.

> **Convención de mazo (aclarado 2026-08-12):** el mazo francés estándar de 52
> cartas con figuras **J, Q, K** (el que trae `type Valor` en §6) — no la baraja
> española tradicional (Oros/Copas/Espadas/Bastos, sin Reina, con Sota/Caballo/Rey).
> Los palos de la Regla 1 (Espadas/Diamantes/Palos/Corazones) ya eran la
> traducción de picas/diamantes/tréboles/corazones, así que esa parte estaba
> bien; lo que había que corregir era llamar a las figuras "Sota, Reina, Rey" en
> vez de J, Q, K — mezclaba vocabulario de dos mazos distintos. Nunca usar
> imágenes o iconografía de la baraja española en la UI.

## 1. Reglas (texto del operador, normativo)

**Regla 1 — La consonante inicial indica el palo** (adaptación al mazo del libro):

| Palo | Letra inicial |
|---|---|
| Espadas | **E** |
| Diamantes | **D** |
| Palos / Tréboles | **P** |
| Corazones | **C** |

**Regla 2 — El último sonido consonante indica el valor**, usando exactamente la
tabla fonética de `decodificacion-fonetica.md`.

Es decir: la palabra **empieza** con la letra del palo y **termina** con el sonido
consonante del valor.

> Ejemplo del operador: para "10 de Espadas" se necesita una palabra que empiece con
> E y termine en sonido R, porque 10 codifica a R.

**Figuras (J, Q, K):** no tienen un dígito natural 11–13 limpio ni tabla fonética
que decodificar. Siguen la Regla 1 (empiezan con la letra del palo) pero **no
tienen Regla 2**: sin restricción de sonido final. El operador asigna la palabra
de cada una de las 12 directamente, memorizada sin decodificar (ADR-017 — no
hacía falta perseguir la convención original de Lorayne para un conjunto cerrado
de 12 cartas que el operador iba a dictar de todos modos).

## 2. Valor → sonido consonante final

| Carta | Dígito | Sonido(s) admitidos |
|---|---|---|
| A | 1 | T, D |
| 2 | 2 | N, Ñ |
| 3 | 3 | M |
| 4 | 4 | C(ca,co,cu), K, Q |
| 5 | 5 | L, LL |
| 6 | 6 | S, Z, C(ce,ci) |
| 7 | 7 | F, J, G(ge,gi) |
| 8 | 8 | Ch, G(ga,go,gu) |
| 9 | 9 | V, B, P |
| 10 | 0 | R, RR |
| J / Q / K | — | Sin restricción — solo Regla 1 (ADR-017) |

## 3. Asimetría crítica del marcador de palo (la trampa de este módulo)

La letra de palo es un **marcador ortográfico**, no un fonema con valor. El
validador debe descartarla antes de leer el valor, y cada palo se comporta distinto:

| Palo | Inicial | ¿Es consonante? | ¿Tiene valor propio? | Consecuencia |
|---|---|---|---|---|
| Espadas | E | No, vocal | — | El **primer** sonido consonante ya es el valor |
| Diamantes | D | Sí | Valdría 1 | Hay que **saltarla** o toda carta parecería un As |
| Palos | P | Sí | Valdría 9 | Hay que **saltarla** o toda carta parecería un 9 |
| Corazones | C | Sí | Valdría 4 ó 6 | Hay que **saltarla** |

Si el agente implementa "decodificar la palabra completa y tomar el último dígito"
sin saltar el marcador, los tests de Espadas pasarán y los de los otros tres palos
darán resultados plausibles pero incorrectos. **Este es el punto de mayor riesgo de
bug silencioso de la Fase 3.**

### Ambigüedad resuelta: Corazones y el dígrafo `ch`

Una palabra de Corazones que empiece por `ch` es ambigua: ¿la `c` es marcador de
palo y la `h` sobra, o `ch` es un fonema de valor 8?

**Regla adoptada:** para Corazones, la inicial debe ser una `c` seguida de **vocal**.
Las palabras que empiezan por `ch` quedan excluidas del mazo de Corazones. El
validador las rechaza con mensaje explícito. → Confirmar con el operador en Fase 3.

### Ambigüedad señalada, no resuelta: consonantes intermedias

La Regla 2 dice "el **último** sonido consonante", lo que admite palabras con
consonantes intermedias (marcador + X + valor). El validador implementa la regla tal
como fue dictada (último sonido = valor) y además emite una **advertencia no
bloqueante** cuando la palabra tiene más de un sonido consonante después del
marcador, porque la forma estricta (marcador + exactamente un sonido) es más fácil
de decodificar mentalmente a velocidad. No se convierte en error sin autorización.

## 4. Figuras — resuelto (ADR-017, ya no es un bloqueo)

Bloqueaba el inicio de la Fase 3 mientras se buscaba una convención de
consonante reservada para J/Q/K. Se resolvió eliminando esa necesidad: al ser
un conjunto cerrado de 12 cartas que el operador dicta directamente (§5), no
hace falta una regla generativa — solo Regla 1 (palo). Ver ADR-017 para el
razonamiento completo.

## 5. Origen de la semilla

Las 52 palabras **no las inventa el agente** (§4.1 del brief prohíbe inventar
contenido de dominio). Decidido con el operador (2026-08-12): a diferencia de lo
que este documento planteaba originalmente (agente propone candidatas → operador
aprueba), aquí **el operador dicta las 52 palabras directamente**, igual que hizo
con `colgadero-100.md` — las quiere personalmente evocativas, no solo
fonéticamente correctas. El flujo real:

1. El agente implementa `validarPalabraNaipe(palabra, carta)` a partir de estas reglas.
2. El operador dicta las 52 palabras (aquí en el chat o, más adelante, desde el
   editor de la app una vez exista).
3. El validador las revisa; si alguna no cumple la regla, se avisa **sin bloquear**
   (la lista es del operador) y se pregunta si quiere ajustarla.
4. Solo las palabras dictadas por el operador se persisten como semilla.

Una carta sin palabra aprobada existe en la BD con `contenido_reverso` vacío y queda
excluida de las sesiones de repaso hasta que se llene.

## 6. Firmas previstas

```ts
// src/domain/fonetica/naipes.ts — lógica pura, sin React ni expo-*
type Palo = 'espadas' | 'diamantes' | 'palos' | 'corazones';
type Valor = 'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K';
type Carta = { palo: Palo; valor: Valor };

inicialDePalo(palo: Palo): string;
esFigura(valor: Valor): boolean;                    // J | Q | K
sonidosDeValor(valor: Valor): string[] | null;      // null para figuras: sin restricción
validarPalabraNaipe(palabra: string, carta: Carta):
  { valida: boolean; motivo?: string; advertencias: string[] };
cartaDesdePalabra(palabra: string, palabrasAsignadas: Map<string, Carta>): Carta | null;
  // numéricas: decodificación fonética. Figuras: búsqueda directa en
  // palabrasAsignadas (no hay nada que decodificar — ADR-017).
```

## 7. Contrato de test obligatorio (Fase 3)

1. Cada palo salta correctamente su marcador: una palabra de Diamantes cuyo valor es
   As no puede confundirse con la `d` inicial.
2. "10 de Espadas" acepta una palabra E…R y rechaza una E…T.
3. Corazones rechaza una palabra que empieza por `ch`, con motivo legible.
4. Una palabra con consonantes intermedias es **válida con advertencia**, no inválida.
5. `cartaDesdePalabra(p)` es inversa de `validarPalabraNaipe` para toda palabra
   numérica válida (vía decodificación) y para toda figura presente en
   `palabrasAsignadas` (vía búsqueda directa).
6. Una figura (J/Q/K) es válida si y solo si empieza con la letra del palo
   correcto — cualquier terminación. Rechaza si empieza con la letra equivocada,
   con motivo legible. Nunca aplica una restricción de sonido final a una figura.
