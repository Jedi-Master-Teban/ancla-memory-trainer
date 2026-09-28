import { expect, test } from './fixtures';
import { abrir } from './ayudas';

// ADR-031: la Guía enseña las técnicas con las reglas y las palabras reales de
// la app, y cada categoría enlaza a su capítulo.
test.describe('guía de técnicas', () => {
  test('desde Inicio se abre la guía con sus seis capítulos', async ({ page }) => {
    await abrir(page, '');
    await page.getByRole('button', { name: 'Guía de técnicas' }).click();
    await expect(page).toHaveURL(/\/guia$/);
    for (const titulo of [
      'Cómo aprende tu memoria',
      'El alfabeto fonético',
      'El colgadero',
      'Naipes',
      'Listas encadenadas',
      'Números importantes',
    ]) {
      await expect(page.getByRole('button', { name: new RegExp(`Capítulo \\d: ${titulo}`) })).toBeVisible();
    }
  });

  test('el ejercicio de calificar recorre las cuatro situaciones', async ({ page }) => {
    await abrir(page, 'guia/fundamentos');
    const respuestas = ['Otra vez', 'Difícil', 'Bien', 'Fácil'];
    for (const [i, nota] of respuestas.entries()) {
      await expect(page.getByText(`Situación ${i + 1} de 4`)).toBeVisible();
      await page.getByRole('button', { name: nota, exact: true }).click();
      await expect(page.getByText('✓ Eso es')).toBeVisible();
      await page.getByRole('button', { name: i < 3 ? 'Siguiente situación' : 'Ver resultado' }).click();
    }
    await expect(page.getByText('4 de 4')).toBeVisible();
  });

  test('el alfabeto trae la tabla y decodifica cualquier palabra', async ({ page }) => {
    await abrir(page, 'guia/alfabeto');
    await expect(page.getByText('La T tiene un palo vertical')).toBeVisible();
    await expect(page.getByText('= 18', { exact: true })).toBeVisible(); // «Techo», el ejemplo inicial
    await page.getByLabel('Palabra para decodificar').fill('Guerra');
    await expect(page.getByText('= 80', { exact: true })).toBeVisible();
    await page.getByLabel('Palabra para decodificar').fill('R2D2');
    await expect(page.getByText('Esa palabra tiene letras que el alfabeto fonético no usa', { exact: false })).toBeVisible();
  });

  test('desde el colgadero se llega a su capítulo, que pregunta con las palabras del usuario', async ({ page }) => {
    await abrir(page, 'colgadero');
    await page.getByRole('button', { name: 'Guía: Colgadero' }).click();
    await expect(page).toHaveURL(/\/guia\/colgadero$/);
    await expect(page.getByRole('heading', { name: 'El colgadero' })).toBeVisible();
    await expect(page.getByText('Piensa la palabra del')).toBeVisible();
    await page.getByRole('button', { name: 'Ver la palabra' }).click();
    await expect(page.getByRole('button', { name: 'Ver la palabra' })).toHaveCount(0);
  });

  test('la cadena se estudia y luego se comprueba', async ({ page }) => {
    await abrir(page, 'guia/cadena');
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Ya la imaginé' }).click();
    await page.getByRole('button', { name: 'Comprobar la cadena' }).click();
    const lista = ['Paraguas', 'Piña', 'Trompeta', 'Gato', 'Reloj'];
    for (let i = 0; i < 4; i++) {
      await expect(page.getByText(`¿Qué venía después de «${lista[i]}»?`)).toBeVisible();
      await page.getByRole('button', { name: lista[i + 1], exact: true }).click();
      await page.getByRole('button', { name: i < 3 ? 'Siguiente' : 'Ver resultado', exact: true }).click();
    }
    await expect(page.getByText('4 de 4 eslabones')).toBeVisible();
  });

  test('números parte el número con el colgadero de la app', async ({ page }) => {
    await abrir(page, 'guia/numeros');
    // 3141 → 31 · 41 → Mito · Codo, las palabras de la semilla.
    await expect(page.getByText('Mito', { exact: true })).toBeVisible();
    await expect(page.getByText('Codo', { exact: true })).toBeVisible();
    await page.getByLabel('Número para convertir en palabras').fill('37');
    await expect(page.getByText('Mufa', { exact: true })).toBeVisible();
  });

  test('naipes muestra la regla de la carta y la palabra del usuario', async ({ page }) => {
    await abrir(page, 'guia/naipes');
    await expect(page.getByText('D… + sonido Ch/G')).toBeVisible(); // 8♦, la carta inicial
    await page.getByRole('button', { name: 'Espadas' }).click();
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await expect(page.getByText('E… + sonido T/D')).toBeVisible();
  });
});
