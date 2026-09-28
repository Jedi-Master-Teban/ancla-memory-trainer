import { expect, test } from './fixtures';
import { abrir, crearLista, prepararVersionNueva, servir } from './ayudas';

// ADR-029 y ADR-030: una actualización no puede dejar la app en blanco ni
// perder datos. El escenario es el que se vio en GitHub Pages el 2026-09-27:
// despliegue nuevo (el bundle viejo ya no existe) y la app abierta
// directamente en una ruta interna.
test.describe('actualizaciones', () => {
  test.afterEach(async () => {
    await servir('dist');
  });

  test('tras un despliegue, una ruta interna carga la versión nueva y los datos siguen ahí', async ({ page }) => {
    await crearLista(page, 'Antes de actualizar');
    await abrir(page, '');
    // El service worker ya controla la app: él atiende la próxima navegación.
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

    const nueva = prepararVersionNueva();
    await servir(nueva.carpeta);

    await abrir(page, 'hojear/colgadero');
    await expect(page.getByRole('button', { name: 'Cerrar' })).toBeVisible();
    const bundle = await page.evaluate(
      () => Array.from(document.scripts).map((s) => s.src).find((s) => s.includes('/entry-')) ?? '',
    );
    expect(bundle).toContain(nueva.bundle);

    await abrir(page, 'listas');
    await expect(page.getByText('Antes de actualizar')).toBeVisible();
  });

  test('sin conexión, la app abre con lo que tiene guardado', async ({ page, context, browserName }) => {
    // Con la red cortada, Playwright no deja que el service worker de WebKit
    // atienda la navegación: `page.goto` falla con «WebKit encountered an
    // internal error» antes de llegar a él. Es su emulación, no la app; en
    // Chromium la misma prueba pasa.
    test.skip(browserName === 'webkit', 'Playwright no emula sin conexión con service worker en WebKit');
    await crearLista(page, 'Para leer en el avión');
    await abrir(page, '');
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    // Una segunda carga completa llena la caché con todo lo que la app pide.
    await abrir(page, 'listas');

    await context.setOffline(true);
    try {
      await abrir(page, 'listas');
      await expect(page.getByText('Para leer en el avión')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
