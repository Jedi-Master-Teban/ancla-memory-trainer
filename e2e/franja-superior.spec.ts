import { type Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { abrir } from './ayudas';

// iOS 26+ difumina los ~38 pt de arriba de una app web instalada, ENCIMA de
// la página, salvo que el borde superior lo cubra un contenedor fijo con
// color sólido. La regla es de WebCore (LocalFrameView::fixedContainerEdges):
// mira 4 px bajo el borde, al centro, ignorando pointer-events; sube hasta el
// primer ancestro fixed o sticky, que debe cubrir al menos el 90 % del ancho
// y medir más de 10 px de alto. Aquí no hay iPhone: se comprueba esa
// condición en el DOM (src/components/BordeSuperior.tsx).

/** Hace creer a la app que está instalada en la pantalla de inicio. */
async function comoAppInstalada(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (consulta: string) =>
      consulta.includes('display-mode: standalone')
        ? ({
            matches: true,
            media: consulta,
            onchange: null,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent: () => false,
          } as MediaQueryList)
        : original(consulta);
  });
}

/** Lo que WebKit encuentra en el borde superior, o null si no hay contenedor fijo. */
function contenedorDelBorde(page: Page) {
  return page.evaluate(() => {
    // WebKit hace esta prueba ignorando pointer-events; el navegador no. En
    // línea y con !important, porque react-native-web también usa !important.
    const apagados = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(
      (e) => getComputedStyle(e).pointerEvents === 'none',
    );
    for (const e of apagados) e.style.setProperty('pointer-events', 'auto', 'important');
    let el = document.elementFromPoint(innerWidth / 2, 4) as HTMLElement | null;
    for (const e of apagados) e.style.removeProperty('pointer-events');
    while (el && !['fixed', 'sticky'].includes(getComputedStyle(el).position)) el = el.parentElement;
    if (!el) return null;
    const caja = el.getBoundingClientRect();
    return {
      alto: caja.height,
      proporcionDelAncho: caja.width / innerWidth,
      fondo: getComputedStyle(el).backgroundColor,
      fondoDeLaPagina: getComputedStyle(document.body).backgroundColor,
    };
  });
}

/** El punto más alto que ocupa algo dentro del elemento (Memo con sus zetas). */
function bordeSuperiorDe(page: Page, nombre: RegExp) {
  return page
    .getByRole('img', { name: nombre })
    .filter({ visible: true })
    .evaluate((el) => Math.min(...[el, ...Array.from(el.querySelectorAll('*'))].map((n) => n.getBoundingClientRect().top)));
}

test.describe('franja superior de la app instalada', () => {
  test('el borde superior queda bajo un contenedor fijo del color del fondo', async ({ page }) => {
    await comoAppInstalada(page);
    await abrir(page, '');

    const borde = await contenedorDelBorde(page);
    expect(borde).not.toBeNull();
    expect(borde!.alto).toBeGreaterThan(10);
    expect(borde!.proporcionDelAncho).toBeGreaterThanOrEqual(0.9);
    expect(borde!.fondo).toBe(borde!.fondoDeLaPagina);

    // Nada del contenido queda debajo de la franja: ni Memo con sus zetas ni la racha.
    expect(await bordeSuperiorDe(page, /^Memo/)).toBeGreaterThanOrEqual(borde!.alto);
    const racha = await page.getByRole('button', { name: /racha/i }).filter({ visible: true }).first().boundingBox();
    expect(racha!.y).toBeGreaterThanOrEqual(borde!.alto);
  });

  test('las cabeceras de las demás pantallas también empiezan debajo', async ({ page }) => {
    await comoAppInstalada(page);
    await abrir(page, 'colgadero');
    const borde = await contenedorDelBorde(page);
    const volver = await page.getByRole('button', { name: 'Volver' }).filter({ visible: true }).boundingBox();
    expect(volver!.y).toBeGreaterThanOrEqual(borde!.alto);
  });

  test('en una pestaña del navegador no reserva nada', async ({ page }) => {
    await abrir(page, '');
    expect(await contenedorDelBorde(page)).toBeNull();
    const memo = await page.getByRole('img', { name: /^Memo/ }).filter({ visible: true }).boundingBox();
    expect(memo!.y).toBe(14);
  });
});
