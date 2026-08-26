---
description: Corre la checklist de verificación obligatoria (§4.2) sobre el estado actual del código
---

Invoca la Skill `verificacion` y ejecútala completa sobre el estado actual del
código.

Responde los **6 puntos por separado y en orden**, cada uno con su evidencia real:
salida de comando o referencia `archivo:línea`. Si uno no aplica, escribe
**"N/A — [razón]"**. No agrupes puntos y no respondas "todo bien".

Incluye las dos comprobaciones mecánicas de convenciones del punto 4 (SQL fuera de
`src/db/`, y React o `expo-*` dentro de `src/domain/`). Ambas deben salir vacías.

Termina con uno de los tres veredictos literales de la Skill:

- **VERIFICACIÓN COMPLETA**
- **VERIFICACIÓN PARCIAL**
- **VERIFICACIÓN REPROBADA**

No hagas commit si el veredicto no es COMPLETA, salvo que yo lo autorice
explícitamente.
