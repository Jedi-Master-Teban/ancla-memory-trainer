import { type Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { abrir } from './ayudas';

// ADR-033: Memo vive junto al nombre de la app en Inicio y al final de las
// sesiones. Duerme mientras no hay racha; la sesión que cumple la meta del día
// lo despierta y lo hace celebrar. Nunca aparece durante un repaso ni al hojear.

/**
 * Solo el Memo que se ve: Inicio sigue montado debajo de las otras pantallas,
 * y «Volver al inicio» (`router.replace('/')`) apila otro Inicio encima.
 */
function memoVisible(page: Page) {
  return page.getByRole('img', { name: /^Memo/ }).filter({ visible: true });
}

/** Meta de una tarjeta: la sesión mixta trae entonces una sola, y la cumple. */
async function metaDeUnaTarjeta(page: Page): Promise<void> {
  await abrir(page, 'ajustes');
  await page.getByLabel('Meta diaria').fill('1');
  await page.getByText('Guardar configuración').click();
  // Navegación dentro de la app: recargar podría cortar la escritura en curso.
  // Las consultas de Inicio van a la cola del mismo worker, detrás del UPDATE.
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await expect(page.getByText('de 1', { exact: true })).toBeVisible(); // el anillo de la meta
}

async function repasarUnaTarjeta(page: Page): Promise<void> {
  await page.getByText('Practicar ahora').filter({ visible: true }).click();
  await page.getByRole('button', { name: 'Ver respuesta' }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: /^Bien/ }).click();
  await expect(page).toHaveURL(/\/resumen-sesion/);
}

test.describe('Memo, la mascota', () => {
  test('sin racha duerme junto al nombre de la app', async ({ page }) => {
    await abrir(page, '');
    await expect(page.getByRole('img', { name: 'Memo está dormido. Despierta cuando cumples la meta del día.' })).toBeVisible();
    await expect(page.getByText('Ancla', { exact: true }).first()).toBeVisible();
  });

  test('la sesión que cumple la meta lo despierta y celebra; la siguiente ya no', async ({ page }) => {
    await metaDeUnaTarjeta(page);

    await page.getByText('Practicar ahora').filter({ visible: true }).click();
    await expect(page.getByRole('button', { name: 'Ver respuesta' })).toBeVisible({ timeout: 15_000 });
    await expect(memoVisible(page)).toHaveCount(0); // durante el repaso, no
    await page.getByRole('button', { name: 'Ver respuesta' }).click();
    await page.getByRole('button', { name: /^Bien/ }).click();
    await expect(page).toHaveURL(/\/resumen-sesion/);
    await expect(memoVisible(page)).toHaveAccessibleName('Memo despierta y celebra: empezaste una racha.');

    await page.getByText('Volver al inicio').click();
    await expect(memoVisible(page)).toHaveAccessibleName('Memo está despierto.');

    // Misma meta, ya cumplida: esta sesión no la cruza y Memo no celebra otra vez.
    await repasarUnaTarjeta(page);
    await expect(memoVisible(page)).toHaveAccessibleName('Memo está despierto.');
  });

  test('no aparece al hojear', async ({ page }) => {
    await abrir(page, 'hojear/colgadero');
    await expect(page.getByRole('button', { name: 'Cerrar' })).toBeVisible();
    await expect(memoVisible(page)).toHaveCount(0);
  });
});
