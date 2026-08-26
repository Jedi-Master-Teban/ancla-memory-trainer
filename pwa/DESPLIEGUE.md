# Ancla PWA — Guía de despliegue (costo $0)

## Qué es esto

`npm run build:pwa` genera `dist/`: la app completa como sitio estático
instalable (manifest + service worker + íconos). Solo falta subirlo a un
hosting estático gratuito con HTTPS.

## Opción recomendada: Cloudflare Pages

1. `npx wrangler login`
2. Desde la raíz del proyecto:
   ```
   npx wrangler pages deploy dist --project-name ancla-memory-trainer
   ```
3. Listo: `https://ancla-memory-trainer.pages.dev` con HTTPS automático.
4. Para actualizar: repetir el paso 2 tras cada `npm run build:pwa`.

Alternativa sin cuenta extra: GitHub Pages (`gh-pages -d dist`) o
Netlify Drop (arrastrar la carpeta `dist/` a app.netlify.com/drop).

## Instalar en el iPhone

1. Abrir la URL en Safari.
2. Compartir → "Agregar a pantalla de inicio".
3. La app abre fullscreen con ícono propio, sin barra de Safari.

## Notas técnicas

- **DB local por origen**: los datos viven en IndexedDB del navegador.
  Cambiar de dominio = empezar con BD vacía. Elegir el dominio definitivo
  antes de empezar a usarla en serio.
- **Una pestaña a la vez**: expo-sqlite en web usa OPFS con acceso
  exclusivo; dos pestañas abiertas al mismo tiempo hacen que la segunda
  se quede en blanco. En iPhone (una app, una pestaña) no ocurre.
- **Offline**: tras la primera visita el service worker cachea todo;
  funciona en modo avión. Las actualizaciones se aplican en la primera
  visita con conexión (network-first en navegación).
- **Alert.alert no funciona en web** (limitación conocida de
  react-native-web): el botón ✕ de eliminar número no muestra la
  confirmación y no elimina. Pendiente: reemplazar por un modal in-app
  o `window.confirm` bajo `Platform.OS === 'web'`.
