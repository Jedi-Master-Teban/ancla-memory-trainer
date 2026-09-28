import { test as testEfimero } from '@playwright/test';
import { expect, test } from './fixtures';
import { abrir, esperarApp, registrarErrores } from './ayudas';

// ADR-030: la pantalla de arranque sustituye a la pantalla en blanco.
test.describe('pantalla de arranque', () => {
  test('viene en el HTML inicial y se retira cuando la app está lista', async ({ page, request }) => {
    const html = await (await request.get('')).text();
    expect(html).toContain('id="ancla-arranque"');
    expect(html).toContain('<html lang="es-CO">');

    const errores = registrarErrores(page);
    await abrir(page, '');
    await expect(page.getByText('Colgadero').first()).toBeVisible();
    expect(errores).toEqual([]);
  });

  test('si el JavaScript de la app no llega, muestra el error con Reintentar', async ({ page }) => {
    const bundle = /\/_expo\/static\/js\/web\/entry-[^/]+\.js$/;
    await page.route(bundle, (ruta) => ruta.abort());
    await page.goto('');

    const pantalla = page.locator('#ancla-arranque');
    await expect(pantalla).toHaveAttribute('data-estado', 'error');
    await expect(pantalla.getByText('Algo no cargó bien')).toBeVisible();
    await expect(pantalla.getByText('Tus datos siguen guardados en este teléfono.', { exact: false })).toBeVisible();

    await pantalla.getByRole('button', { name: 'Ver detalles' }).click();
    await expect(pantalla.locator('.aa-detalle-texto')).toContainText('entry-');

    await page.unroute(bundle);
    await pantalla.getByRole('button', { name: 'Reintentar' }).click();
    await esperarApp(page);
    await expect(page.getByText('Colgadero').first()).toBeVisible();
  });

  test('una ruta interna abierta directamente carga la app, no el 404 de GitHub', async ({ page }) => {
    await abrir(page, 'hojear/colgadero');
    await expect(page.getByRole('button', { name: 'Cerrar' })).toBeVisible();
  });

  // El perfil efímero de WebKit es como la navegación privada de Safari: no
  // hay almacenamiento. El usuario tiene que saber qué hacer, no ver un error
  // genérico ni una pantalla en blanco.
  testEfimero('en navegación privada de Safari explica qué hacer', async ({ page, browserName }) => {
    testEfimero.skip(browserName !== 'webkit', 'Solo Safari niega el almacenamiento en privado');
    await page.goto('');
    const pantalla = page.locator('#ancla-arranque');
    await expect(pantalla).toHaveAttribute('data-estado', 'error');
    await expect(pantalla.getByText('Safari no dejó guardar tus datos')).toBeVisible();
    await expect(pantalla.getByText('navegación privada', { exact: false })).toBeVisible();
  });
});
