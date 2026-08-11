---
description: Ritual de recuperación (§5.3) — re-anclar el estado real del proyecto cuando el agente se pierde o se contradice
---

Para lo que estés haciendo.

Vuelve a leer **completos**:

1. `CLAUDE.md`
2. `SESSION_NOTES.md`
3. Los pendientes abiertos al final de `agent_docs/DECISIONS.md`

Y corre:

```bash
git status --short
git log --oneline -5
```

Después, resume el estado actual del proyecto antes de continuar:

- En qué fase estamos y en qué paso de la Skill `nueva-fase`.
- Qué está **verificado** que funciona (con evidencia: `archivo:línea` o salida de
  comando) y qué está solo afirmado.
- Qué bloqueos hay abiertos y quién los desbloquea.
- Qué decisiones ya están tomadas y **no** hay que volver a discutir.
- Cuál es la siguiente acción concreta.

Si algo de lo que dijiste antes en esta sesión contradice `CLAUDE.md`,
`DECISIONS.md` o el estado real del repositorio: **dilo explícitamente y corrígelo**.
No sigas construyendo sobre la versión equivocada.

No escribas código en este turno. Solo re-anclar.
