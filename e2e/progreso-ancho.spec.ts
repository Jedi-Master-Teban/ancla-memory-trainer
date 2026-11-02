import { type Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { metaDeUnaTarjeta, repasarUnaTarjeta } from './ayudas';

// Bug del operador (2026-11-02): en Android, la gráfica de Progreso se salía por
// la derecha. Los anchos son los de teléfonos reales: 320 (pequeños), 360 (la
// mayoría de los Android), 384, 393, 412 (Pixel 7) y 430 (Android e iPhone grandes).
const ANCHOS = [320, 360, 384, 393, 412, 430];

/** Lo visible que cruza un borde de la pantalla (mejor que `scrollWidth`: un `overflow: hidden` lo esconde). */
function fueraDePantalla(page: Page) {
  return page.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const fuera: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      if (!el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > ancho + 0.5 || r.left < -0.5) {
        fuera.push(`${el.tagName} [${Math.round(r.left)}, ${Math.round(r.right)}] «${(el.textContent ?? '').slice(0, 24)}»`);
      }
    }
    return fuera.slice(0, 5);
  });
}

/** Lo que cruza el borde de la tarjeta que contiene `texto`: cada SVG tiene que caber dentro. */
function fueraDeSuTarjeta(page: Page, texto: string) {
  return page.evaluate((buscado) => {
    const titulo = Array.from(document.querySelectorAll('div')).find(
      (d) => d.children.length === 0 && d.textContent === buscado && d.checkVisibility(),
    );
    if (!titulo) return [`no encontré «${buscado}»`];
    let tarjeta: HTMLElement | null = titulo;
    while (tarjeta && parseFloat(getComputedStyle(tarjeta).borderTopWidth) === 0) tarjeta = tarjeta.parentElement;
    if (!tarjeta) return ['sin tarjeta'];
    const borde = tarjeta.getBoundingClientRect();
    return Array.from(tarjeta.querySelectorAll('svg'))
      .map((s) => s.getBoundingClientRect())
      .filter((r) => r.right > borde.right + 0.5 || r.left < borde.left - 0.5)
      .map((r) => `svg [${Math.round(r.left)}, ${Math.round(r.right)}] en tarjeta [${Math.round(borde.left)}, ${Math.round(borde.right)}]`);
  }, texto);
}

test.describe('Progreso cabe en cualquier ancho', () => {
  test('la gráfica, las barras y el radar no se salen', async ({ page }) => {
    await metaDeUnaTarjeta(page);
    await repasarUnaTarjeta(page); // sin días practicados, la gráfica de línea no aparece
    await page.getByText('Volver al inicio').click();
    await page.getByRole('tab', { name: 'Progreso' }).click();
    await expect(page.getByText('Tarjetas por día')).toBeVisible();

    const problemas: Record<string, string[]> = {};
    const anotar = (clave: string, lista: string[]) => {
      if (lista.length > 0) problemas[clave] = lista;
    };

    for (const ancho of ANCHOS) {
      await page.setViewportSize({ width: ancho, height: 800 });
      await page.waitForTimeout(200); // el onLayout mide después de redimensionar

      for (const periodo of ['Día', 'Semana', 'Mes', 'Todo']) {
        await page.getByText(periodo, { exact: true }).last().click(); // «Todo» también está en la ventana de arriba
        anotar(`${ancho} ${periodo}: pantalla`, await fueraDePantalla(page));
        anotar(`${ancho} ${periodo}: tarjeta`, await fueraDeSuTarjeta(page, 'Tarjetas por día'));
      }

      await page.getByRole('button', { name: 'Ver como radar' }).click();
      await expect(page.getByText('Cada anillo', { exact: false })).toBeVisible();
      await page.waitForTimeout(100);
      anotar(`${ancho} radar: pantalla`, await fueraDePantalla(page));
      anotar(`${ancho} radar: tarjeta`, await fueraDeSuTarjeta(page, 'Colgadero'));
      await page.getByRole('button', { name: 'Ver como barras' }).click();
    }

    expect(problemas).toEqual({});
  });
});
