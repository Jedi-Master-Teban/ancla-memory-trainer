import { type Page } from '@playwright/test';
import { expect } from './fixtures';
import { cpSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const PUERTO = 4173;
const ORIGEN = `http://localhost:${PUERTO}`;

/** La app está lista cuando la pantalla de arranque se retira (recibió `lista`). */
export async function esperarApp(page: Page): Promise<void> {
  await expect(page.locator('#ancla-arranque')).toHaveCount(0, { timeout: 45_000 });
}

/** Errores de JavaScript no capturados durante la prueba. */
export function registrarErrores(page: Page): string[] {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  return errores;
}

export async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarApp(page);
}

export async function crearLista(page: Page, nombre: string): Promise<void> {
  await abrir(page, 'listas');
  await page.getByPlaceholder('Nombre de la lista nueva...').fill(nombre);
  await page.getByText('Crear', { exact: true }).click();
  await expect(page).toHaveURL(/\/listas\/[^/]+$/);
}

/** Cuántas copias automáticas hay en IndexedDB (sin crear la base si no existe). */
export async function contarCopias(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolver) => {
        const peticion = indexedDB.open('ancla-copias');
        peticion.onupgradeneeded = () => peticion.transaction?.abort();
        peticion.onerror = () => resolver(0);
        peticion.onsuccess = () => {
          const idb = peticion.result;
          if (!idb.objectStoreNames.contains('metas')) return resolver(0);
          const conteo = idb.transaction('metas').objectStore('metas').count();
          conteo.onsuccess = () => {
            resolver(conteo.result);
            idb.close();
          };
        };
      }),
  );
}

/**
 * Borra la base SQLite de OPFS, como la «reparación» de expo-sqlite al
 * encontrar una cabecera dañada. Se hace desde una página del mismo origen
 * FUERA de la app (la raíz del servidor, que el service worker no controla),
 * para que ningún worker tenga abiertos los archivos.
 */
export async function borrarBaseSQLite(page: Page): Promise<void> {
  await page.goto(`${ORIGEN}/`);
  await page.evaluate(async () => {
    const raiz = await navigator.storage.getDirectory();
    const nombres: string[] = [];
    // @ts-expect-error — `keys()` existe en FileSystemDirectoryHandle (WebKit y Chromium).
    for await (const nombre of raiz.keys()) nombres.push(nombre);
    for (const nombre of nombres) await raiz.removeEntry(nombre, { recursive: true });
  });
}

/**
 * Simula un despliegue: copia dist/ con el bundle principal renombrado (el
 * viejo desaparece, como en GitHub Pages) y otra versión de caché del service
 * worker. Devuelve la carpeta y el nombre del bundle nuevo.
 */
export function prepararVersionNueva(): { carpeta: string; bundle: string } {
  const carpeta = join('e2e', '.tmp', 'dist-nueva');
  rmSync(carpeta, { recursive: true, force: true });
  cpSync('dist', carpeta, { recursive: true });
  const js = join(carpeta, '_expo', 'static', 'js', 'web');
  const vieja = readdirSync(js).find((f) => /^entry-[a-f0-9]+\.js$/.test(f));
  if (!vieja) throw new Error('No encontré el bundle principal en dist/');
  const nueva = `entry-e2e${Date.now().toString(16)}.js`;
  renameSync(join(js, vieja), join(js, nueva));
  for (const html of ['index.html', '404.html']) {
    const ruta = join(carpeta, html);
    writeFileSync(ruta, readFileSync(ruta, 'utf8').replaceAll(vieja, nueva));
  }
  const sw = join(carpeta, 'sw.js');
  writeFileSync(sw, readFileSync(sw, 'utf8').replace(/const CACHE = '([^']+)'/, "const CACHE = '$1-e2e'"));
  return { carpeta, bundle: nueva };
}

/** Cambia el build que sirve el servidor de pruebas. */
export async function servir(carpeta: string): Promise<void> {
  const respuesta = await fetch(`${ORIGEN}/__servir?dir=${encodeURIComponent(carpeta)}`);
  if (!respuesta.ok) throw new Error(`No se pudo servir ${carpeta}`);
}

/**
 * Sustituye el menú de compartir del sistema: Safari lo ofrece para archivos,
 * pero en WebKit sin pantalla nunca se cierra. Guarda lo compartido para que
 * la prueba lo lea con `leerCompartido`. Llamar antes de navegar.
 */
export async function simularMenuCompartir(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __compartidos: { nombre: string; base64: string }[] };
    w.__compartidos = [];
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: (datos?: ShareData) => Boolean(datos?.files?.length),
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (datos: ShareData) => {
        const archivo = datos.files![0];
        const bytes = new Uint8Array(await archivo.arrayBuffer());
        let binario = '';
        for (const b of bytes) binario += String.fromCharCode(b);
        w.__compartidos.push({ nombre: archivo.name, base64: btoa(binario) });
      },
    });
  });
}

/** Un navegador sin menú de compartir archivos: el respaldo cae a descarga. */
export async function sinMenuCompartir(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });
}

export async function leerCompartido(page: Page): Promise<{ nombre: string; bytes: Buffer }> {
  const handle = await page.waitForFunction(() => {
    const lista = (window as unknown as { __compartidos?: { nombre: string; base64: string }[] }).__compartidos;
    return lista && lista.length > 0 ? lista[lista.length - 1] : null;
  });
  const { nombre, base64 } = (await handle.jsonValue()) as { nombre: string; base64: string };
  return { nombre, bytes: Buffer.from(base64, 'base64') };
}
