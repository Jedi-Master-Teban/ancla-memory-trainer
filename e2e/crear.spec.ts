import { expect, test } from './fixtures';
import { abrir } from './ayudas';

// Bug del operador (2026-10-25): el «+» de Listas fallaba con «Error: Falta
// listaId…» y el de Naipes con «Error: Naipe no admite creación…».
test.describe('el botón «+»', () => {
  const mas = (page: import('@playwright/test').Page) =>
    page.getByLabel('Crear nuevo elemento').filter({ visible: true });

  test('en Listas enfoca el nombre de la lista nueva y luego añade objetos a esa lista', async ({ page }) => {
    await abrir(page, 'listas');
    await mas(page).click();
    const campo = page.getByLabel('Nombre de la lista nueva');
    await expect(campo).toBeFocused();

    await campo.fill('Cocina');
    await page.getByText('Crear', { exact: true }).click();
    await expect(page).toHaveURL(/\/listas\/[^/]+$/);

    await mas(page).click();
    await expect(page).toHaveURL(/\/crear\/lista_item\?listaId=/);
    await expect(page.getByText('Error', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Falta listaId', { exact: false })).toHaveCount(0);
  });

  test('en Naipes no hay «+»: son 52 cartas fijas', async ({ page }) => {
    // Control: en Colgadero el «+» sí está (si el selector fallara, esta prueba pasaría siempre).
    await abrir(page, 'colgadero');
    await expect(mas(page)).toHaveCount(1);
    await page.getByRole('tab', { name: 'Inicio' }).click();
    await page.getByRole('button', { name: /^Naipes/ }).click();
    await expect(page).toHaveURL(/\/naipes$/);
    await expect(mas(page)).toHaveCount(0);
  });

  test('un enlace directo a crear un naipe explica por qué no se puede, sin «Error»', async ({ page }) => {
    await abrir(page, 'crear/naipe');
    await expect(page.getByText('Los naipes son 52 cartas fijas', { exact: false })).toBeVisible();
    await expect(page.getByText('Error', { exact: false })).toHaveCount(0);
    await page.getByText('Ir a Naipes').click();
    await expect(page).toHaveURL(/\/naipes$/);
  });
});
