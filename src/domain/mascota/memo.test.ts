import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { estadoDeMemo, etiquetaDeMemo, reaccionAlTerminar, rectsDeSprite } from './memo';
import { CUADROS_MEMO, EXTRAS_MEMO, LADO_SPRITE, PALETA_MEMO } from './sprites';

describe('estadoDeMemo — Memo en Inicio', () => {
  it('duerme cuando no hay racha', () => {
    expect(estadoDeMemo(0)).toBe('dormido');
  });

  it('está despierto con cualquier racha, aunque hoy aún falte la meta', () => {
    expect(estadoDeMemo(1)).toBe('despierto');
    expect(estadoDeMemo(40)).toBe('despierto');
  });
});

describe('reaccionAlTerminar — Memo al cerrar una sesión', () => {
  it('celebra que empieza una racha cuando esta sesión cumplió la meta y la racha queda en 1', () => {
    expect(reaccionAlTerminar({ racha: 1, tarjetasHoy: 20, meta: 20, calificadasEnSesion: 20 })).toBe('empieza-racha');
  });

  it('celebra que la racha crece cuando esta sesión cumplió la meta de un día más', () => {
    // 13 antes de la sesión, 23 después: cruzó las 20.
    expect(reaccionAlTerminar({ racha: 5, tarjetasHoy: 23, meta: 20, calificadasEnSesion: 10 })).toBe('extiende-racha');
  });

  it('cuenta el borde exacto: 19 antes y 20 después cruza la meta', () => {
    expect(reaccionAlTerminar({ racha: 2, tarjetasHoy: 20, meta: 20, calificadasEnSesion: 1 })).toBe('extiende-racha');
  });

  it('no vuelve a celebrar si la meta ya estaba cumplida antes de esta sesión', () => {
    expect(reaccionAlTerminar({ racha: 5, tarjetasHoy: 40, meta: 20, calificadasEnSesion: 10 })).toBe('despierto');
    expect(reaccionAlTerminar({ racha: 1, tarjetasHoy: 21, meta: 20, calificadasEnSesion: 1 })).toBe('despierto');
  });

  it('sin cumplir la meta, solo refleja la racha: despierto si la hay, dormido si no', () => {
    expect(reaccionAlTerminar({ racha: 3, tarjetasHoy: 12, meta: 20, calificadasEnSesion: 12 })).toBe('despierto');
    expect(reaccionAlTerminar({ racha: 0, tarjetasHoy: 12, meta: 20, calificadasEnSesion: 12 })).toBe('dormido');
  });

  it('una sesión sin tarjetas calificadas no celebra', () => {
    expect(reaccionAlTerminar({ racha: 1, tarjetasHoy: 20, meta: 20, calificadasEnSesion: 0 })).toBe('despierto');
  });

  it('sin los datos de la meta (una navegación que no los manda) solo refleja la racha', () => {
    expect(reaccionAlTerminar({ racha: 4, tarjetasHoy: null, meta: null, calificadasEnSesion: 20 })).toBe('despierto');
    expect(reaccionAlTerminar({ racha: 0, tarjetasHoy: 20, meta: null, calificadasEnSesion: 20 })).toBe('dormido');
  });

  it('no celebra una racha que no existe, aunque los números digan que cruzó la meta', () => {
    expect(reaccionAlTerminar({ racha: 0, tarjetasHoy: 20, meta: 20, calificadasEnSesion: 20 })).toBe('dormido');
  });
});

describe('etiquetaDeMemo — lo que oye un lector de pantalla', () => {
  it('nombra a Memo y dice qué está haciendo', () => {
    expect(etiquetaDeMemo('dormido')).toBe('Memo está dormido. Despierta cuando cumples la meta del día.');
    expect(etiquetaDeMemo('despierto')).toBe('Memo está despierto.');
    expect(etiquetaDeMemo('empieza-racha')).toBe('Memo despierta y celebra: empezaste una racha.');
    expect(etiquetaDeMemo('extiende-racha')).toBe('Memo celebra: tu racha sigue creciendo.');
  });
});

describe('rectsDeSprite', () => {
  it('une en un rectángulo los píxeles seguidos del mismo color de cada fila', () => {
    expect(rectsDeSprite(['.KK.M', 'OOOO.'])).toEqual([
      { x: 1, y: 0, ancho: 2, color: 'K' },
      { x: 4, y: 0, ancho: 1, color: 'M' },
      { x: 0, y: 1, ancho: 4, color: 'O' },
    ]);
  });

  it('corta el tramo cuando cambia el color, aunque no haya hueco', () => {
    expect(rectsDeSprite(['KKMM'])).toEqual([
      { x: 0, y: 0, ancho: 2, color: 'K' },
      { x: 2, y: 0, ancho: 2, color: 'M' },
    ]);
  });

  it('una fila transparente no dibuja nada', () => {
    expect(rectsDeSprite(['....', '....'])).toEqual([]);
  });
});

describe('sprites de Memo', () => {
  it('tiene los cinco cuadros: los tres del arranque y dormido y feliz para la app', () => {
    expect(Object.keys(CUADROS_MEMO).sort()).toEqual(['dormido', 'error', 'feliz', 'parpadeo', 'quieto']);
  });

  it('cada cuadro es de 24 × 24 y solo usa colores de su paleta', () => {
    const colores = new Set(Object.keys(PALETA_MEMO));
    for (const [nombre, filas] of Object.entries(CUADROS_MEMO)) {
      expect({ nombre, alto: filas.length }).toEqual({ nombre, alto: LADO_SPRITE });
      for (const fila of filas) {
        expect(fila).toHaveLength(LADO_SPRITE);
        for (const c of fila) if (c !== '.') expect(colores).toContain(c);
      }
    }
  });

  it('son los mismos de mascotas.json, del que salen la app y la pantalla de arranque', () => {
    const ruta = join(__dirname, '../../../pwa/arranque/mascotas.json');
    const datos = JSON.parse(readFileSync(ruta, 'utf8'));
    expect(CUADROS_MEMO).toEqual(datos.mascotas.memo.cuadros);
    expect(PALETA_MEMO).toEqual({ ...datos.paleta, X: datos.mascotas.memo.extra.color });
    expect(EXTRAS_MEMO).toEqual({ z: datos.extras.z, destello: datos.extras.destello });
  });
});
