# Módulo 07 — Sistema de Racha (§8.7)

- **Fase:** 5 (la notificación nocturna se completa en Fase 8)
- **Archivos:** `src/domain/racha/calculo.ts`, `src/stores/racha.ts`,
  `app/racha.tsx`, `src/components/IndicadorRacha.tsx`, `Heatmap90.tsx`

## 1. Principio rector (§8.7, literal)

**Nunca penalizar duramente por fallar una tarjeta.** El progreso de la sesión debe
seguir sintiéndose hacia adelante. Fallar una tarjeta suma al contador de tarjetas
revisadas igual que acertarla: el objetivo diario es *practicar*, no *acertar*.

## 2. Datos

- `dia_practica(fecha_local PK, tarjetas_revisadas, meta_cumplida, congelador_usado)`
- `racha_config` (fila única): `meta_diaria`, `congeladores_disponibles`, `hora_recordatorio`

`fecha_local` = `YYYY-MM-DD` en el huso del dispositivo (ADR-010). Una racha es un
concepto de calendario humano; el día termina a la medianoche del usuario, no en UTC.
Consecuencia aceptada: viajar entre husos puede alargar o acortar un día.

## 3. Cálculo (lógica pura, con reloj inyectado — invariante I-6)

```ts
calcularRacha(dias: DiaPractica[], hoy: string, config): {
  diasConsecutivos: number;
  estado: 'activa' | 'en_riesgo' | 'rota';
  metaDeHoyCumplida: boolean;
  congeladoresDisponibles: number;
}
```

Reglas:

- Un día **cuenta** si `tarjetas_revisadas >= meta_diaria`.
- Un día **también cuenta** si se usó un congelador (`congelador_usado = 1`).
- La racha se cuenta hacia atrás desde hoy. **Hoy sin cumplir no rompe la racha**:
  el día aún no ha terminado. Se rompe cuando existe un día *anterior a hoy* sin
  cumplir y sin congelador.
- `en_riesgo` = la meta de hoy no está cumplida y ya pasó la hora de recordatorio.

## 4. Congelador manual (§8.7)

Mecanismo que casi duplica la duración media de las rachas activas frente a no
tenerlo. Por eso está en el brief y por eso **es manual**: el usuario decide gastarlo.

- Se consume aplicándolo a un día concreto ya pasado que quedó sin cumplir.
- Se descuenta de `congeladores_disponibles`.
- Recarga: **PENDIENTE de decisión del operador** (el brief no lo especifica). Por
  defecto el contador es un número fijo editable a mano en ajustes; **no se inventa
  una economía de recompensas**.

## 5. Presentación

- **Indicador de racha:** llama que cambia de intensidad; apagada/tenue si está en
  riesgo avanzada la noche (§10). Animación simple — sin Reanimated complejo ni Skia (§6).
- **Heatmap de ~90 días:** una celda por día, intensidad según tarjetas revisadas.
  Los días congelados se distinguen visualmente de los cumplidos.
- **Notificación local nocturna** de racha en riesgo → Fase 8, sujeta al spike P-4.

## 6. Casos borde que el test debe cubrir

| Caso | Esperado |
|---|---|
| Primer día de uso | racha = 1 tras cumplir la meta |
| Hoy sin cumplir, ayer cumplido | racha intacta, estado `en_riesgo` tras la hora tope |
| Un hueco de un día sin congelador | racha = solo los días posteriores al hueco |
| Un hueco cubierto con congelador | racha continúa |
| Dos huecos seguidos, un congelador | racha rota |
| Cambio de mes y de año | sin saltos (aritmética de fechas, no de índices) |
| Cambio de huso horario | documentado; el test fija el comportamiento observado |

## 7. `done when` de la Fase 5 (parte de racha)

Literal de §11: **la racha persiste correctamente tras cerrar y reabrir la app dos
días distintos.**

Honestidad sobre este criterio: verificarlo de verdad **toma dos días de calendario**.
Se cierra en dos tiempos y se dice así, sin fingir:

- **Cierre parcial (mismo día):** tests con reloj inyectado sobre los 7 casos borde,
  más verificación en el iPhone de que cerrar y reabrir la app conserva la racha.
- **Confirmación (día +1):** el operador abre la app al día siguiente y confirma que
  el contador subió a 2. Hasta entonces la fase queda marcada
  **"cerrada a la espera de confirmación de 2 días"** — nunca "hecha" sin ese dato.
