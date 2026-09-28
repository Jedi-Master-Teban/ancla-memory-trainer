import { expect, test } from './fixtures';
import { metaDeUnaTarjeta, repasarUnaTarjeta } from './ayudas';

// ADR-035: salir del resumen de una sesión vuelve al Inicio que ya estaba en la
// pila (`router.dismissTo`), no apila otro encima. Con `router.replace('/')`
// cada sesión dejaba un Inicio más montado, invisible, debajo del de arriba.
test.describe('volver al terminar una sesión', () => {
  test('dos sesiones seguidas dejan un solo Inicio, con sus datos al día', async ({ page }) => {
    await metaDeUnaTarjeta(page);

    for (const tarjetasHoy of [1, 2]) {
      await repasarUnaTarjeta(page);
      await page.getByText('Volver al inicio').click();
      // Es el mismo Inicio de antes: tiene que recargar sus datos al volver a enfocarse.
      await expect(page.getByRole('progressbar', { name: `${tarjetasHoy} de 1 tarjetas hoy`, exact: true })).toBeVisible();
    }

    // En todo el DOM, no solo lo visible: un Inicio apilado debajo también cuenta.
    await expect(page.getByText('Practicar ahora')).toHaveCount(1);

    // El gesto de volver no reabre la sesión terminada: salta a lo que había
    // antes de Inicio (Ajustes, de donde salió la prueba).
    await page.goBack();
    await expect(page).toHaveURL(/\/ajustes$/);
    await expect(page.getByRole('button', { name: 'Ver respuesta', includeHidden: true })).toHaveCount(0);
  });

  test('«Ver mi racha» y su flecha de volver regresan al mismo Inicio', async ({ page }) => {
    await metaDeUnaTarjeta(page);
    await repasarUnaTarjeta(page);

    await page.getByText('Ver mi racha').click();
    await expect(page).toHaveURL(/\/racha$/);
    await page.getByRole('button', { name: 'Volver', exact: true }).click();

    await expect(page.getByRole('progressbar', { name: '1 de 1 tarjetas hoy', exact: true })).toBeVisible();
    await expect(page.getByText('Practicar ahora')).toHaveCount(1);
  });
});
