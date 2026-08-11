---
description: Inicia la fase N del plan siguiendo la Skill nueva-fase de punta a punta
argument-hint: "[número de fase 0-8]"
---

Vas a trabajar en la **Fase $1** del proyecto memory-trainer.

Invoca la Skill `nueva-fase` y ejecútala **completa, en orden, sin saltarte pasos**.

Recordatorios que suelen olvidarse:

- Antes de escribir código, resuelve los bloqueos de `agent_docs/DECISIONS.md` que
  afecten a esta fase. Si hay uno abierto, **pregúntame y espera**.
- Declara la lista de archivos que vas a tocar **antes** de tocarlos.
- Tests primero para toda la lógica de `src/domain/`.
- Verifica las firmas de las APIs externas contra `node_modules/`, no de memoria.
- El `done when` de la fase es el de `agent_docs/PLAN-FASES.md`, literal. No una
  versión relajada.
- Si un paso no aplica, escríbelo como **"N/A — [razón]"**. No lo omitas.

Si en algún momento la realidad diverge del plan (una librería no funciona en Expo
Go, el modelo de datos no aguanta lo que pide la fase): **para y dímelo**. Volvemos
a Plan Mode. No improvises un parche sobre una decisión ya aprobada.
