import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Cada prueba abre un perfil PERSISTENTE en una carpeta temporal, no el perfil
 * efímero por defecto de Playwright.
 *
 * En WebKit, el perfil efímero se comporta como la navegación privada de
 * Safari: `navigator.storage.getDirectory()` falla con «UnknownError… transient
 * reason» y la base SQLite no abre (comprobado el 2026-09-28). Una app
 * instalada en la pantalla de inicio tiene almacenamiento de verdad, así que el
 * perfil persistente es el que se parece al iPhone del usuario.
 */
export const test = base.extend<{ context: BrowserContext; page: Page }>({
  context: async (
    { playwright, browserName, baseURL, viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, locale },
    use,
  ) => {
    const carpeta = mkdtempSync(join(tmpdir(), 'ancla-e2e-'));
    const contexto = await playwright[browserName].launchPersistentContext(carpeta, {
      baseURL,
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      locale,
      acceptDownloads: true,
    });
    await use(contexto);
    await contexto.close();
    rmSync(carpeta, { recursive: true, force: true });
  },
  page: async ({ context }, use) => {
    const pagina = context.pages()[0] ?? (await context.newPage());
    await limpiarOrigen(pagina);
    await use(pagina);
  },
});

/**
 * Borra todo lo que el origen guarda: la base (OPFS), las copias (IndexedDB),
 * el service worker y sus cachés. En WebKit, los perfiles persistentes
 * comparten el almacenamiento aunque cada uno tenga su carpeta (una prueba vio
 * las listas de las anteriores), así que no basta con abrir un perfil nuevo.
 * Se hace desde la raíz del servidor, fuera de la app: nadie tiene la base abierta.
 */
async function limpiarOrigen(pagina: Page): Promise<void> {
  await pagina.goto('http://localhost:4173/');
  await pagina.evaluate(async () => {
    const raiz = await navigator.storage.getDirectory();
    const nombres: string[] = [];
    // @ts-expect-error — `keys()` existe en FileSystemDirectoryHandle (WebKit y Chromium).
    for await (const nombre of raiz.keys()) nombres.push(nombre);
    for (const nombre of nombres) await raiz.removeEntry(nombre, { recursive: true });
    await new Promise<void>((resolver) => {
      const peticion = indexedDB.deleteDatabase('ancla-copias');
      peticion.onsuccess = peticion.onerror = peticion.onblocked = () => resolver();
    });
    for (const registro of await navigator.serviceWorker.getRegistrations()) await registro.unregister();
    for (const clave of await caches.keys()) await caches.delete(clave);
    localStorage.clear();
  });
}

export { expect };
