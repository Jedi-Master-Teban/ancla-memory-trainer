import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from './fixtures';
import {
  abrir,
  borrarBaseSQLite,
  contarCopias,
  crearLista,
  leerCompartido,
  simularMenuCompartir,
  sinMenuCompartir,
} from './ayudas';

const esSQLite = (bytes: Buffer) => bytes.subarray(0, 16).toString('latin1') === 'SQLite format 3\u0000';

// ADR-029: los datos del usuario sobreviven a actualizaciones, fallos y a
// cambiar de teléfono (con un respaldo).
test.describe('tus datos', () => {
  test('crear un respaldo lo entrega al menú de compartir (Guardar en Archivos, iCloud…)', async ({ page }) => {
    await simularMenuCompartir(page);
    await crearLista(page, 'Lista del respaldo');
    await abrir(page, 'ajustes');
    await expect(page.getByText('Tus datos', { exact: true })).toBeVisible();
    await expect(page.getByText('Último respaldo: nunca')).toBeVisible();

    await page.getByRole('button', { name: 'Crear respaldo' }).click();
    const { nombre, bytes } = await leerCompartido(page);
    expect(nombre).toMatch(/^ancla-respaldo-\d{4}-\d{2}-\d{2}\.db$/);
    expect(esSQLite(bytes)).toBe(true);
    // La lista viaja dentro del archivo: su nombre está en las páginas de la base.
    expect(bytes.includes(Buffer.from('Lista del respaldo'))).toBe(true);
    await expect(page.getByText(/Último respaldo: hoy a las \d{2}:\d{2}/)).toBeVisible();
  });

  test('sin menú de compartir, el respaldo se descarga', async ({ page }) => {
    await sinMenuCompartir(page);
    await abrir(page, 'ajustes');
    const [descarga] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Crear respaldo' }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(/^ancla-respaldo-.*\.db$/);
    expect(esSQLite(readFileSync(await descarga.path()))).toBe(true);
    const aviso = page.getByRole('alertdialog');
    await expect(aviso.getByText('Respaldo descargado')).toBeVisible();
    await aviso.getByRole('button', { name: 'Entendido' }).click();
    await expect(page.getByText(/Último respaldo: hoy a las \d{2}:\d{2}/)).toBeVisible();
  });

  test('eliminar una lista pide confirmación en la ventana propia, y Cancelar no borra nada', async ({ page }) => {
    await crearLista(page, 'Lista para borrar');
    await page.getByText('Eliminar lista').click();

    const dialogo = page.getByRole('alertdialog');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText('¿Eliminar "Lista para borrar"?', { exact: false })).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toHaveCount(0);
    await expect(page).toHaveURL(/\/listas\/[^/]+$/);

    await page.getByText('Eliminar lista').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page).toHaveURL(/\/listas$/);
    // Solo lo visible: la pila de navegación conserva ocultas las pantallas anteriores.
    await expect(page.getByText('Lista para borrar').filter({ visible: true })).toHaveCount(0);
  });

  test('restaurar un respaldo devuelve lo que se había borrado', async ({ page }, info) => {
    await simularMenuCompartir(page);
    await crearLista(page, 'Mercado del sábado');
    await abrir(page, 'ajustes');
    await page.getByRole('button', { name: 'Crear respaldo' }).click();
    const archivo = info.outputPath('respaldo.db');
    writeFileSync(archivo, (await leerCompartido(page)).bytes);

    await abrir(page, 'listas');
    await page.getByText('Mercado del sábado').click();
    await page.getByText('Eliminar lista').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByText('Todavía no hay listas.', { exact: false })).toBeVisible();

    await abrir(page, 'ajustes');
    const [selector] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Restaurar desde un archivo' }).click(),
    ]);
    await selector.setFiles(archivo);
    const confirmacion = page.getByRole('alertdialog');
    await expect(confirmacion.getByText('Restaurar estos datos')).toBeVisible();
    await expect(confirmacion.getByText('1 lista', { exact: false })).toBeVisible();
    await confirmacion.getByRole('button', { name: 'Restaurar', exact: true }).click();

    await expect(page.getByRole('alertdialog').getByText('Datos restaurados')).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await abrir(page, 'listas');
    await expect(page.getByText('Mercado del sábado')).toBeVisible();
  });

  test('un archivo que no es un respaldo se rechaza sin tocar nada', async ({ page }, info) => {
    await crearLista(page, 'Lista intacta');
    await abrir(page, 'ajustes');
    const falso = info.outputPath('no-es-un-respaldo.db');
    writeFileSync(falso, 'esto no es una base de datos');
    const [selector] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Restaurar desde un archivo' }).click(),
    ]);
    await selector.setFiles(falso);
    const aviso = page.getByRole('alertdialog');
    await expect(aviso.getByText('No se puede restaurar')).toBeVisible();
    await expect(aviso.getByText('Ese archivo no es un respaldo de Ancla.')).toBeVisible();
    await aviso.getByRole('button', { name: 'Entendido' }).click();

    await abrir(page, 'listas');
    await expect(page.getByText('Lista intacta')).toBeVisible();
  });

  test('si la base aparece vacía, ofrece recuperar la copia automática', async ({ page }) => {
    await crearLista(page, 'Lista que no debe perderse');
    // Al arrancar con progreso, la app hace su copia del día.
    await abrir(page, '');
    await expect.poll(() => contarCopias(page), { timeout: 15_000 }).toBeGreaterThan(0);

    await borrarBaseSQLite(page);

    await page.goto('');
    await expect(page.getByText('Encontré una copia de tus datos')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('1 lista', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Recuperar mis datos' }).click();

    await expect(page.getByText('Encontré una copia de tus datos')).toHaveCount(0, { timeout: 45_000 });
    await abrir(page, 'listas');
    await expect(page.getByText('Lista que no debe perderse')).toBeVisible();
  });

  test('empezar de cero no vuelve a preguntar por esa copia', async ({ page }) => {
    await crearLista(page, 'Lista vieja');
    await abrir(page, '');
    await expect.poll(() => contarCopias(page), { timeout: 15_000 }).toBeGreaterThan(0);
    await borrarBaseSQLite(page);

    await page.goto('');
    await page.getByRole('button', { name: 'Empezar de cero' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Empezar de cero' }).click();
    await expect(page.getByText('Colgadero').first()).toBeVisible();

    await abrir(page, '');
    await expect(page.getByText('Encontré una copia de tus datos')).toHaveCount(0);
  });
});
