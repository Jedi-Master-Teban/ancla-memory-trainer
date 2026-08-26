# Registro de Versiones — Ancla

Hitos del proyecto. Cada versión tiene un tag de git al que siempre se puede
volver (`git checkout <tag>`).

---

## v1.0-web · 2026-08-26 · tag `v1.0-web`

**"El punto de partida envidiable"** — primera versión web pública, instalable
como PWA y desplegada con costo $0.

### Qué incluye

- **App web completa (PWA):** manifest, service worker (offline tras la primera
  visita), íconos propios, instalación a pantalla de inicio.
- **Despliegue público:** https://jedi-master-teban.github.io/ancla-memory-trainer/
  vía GitHub Pages (rama `gh-pages`), HTTPS incluido, $0/mes.
- **Base de datos 100 % local por dispositivo:** cada persona que instala la app
  empieza con la versión inicial (100 colgaderos + 52 naipes sembrados) y su
  progreso, racha, listas y números se guardan solo en SU dispositivo. Nadie ve
  los datos de nadie; no hay servidor ni cuentas.
- **Flujo de build:** `npm run build:pwa` → `npx gh-pages -d dist -t`.
- **Créditos** a Harry Lorayne (& Jerry Lucas) y FSRS/open-spaced-repetition en
  el README.
- **Banner de diagnóstico:** franja inferior que muestra errores en pantalla si
  el JS falla (en vez de pantalla blanca silenciosa); se oculta sola cuando la
  app carga.

### Contenido funcional heredado (Fases 0–7 + parcial 8)

Colgadero, Naipes, Listas Encadenadas, Números Importantes (con descomposición
fonética automática), Racha estilo Duolingo, Panel de Retención, Ejercicios
Personalizados, Dashboard. Tema dual Arcade/Papel con selector. 369 tests
Jest pasando.

### Limitaciones conocidas documentadas

| Tema | Estado |
|---|---|
| Safari iOS | Pantalla blanca: el JS no ejecuta aunque Chrome-iOS funciona. Banner de diagnóstico activo para capturar el error. Pendiente investigar. |
| `Alert.alert` en web | No-op en react-native-web: el botón ✕ de eliminar número no confirma ni elimina en navegador. |
| Una pestaña a la vez | expo-sqlite web usa OPFS exclusivo; dos pestañas simultáneas = segunda en blanco. |
| Datos locales | Sin respaldo: borrar datos de navegación o desinstalar borra el progreso. |

### Próximo camino acordado

1. **Pulido visual premium** — primero tema Arcade Neón, luego Papel y Tinta,
   después temas nuevos con igual refinamiento ("que dé envidia hasta al búho
   Duo").
2. **Nuevos módulos de contenido** (requieren fase de investigación primero):
   guías de fonética, "ojos de la imaginación" de Lorayne, retos avanzados
   (100 decimales de π, memorizar poemas completos, escalas geológicas y sus
   eras).
3. **Fix Safari iOS.**

---

## Convención para futuras versiones

- Tag de git: `v<mayor>.<menor>-<alcance>` (ej. `v1.1-web`, `v2.0-web`).
- Cada entrada: fecha, qué incluye, limitaciones conocidas, siguiente camino.
- El deploy estable vive en la rama `gh-pages`; el código en `main`.
