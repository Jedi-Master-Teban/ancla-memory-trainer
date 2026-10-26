import { existsSync } from 'node:fs';
import { expect, test } from './fixtures';
import { abrir, crearLista } from './ayudas';

// ADR-039: la versión alfa se publica en /alpha/, en el MISMO origen que la app
// real, y no puede tocar sus datos. Estas pruebas necesitan los dos builds
// (`npm run test:e2e` los construye).
test.skip(!existsSync('dist-alfa/index.html'), 'falta dist-alfa: corre npm run build:pwa:alfa');

test.describe('la alfa y la app real en el mismo origen', () => {
  test('cada una tiene sus propios datos', async ({ page }) => {
    await crearLista(page, 'Real');

    // Se entra por /alpha/: una ruta interna de la alfa abierta DE PRIMERAS cae
    // en el 404 de la app real (GitHub Pages solo tiene un 404.html por sitio);
    // una vez instalado su service worker, las rutas internas ya funcionan.
    await abrir(page, 'alpha/');
    await expect(page.locator('html')).toHaveAttribute('data-canal', 'alfa');
    await page.getByRole('button', { name: /^Listas:/ }).click();
    await expect(page).toHaveURL(/\/alpha\/listas$/);
    await expect(page.getByText('Real', { exact: true })).toHaveCount(0);
    await page.getByPlaceholder('Nombre de la lista nueva...').fill('Prueba');
    await page.getByText('Crear', { exact: true }).click();
    await expect(page).toHaveURL(/\/alpha\/listas\/[^/]+$/);

    await abrir(page, 'listas');
    await expect(page.locator('html')).not.toHaveAttribute('data-canal', 'alfa');
    await expect(page.getByText('Real', { exact: true })).toBeVisible();
    await expect(page.getByText('Prueba', { exact: true })).toHaveCount(0);
  });

  test('la alfa se reconoce: insignia en Inicio y nombre propio', async ({ page }) => {
    await abrir(page, 'alpha/');
    await expect(page.getByText('ALFA', { exact: true })).toBeVisible();
    const manifiesto = await page.evaluate(async () => {
      const enlace = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      return (await fetch(enlace!.href)).json();
    });
    expect(manifiesto).toMatchObject({ short_name: 'Ancla α', scope: '/ancla-memory-trainer/alpha/' });
    expect(manifiesto.start_url).toBe('/ancla-memory-trainer/alpha/');
  });

  test('un service worker no borra las cachés del otro', async ({ page }) => {
    // Primero la alfa, luego la app real: al activarse, el de la real borraba
    // TODA caché que no fuera la suya.
    await abrir(page, 'alpha/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await abrir(page, '');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(1000);
    const claves = await page.evaluate(() => caches.keys());
    expect(claves).toContain('ancla-alfa-v1');
    expect(claves.some((c) => /^ancla-v\d+$/.test(c))).toBe(true);
  });

  test('la app real no atiende las páginas de la alfa', async ({ page }) => {
    // Con el service worker de la app real ya activo, abrir la alfa debe dar la alfa.
    await abrir(page, '');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await abrir(page, 'alpha/');
    await expect(page.locator('html')).toHaveAttribute('data-canal', 'alfa');
    await expect(page.getByText('ALFA', { exact: true })).toBeVisible();
  });

  // Limitación conocida, no un error: expo-sqlite guarda todas las bases en UN
  // grupo de archivos de OPFS que bloquea quien lo abre primero. Los datos no
  // se mezclan, pero las dos no pueden estar abiertas a la vez.
  test('abiertas a la vez, la segunda avisa en vez de arriesgar los datos', async ({ page, context }) => {
    await abrir(page, '');
    const otra = await context.newPage();
    await otra.goto('alpha/');
    await expect(otra.locator('#ancla-arranque')).toHaveAttribute('data-estado', 'error', { timeout: 45_000 });
    await otra.close();
    // La primera sigue sana.
    await expect(page.getByText('Colgadero').first()).toBeVisible();
  });
});
