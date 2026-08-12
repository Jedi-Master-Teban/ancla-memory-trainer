# Semilla: 100 palabras colgadero

Fuente: §7.3 del `PROJECT_BRIEF.md`. Lista **personal del usuario y ya validada
fonéticamente**. El agente no la modifica, no la "mejora" y no sustituye palabras
por otras que le parezcan más evocadoras.

## Lista

| # | Palabra | # | Palabra | # | Palabra | # | Palabra |
|---|---|---|---|---|---|---|---|
| 1 | Tea | 26 | Nuez | 51 | Loto | 76 | Fosa |
| 2 | Noé | 27 | Naife | 52 | Luna | 77 | Fofo |
| 3 | Amo | 28 | Nicho | 53 | Lima | 78 | Ficha |
| 4 | Oca | 29 | Nube | 54 | Loco | 79 | Fobia |
| 5 | Ley | 30 | Mar | 55 | Lulú | 80 | Chorro |
| 6 | Oso | 31 | Mito | 56 | Lazo | 81 | Choto |
| 7 | Fea | 32 | Mono | 57 | Lofio | 82 | Chino |
| 8 | Hucha | 33 | Mamá | 58 | Lucha | 83 | Chama |
| 9 | Ave | 34 | Meca | 59 | Lupa | 84 | Cheque |
| 10 | Torre | 35 | Miel | 60 | Suero | 85 | Chal |
| 11 | Teta | 36 | Mesa | 61 | Sota | 86 | Choza |
| 12 | Tina | 37 | Mufa | 62 | Zona | 87 | Chafa |
| 13 | Tomo | 38 | Mecha | 63 | Sima | 88 | Chacha |
| 14 | Taco | 39 | Mapa | 64 | Saco | 89 | Chapa |
| 15 | Tela | 40 | Carro | 65 | Sol | 90 | Burra |
| 16 | Tez | 41 | Codo | 66 | Seso | 91 | Pito |
| 17 | Tufo | 42 | Cuna | 67 | Sofá | 92 | Pino |
| 18 | Techo | 43 | Cama | 68 | Acecho | 93 | Puma |
| 19 | Tubo | 44 | Coco | 69 | Sapo | 94 | Vaca |
| 20 | Nuera | 45 | Cola | 70 | Faro | 95 | Bala |
| 21 | Nido | 46 | Cazo | 71 | Foto | 96 | Buzo |
| 22 | Niño | 47 | Café | 72 | Fauna | 97 | Befo |
| 23 | Nomo | 48 | Coche | 73 | Fama | 98 | Bache |
| 24 | Eunuco | 49 | Cubo | 74 | Foca | 99 | Pipa |
| 25 | Nilo | 50 | Lira | 75 | Fiel | 100 | Torero |

## Verificación fonética

Las 100 fueron revisadas contra la tabla de `decodificacion-fonetica.md` durante
Plan Mode: **las 100 decodifican correctamente a su número**. Casos que ejercitan
reglas no triviales y que por eso deben aparecer nombrados en el test:

| Palabra | # | Regla que ejercita |
|---|---|---|
| Hucha | 8 | `h` inicial muda + dígrafo `ch` |
| Techo | 18 | prioridad de `ch` sobre `c` |
| Eunuco | 24 | vocal inicial + `c` ante `o` |
| Meca | 34 | `c` ante `a` = 4 |
| Cheque | 84 | `ch` + `qu` ante `e` (u muda) |
| Acecho | 68 | `c` ante `e` = 6, luego `ch` = 8 |
| Niño | 22 | `ñ` = 2 |
| Corro / Torre | 40 / 10 | `rr` = 0 |
| Torero | 100 | dos `r` simples = 0 y 0 |
| Sofá / Café / Mamá | 67 / 47 / 33 | normalización de tildes |
| Lulú | 55 | `l` repetida sin ser dígrafo `ll` |

## Contrato de test obligatorio (Fase 2)

```
describe('semilla colgadero', () => {
  it.each(SEMILLA)('%i → %s decodifica a %i', ...)
})
```

Si **una sola** palabra falla, la Fase 2 no cierra. No se "ajusta la palabra para
que pase el test": se reporta al operador, porque la lista es dato del usuario y el
error estaría en el decodificador.

## Uso en la app

- Se siembra una vez, en la primera apertura, dentro de un mazo `colgadero`.
- El usuario **puede editar** cualquier palabra desde §8.6. Al editarla, el
  validador fonético advierte si la nueva palabra no codifica el número, pero
  **no bloquea**: la lista es suya.
- Editar una palabra **no reinicia** el estado FSRS de su tarjeta (mismo `id`).
