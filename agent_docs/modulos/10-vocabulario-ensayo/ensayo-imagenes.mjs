// Reproduce el ensayo de agent_docs/modulos/10-vocabulario.md §4:  node agent_docs/modulos/10-vocabulario-ensayo/ensayo-imagenes.mjs
// (usa la red: consulta Openverse; escribe fuentes.json y comparacion.jpg junto a este archivo).
// Ensayo: calidad y peso de la imagen guardada (400/640/800 px), en Chromium y en WebKit (el motor del iPhone).
import { chromium, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';
const D = new URL('./', import.meta.url).pathname;
const consultas = ['manzana', 'perro', 'bicicleta', 'taza'];
const fuentes = [];
for (const q of consultas) {
  const r = await (await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=8&license_type=commercial,modification&mature=false`)).json();
  const it = (r.results || []).find((x) => x.width >= 1000) || r.results?.[0];
  if (!it) continue;
  const pequena = await fetch(`https://api.openverse.org/v1/images/${it.id}/thumb/`);
  const grande = await fetch(`https://api.openverse.org/v1/images/${it.id}/thumb/?full_size=true`);
  const bp = Buffer.from(await pequena.arrayBuffer()), bg = Buffer.from(await grande.arrayBuffer());
  console.log(`${q.padEnd(10)} orig ${it.width}x${it.height} ${it.license} | /thumb/ ${bp.length} B (${pequena.status}) | full_size ${bg.length} B (${grande.status}, ${grande.headers.get('content-type')}, CORS ${grande.headers.get('access-control-allow-origin')})`);
  fuentes.push({ q, titulo: it.title, atribucion: it.attribution, base64: bg.toString('base64') });
}
const medir = async (motor) => {
  const b = await motor.launch(); const p = await b.newPage();
  await p.setContent('<body></body>');
  const res = await p.evaluate(async (fuentes) => {
    const out = [];
    for (const f of fuentes) {
      const blob = await (await fetch('data:image/jpeg;base64,' + f.base64)).blob();
      const bmp = await createImageBitmap(blob);
      const fila = { q: f.q, fuente: `${bmp.width}x${bmp.height}`, variantes: [] };
      for (const ancho of [400, 640, 800]) {
        const w = Math.min(ancho, bmp.width), h = Math.round((bmp.height * w) / bmp.width);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, h);
        for (const tipo of ['image/jpeg', 'image/webp']) {
          const t0 = performance.now();
          const o = await new Promise((ok) => c.toBlob(ok, tipo, 0.82));
          fila.variantes.push({ ancho: w, pedido: tipo, obtenido: o.type, bytes: o.size, ms: Math.round(performance.now() - t0) });
        }
      }
      out.push(fila);
    }
    return out;
  }, fuentes);
  await b.close(); return res;
};
for (const [n, m] of [['CHROMIUM', chromium], ['WEBKIT (motor del iPhone)', webkit]]) {
  const r = await medir(m);
  console.log('\n' + n);
  for (const f of r) console.log(' ', f.q.padEnd(10), f.fuente, '\n     ', f.variantes.map((v) => `${v.ancho}px ${v.pedido.split('/')[1]}→${v.obtenido.split('/')[1]} ${(v.bytes / 1024).toFixed(0)}KB`).join(' | '));
}
writeFileSync(D + 'fuentes.json', JSON.stringify(fuentes.map((f) => ({ q: f.q, titulo: f.titulo, atribucion: f.atribucion })), null, 1));
// Hoja visual: cada variante JPEG a 260 CSS px de ancho, en una pantalla 3x (iPhone).
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 860, height: 700 }, deviceScaleFactor: 3 }); const p = await ctx.newPage();
await p.setContent('<body style="margin:0;background:#F0EEE9;font:13px system-ui;color:#2D2A26"><div id=r style="padding:12px;display:grid;gap:14px"></div></body>');
const html = await p.evaluate(async (fuentes) => {
  const filas = [];
  for (const f of fuentes.slice(0, 3)) {
    const blob = await (await fetch('data:image/jpeg;base64,' + f.base64)).blob(); const bmp = await createImageBitmap(blob);
    const celdas = [];
    for (const ancho of [400, 640, 800]) {
      const w = Math.min(ancho, bmp.width), h = Math.round((bmp.height * w) / bmp.width);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, h);
      const o = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
      const url = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(o); });
      celdas.push(`<figure style="margin:0"><div style="width:260px;height:195px;overflow:hidden;border-radius:14px;background:#fff"><img src="${url}" style="width:260px;height:195px;object-fit:cover;display:block"></div><figcaption>${f.q} · ${w} px · ${(o.size / 1024).toFixed(0)} KB</figcaption></figure>`);
    }
    filas.push(`<div style="display:flex;gap:14px">${celdas.join('')}</div>`);
  }
  return filas.join('');
}, fuentes);
await p.evaluate((h) => { document.getElementById('r').innerHTML = h; }, html);
await p.waitForTimeout(800);
await p.screenshot({ path: D + 'comparacion.jpg', fullPage: true });
await b.close(); console.log('\nhoja:', D + 'comparacion.jpg');
