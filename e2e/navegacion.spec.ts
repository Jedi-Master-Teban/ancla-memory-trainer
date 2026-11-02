import { expect, test } from './fixtures';
import { abrir, metaDeUnaTarjeta, repasarUnaTarjeta } from './ayudas';

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

    // El gesto de volver no reabre la sesión terminada. La prueba llegó a Inicio
    // por la isla, que reemplazó a Ajustes: detrás de Inicio ya no queda nada de
    // la app y el gesto sale de ella.
    await page.goBack();
    await expect(page).not.toHaveURL(/ancla-memory-trainer/);
  });

  test('una sesión lanzada sin Inicio en la pila vuelve a Inicio y no se reabre', async ({ page }) => {
    await metaDeUnaTarjeta(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click(); // reemplaza a Inicio
    await expect(page).toHaveURL(/\/ajustes$/);

    await page.getByRole('button', { name: 'Repaso rápido' }).click();
    await page.getByRole('button', { name: 'Ver respuesta' }).click({ timeout: 15_000 });
    await page.getByRole('button', { name: /^Bien/ }).click();
    await expect(page).toHaveURL(/\/resumen-sesion/);
    await page.getByText('Volver al inicio').click();

    await expect(page.getByRole('progressbar', { name: '1 de 1 tarjetas hoy', exact: true })).toBeVisible();
    await expect(page.getByText('Practicar ahora')).toHaveCount(1);

    // El gesto de volver salta a lo que había antes de la sesión, no a ella.
    await page.goBack();
    await expect(page).toHaveURL(/\/ajustes$/);
    await expect(page.getByRole('button', { name: 'Ver respuesta', includeHidden: true })).toHaveCount(0);
  });

  test('«Ver mi racha» y su flecha de volver regresan al mismo Inicio', async ({ page }) => {
    await metaDeUnaTarjeta(page);
    await repasarUnaTarjeta(page);

    await page.getByText('Ver mi racha').click();
    await expect(page).toHaveURL(/\/estadisticas$/);
    await page.getByRole('button', { name: 'Volver', exact: true }).click();

    await expect(page.getByRole('progressbar', { name: '1 de 1 tarjetas hoy', exact: true })).toBeVisible();
    await expect(page.getByText('Practicar ahora')).toHaveCount(1);
  });
});

// ADR-040: la isla es navegación lateral y va con `router.dismissTo`. Con
// `router.push`, cada toque —también en la pestaña activa— apilaba otra copia
// y dejaba la de antes montada, invisible, debajo.
test.describe('cambiar de pestaña en la isla', () => {
  test('volver a Inicio, y tocarlo estando en él, deja un solo Inicio', async ({ page }) => {
    await abrir(page, '');
    await expect(page.getByText('Practicar ahora')).toHaveCount(1);

    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await expect(page).toHaveURL(/\/ajustes$/);

    await page.getByRole('tab', { name: 'Inicio' }).click();
    await expect(page.getByText('Practicar ahora').filter({ visible: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Inicio' }).click();
    await page.waitForTimeout(500); // lo que se apilara tardaría un render en aparecer

    // En todo el DOM, no solo lo visible: un Inicio apilado debajo también cuenta.
    await expect(page.getByText('Practicar ahora')).toHaveCount(1);
  });

  test('Editar, Progreso y Ajustes no se apilan sobre sí mismas', async ({ page }) => {
    await abrir(page, '');
    const pestanas = [
      { nombre: 'Editar', url: /\/editar$/, marca: 'Toca una categoría para añadir, editar o eliminar elementos.' },
      { nombre: 'Progreso', url: /\/estadisticas$/, marca: 'Últimos 90 días' },
      { nombre: 'Ajustes', url: /\/ajustes$/, marca: 'Guardar configuración' },
    ];

    for (const vuelta of [1, 2]) {
      for (const { nombre, url, marca } of pestanas) {
        await page.getByRole('tab', { name: nombre }).click();
        await expect(page, `vuelta ${vuelta}`).toHaveURL(url);
        await expect(page.getByText(marca).filter({ visible: true })).toBeVisible();

        await page.getByRole('tab', { name: nombre }).click(); // ya es la activa
        await page.waitForTimeout(500);
        await expect(page.getByText(marca), `vuelta ${vuelta}`).toHaveCount(1);
      }
    }
  });

  test('desde una subpantalla, su pestaña padre vuelve a la raíz sin apilar', async ({ page }) => {
    await abrir(page, '');
    await page.getByRole('button', { name: /^Colgadero/ }).click();
    await expect(page).toHaveURL(/\/colgadero$/);

    await page.getByRole('tab', { name: 'Inicio' }).click(); // la activa: Colgadero cuelga de Inicio
    await expect(page).toHaveURL(/\/ancla-memory-trainer\/?$/);
    // Primero el visible: contar antes pasaría con un Inicio nuevo aún sin pintar.
    await expect(page.getByText('Practicar ahora').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Practicar ahora')).toHaveCount(1);
  });
});
