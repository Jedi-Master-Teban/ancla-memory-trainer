/* Ancla PWA — Service Worker
 * Estrategia: precache del app shell + cache-first para assets estáticos,
 * network-first para navegación (para que las actualizaciones lleguen).
 */
const CACHE = 'ancla-v8';
const PRECACHE = ['./', './index.html'];

/**
 * Todas las peticiones de red de este SW van con `cache: 'no-store'`.
 *
 * Sin eso, "network-first" no era network-first: GitHub Pages sirve
 * `index.html` con `cache-control: max-age=600`, así que un `fetch()` normal
 * devolvía la copia de la caché HTTP del navegador durante 10 minutos tras cada
 * despliegue. Ese index viejo apunta al bundle viejo — cuyo nombre lleva hash y
 * por tanto YA NO EXISTE en el servidor — y la app arrancaba en blanco con el
 * banner "fallo al cargar entry-….js". Reproducido en el navegador el
 * 2026-09-10, en pestaña nueva y sin service worker registrado.
 */
function traerDeRed(req) {
  return fetch(req, { cache: 'no-store' });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => traerDeRed(u).then((res) => c.put(u, res)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navegación: SIEMPRE la página principal, de la red y sin caché; la copia
  // guardada solo sin conexión (ADR-030).
  //
  // Es una app de una sola página: su enrutador lee la ruta de la URL, así que
  // cualquier dirección se sirve con el mismo index.html. Antes se pedía la
  // dirección tal cual. En una ruta interna (/…/hojear/colgadero) GitHub Pages
  // responde 404 y el service worker caía a la copia guardada de index.html
  // — que, tras una actualización, apuntaba a un bundle ya borrado del
  // servidor: pantalla en blanco. Reproducido el 2026-09-27.
  // Solo para rutas de la app (sin extensión): abrir manifest.json o un ícono
  // directamente sigue devolviendo ese archivo.
  const esRutaDeApp = !/\.[a-z0-9]+$/i.test(new URL(req.url).pathname);
  if (req.mode === 'navigate' && esRutaDeApp) {
    event.respondWith(
      traerDeRed('./')
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
            return res;
          }
          return caches.match('./index.html').then((hit) => hit || res);
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      traerDeRed(req).then((res) => {
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
