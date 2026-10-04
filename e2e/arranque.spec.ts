import { test as testEfimero } from '@playwright/test';
import { expect, test } from './fixtures';
import { abrir, esperarApp, registrarErrores } from './ayudas';

// ADR-030: la pantalla de arranque sustituye a la pantalla en blanco.
test.describe('pantalla de arranque', () => {
  test('viene en el HTML inicial y se retira cuando la app está lista', async ({ page, request }) => {
    const html = await (await request.get('')).text();
    expect(html).toContain('id="ancla-arranque"');
    expect(html).toContain('<html lang="es-CO">');
    expect(html).toContain('data-mascota="memo"'); // ADR-033

    const errores = registrarErrores(page);
    await abrir(page, '');
    await expect(page.getByText('Colgadero').first()).toBeVisible();
    expect(errores).toEqual([]);
  });

  // ADR-036: dura ~3 s y las tarjetas se llenan de izquierda a derecha, a la vista.
  test('dura unos 3 s y llena las tarjetas de izquierda a derecha', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __ANCLA_ARRANQUE_MS__: number }).__ANCLA_ARRANQUE_MS__ = 2750;
    });
    const antes = Date.now();
    await page.goto('', { waitUntil: 'commit' });
    const pantalla = page.locator('#ancla-arranque');
    await expect(pantalla).toBeVisible();

    await page.waitForTimeout(1500);
    const llenado = await pantalla.locator('.aa-tarjetas i').evaluateAll((piezas) =>
      piezas.map((p) => Number((p as HTMLElement).style.getPropertyValue('--aa-f') || 0)),
    );
    expect(llenado[0]).toBe(1); // las de la izquierda, llenas
    expect(llenado[llenado.length - 1]).toBe(0); // las de la derecha, vacías
    expect(llenado.some((f) => f > 0 && f < 1)).toBe(true); // una se está llenando
    expect([...llenado].sort((a, b) => b - a)).toEqual(llenado); // siempre de izquierda a derecha

    await expect(pantalla).toHaveCount(0, { timeout: 45_000 });
    expect(Date.now() - antes).toBeGreaterThanOrEqual(3000);
  });

  test('si el JavaScript de la app no llega, muestra el error con Reintentar', async ({ page }) => {
    const bundle = /\/_expo\/static\/js\/web\/entry-[^/]+\.js$/;
    await page.route(bundle, (ruta) => ruta.abort());
    await page.goto('');

    const pantalla = page.locator('#ancla-arranque');
    await expect(pantalla).toHaveAttribute('data-estado', 'error');
    await expect(pantalla.getByText('Algo no cargó bien')).toBeVisible();
    await expect(pantalla.getByText('Tus datos siguen guardados en este teléfono.', { exact: false })).toBeVisible();
    // Memo, alarmado: el cuadro de la trompa en alto y la «!» encendida.
    await expect(pantalla.locator('.aa-c-error')).toBeVisible();
    await expect(pantalla.locator('.aa-c-quieto')).toBeHidden();
    await expect(pantalla.locator('.aa-senal')).toHaveCSS('opacity', '1');

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
