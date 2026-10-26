# Ancla PWA — Guía de despliegue (costo $0)

## Qué es esto

`npm run build:pwa` genera `dist/`: la app completa como sitio estático
instalable (manifest + service worker + íconos). Se publica en GitHub Pages:
`https://jedi-master-teban.github.io/ancla-memory-trainer/`.

## Publicar

```bash
npm run build:pwa                        # genera dist/
scripts/desplegar.sh estable "mensaje"   # sube dist/ a la raíz del sitio
```

No uses `gh-pages -d dist` a secas: borra todo lo que hay en la rama antes de
subir y se llevaría la versión alfa (`alpha/`). `scripts/desplegar.sh` cambia
solo lo de su canal (ADR-039).

## La versión alfa (`/alpha/`)

Una build de prueba, con funciones que aún no están en la app real, publicada
en el mismo sitio pero con sus propios datos:

```bash
npm run build:pwa:alfa                   # genera dist-alfa/
scripts/desplegar.sh alfa "mensaje"      # sube dist-alfa/ a /alpha/
```

- Dirección: `https://jedi-master-teban.github.io/ancla-memory-trainer/alpha/`.
  **Se entra siempre por esa dirección** (la primera vez, una ruta interna de la
  alfa caería en el 404 de la app real; GitHub Pages solo tiene uno por sitio).
  Una vez instalado su service worker, las rutas internas ya funcionan.
- Se instala como una segunda app («Ancla α»), con la insignia **ALFA** junto al
  nombre en Inicio y en la pantalla de arranque.
- **Datos separados.** Mismo origen significa mismo OPFS, IndexedDB y caché, así
  que todo lo que se guarda por nombre tiene el suyo (`src/canal.ts`): base
  `ancla-alfa.db`, copias `ancla-alfa-copias`, caché `ancla-alfa-v1`. La alfa
  empieza vacía; para probar con tus datos, restaura un respaldo desde
  Ajustes → Tus datos.
- **Una a la vez.** expo-sqlite guarda todas las bases en un único grupo de
  archivos de OPFS que bloquea quien lo abre primero. Si la app real está
  abierta (también en segundo plano), la alfa avisa en vez de abrirse: cierra
  una por completo antes de abrir la otra. No se pierde nada
  (`e2e/canales.spec.ts` lo comprueba).
- Cada service worker limpia solo sus cachés (por prefijo) y la app real
  ignora todo lo que cuelga de `/alpha/`.
- La alfa NO se fusiona a `main` hasta que se apruebe: vive en una rama
  (`alpha/vocabulario`), y se despliega desde ella con los comandos de arriba.

## Instalar en el iPhone

1. Abrir la URL en Safari.
2. Compartir → "Agregar a pantalla de inicio".
3. La app abre fullscreen con ícono propio, sin barra de Safari.

## Notas técnicas

- **DB local por origen**: los datos viven en OPFS (SQLite) y las copias
  automáticas en IndexedDB. Cambiar de dominio = empezar con BD vacía. Ver
  ADR-029 para respaldos y recuperación.
- **Una pestaña a la vez**: ver «Una a la vez» arriba; vale también para dos
  pestañas de la misma app.
- **Offline**: tras la primera visita el service worker cachea todo;
  funciona en modo avión. Las actualizaciones se aplican en la primera
  visita con conexión (network-first en navegación).
- **Pruebas**: `npm run test:e2e` construye las dos builds y corre Playwright
  en WebKit y Chromium (ADR-032).
