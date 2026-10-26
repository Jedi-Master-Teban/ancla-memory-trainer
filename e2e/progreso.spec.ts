import { expect, test } from './fixtures';
import { abrir } from './ayudas';

// Bug del operador (2026-10-25): lo que se ve en la racha debía verse también
// en Stats. Ahora son una sola página, «Progreso».
test.describe('Progreso: racha y retención en una sola página', () => {
  test('reúne la racha (con sus 90 días) y la retención', async ({ page }) => {
    await abrir(page, 'estadisticas');
    await expect(page.getByText('Progreso', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('días consecutivos')).toBeVisible();
    await expect(page.getByText('Últimos 90 días')).toBeVisible();
    await expect(page.getByText('Meta diaria', { exact: true })).toBeVisible();
    await expect(page.getByText('Retención', { exact: true })).toBeVisible();
    await expect(page.getByText('Por categoría')).toBeVisible();
  });

  test('la ruta antigua /racha lleva a Progreso', async ({ page }) => {
    await abrir(page, 'racha');
    await expect(page).toHaveURL(/\/estadisticas$/);
    await expect(page.getByText('Últimos 90 días')).toBeVisible();
  });

  test('la píldora de racha de Inicio abre Progreso', async ({ page }) => {
    await abrir(page, '');
    await page.getByRole('button', { name: /^Racha de \d+ días/ }).click();
    await expect(page).toHaveURL(/\/estadisticas$/);
    await expect(page.getByText('días consecutivos')).toBeVisible();
  });

  test('la pestaña de la isla se llama Progreso', async ({ page }) => {
    await abrir(page, 'estadisticas');
    await expect(page.getByRole('tab', { name: 'Progreso' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Stats' })).toHaveCount(0);
  });

  test('los congeladores se despliegan y ofrecen los días recientes sin cumplir', async ({ page }) => {
    await abrir(page, 'estadisticas');
    await page.getByRole('button', { name: /Congelar un día/ }).click();
    await expect(page.getByRole('button', { name: /^Congelar el / }).first()).toBeVisible();
  });
});
