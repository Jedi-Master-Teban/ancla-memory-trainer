import { type Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { abrir, metaDeUnaTarjeta, repasarUnaTarjeta } from './ayudas';

// ADR-033: Memo vive junto al nombre de la app en Inicio y al final de las
// sesiones. Duerme mientras no hay racha; la sesión que cumple la meta del día
// lo despierta y lo hace celebrar. Nunca aparece durante un repaso ni al hojear.

/** Solo el Memo que se ve: Inicio sigue montado debajo de las otras pantallas. */
function memoVisible(page: Page) {
  return page.getByRole('img', { name: /^Memo/ }).filter({ visible: true });
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
