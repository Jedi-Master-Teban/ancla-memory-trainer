// Servidor de las pruebas E2E: se comporta como GitHub Pages (ADR-032).
//
// - Sirve el build bajo /ancla-memory-trainer/, como en producción.
// - `cache-control: max-age=600`, igual que GitHub Pages: si algo se apoya en
//   la caché HTTP sin querer, las pruebas lo notan.
// - Una ruta que no existe responde 404.html con estado 404.
// - `/__servir?dir=<carpeta>` cambia el build servido en caliente: así una
//   prueba simula un despliegue nuevo sin reiniciar nada.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

const PUERTO = Number(process.env.PUERTO ?? 4173);
const BASE = '/ancla-memory-trainer/';
let raiz = resolve(process.env.ANCLA_DIST ?? 'dist');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

async function responderArchivo(res, archivo, estado) {
  const cuerpo = await readFile(archivo);
  res.writeHead(estado, {
    'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream',
    'cache-control': 'max-age=600',
  });
  res.end(cuerpo);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/__servir') {
    raiz = resolve(url.searchParams.get('dir') ?? 'dist');
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(`sirviendo ${raiz}`);
    return;
  }
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404');
    return;
  }
  let relativa = decodeURIComponent(url.pathname.slice(BASE.length));
  if (relativa === '' || relativa.endsWith('/')) relativa += 'index.html';
  const archivo = resolve(join(raiz, relativa));
  if (!archivo.startsWith(raiz + sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    await responderArchivo(res, archivo, 200);
  } catch {
    try {
      await responderArchivo(res, join(raiz, '404.html'), 404);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404');
    }
  }
}).listen(PUERTO, () => {
  console.log(`E2E: ${raiz} en http://localhost:${PUERTO}${BASE}`);
});
