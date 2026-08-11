---
description: Ejecuta el ritual de handoff (§12.6) y escribe SESSION_NOTES.md
---

Vamos a cerrar la sesión. Invoca la Skill `cierre-sesion` y ejecútala completa.

Reglas que no se negocian:

- `SESSION_NOTES.md` se **sobrescribe entero**. Es un relevo, no una bitácora.
- Reconstruye lo que pasó desde `git status` y `git log`, **no de memoria**.
- Separa explícitamente lo **verificado** de lo **afirmado sin verificar**. Si algo
  se dijo pero no se comprobó, va como "sin verificar". No lo maquilles.
- "Qué sigue" tiene que ser una **acción concreta**, no "continuar la fase 3".
- Cualquier decisión de arquitectura va a `agent_docs/DECISIONS.md` como ADR nuevo:
  `SESSION_NOTES.md` se sobrescribe y se perdería.
- Comprueba que `CLAUDE.md` sigue por debajo de 200 líneas.

Termina con el resumen de 5 líneas: fase y paso, qué quedó verificado, qué quedó sin
verificar, qué bloquea y quién lo desbloquea, y cuál es la primera acción concreta de
la próxima sesión.
