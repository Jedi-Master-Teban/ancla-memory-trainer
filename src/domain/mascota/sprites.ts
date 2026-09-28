// Generado por pwa/arranque/generar_mascotas.py con los mismos datos de
// pwa/arranque/mascotas.json. No se edita a mano: se cambia el generador y se
// vuelve a correr (memo.test.ts comprueba que ambos coinciden).

/** Lado de cada cuadro, en píxeles del dibujo. */
export const LADO_SPRITE = 24;

/**
 * Cada carácter de un cuadro es un píxel: la clave de su color aquí, o '.'
 * si es transparente. Tonos de Soft UI más X, el verde de «Bien».
 */
export const PALETA_MEMO = {
  K: '#2D2A26',
  M: '#7A756C',
  C: '#E8E5DF',
  W: '#FAF9F7',
  O: '#FF6B35',
  o: '#FFB399',
  X: '#10B981',
} as const;

/**
 * Los cuadros de Memo (ADR-033). quieto, parpadeo y error son los de la
 * pantalla de arranque; dormido (ojos cerrados, orejas en reposo) y feliz
 * (ojos en arco) son para la app.
 */
export const CUADROS_MEMO = {
  quieto: [
    '...KOKOK........KOKOK...',
    '...KOOOK........KOOOK...',
    '....KKOOK......KOOKK....',
    '......KKOKKKKKKOKK......',
    '...KKKKKKMMMMMMKKKKKK...',
    '..KMMMKKMMMMMMMMKKMMMK..',
    '.KMMMoKMMMMMMMMMMKoMMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KMMoKMMKWMMMMKWMMKoMMK.',
    '.KMMoKMMKKMMMMKKMMKoMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KKMMoKoMMMMMMMMoKoMMKK.',
    '..KKMMMKMMKMMKMMKMMMKK..',
    '...KKKK.KKKMMKKK.KKKK...',
    '.......KMMKMMKMMK.......',
    '......KMMMKMMKKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKKKKMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMKMMKMMMK......',
    '......KCCCMMMMCCCK......',
    '.......KKKKKKKKKK.......',
  ],
  parpadeo: [
    '...KOKOK........KOKOK...',
    '...KOOOK........KOOOK...',
    '....KKOOK......KOOKK....',
    '......KKOKKKKKKOKK......',
    '..KKKKKKKMMMMMMKKKKKKK..',
    '.KKMMMKKMMMMMMMMKKMMMKK.',
    '.KMMMoKMMMMMMMMMMKoMMMK.',
    'KMMooKMMMMMMMMMMMMKooMMK',
    'KMMooKMMMMMMMMMMMMKooMMK',
    'KMMooKMMMMMMMMMMMMKooMMK',
    'KMMooKMMKKMMMMKKMMKooMMK',
    'KMMooKMMMMMMMMMMMMKooMMK',
    '.KMMooKoMMMMMMMMoKooMMK.',
    '.KKMMMKKMMKMMKMMKKMMMKK.',
    '...KKK..KKKMMKKK..KKK...',
    '.......KMMKMMKMMK.......',
    '......KMMMKMMKKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKKKKMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMKMMKMMMK......',
    '......KCCCMMMMCCCK......',
    '.......KKKKKKKKKK.......',
  ],
  error: [
    '...KOKOK.KKKKKK.KOKOK...',
    '...KOOOK.KMKKMK.KOOOK...',
    '....KKOOK.KMMK.KOOKK....',
    '......KKOKKMMKKOKK......',
    '..KKKKKKKMKMMKMKKKKKKK..',
    '.KKMMMKKMMKMMKMMKKMMMKK.',
    '.KMMMoKMMMKMMKMMMKoMMMK.',
    'KMMooKMMMMKMMKMMMMKooMMK',
    'KMMooKMWWWKMMKWWWMKooMMK',
    'KMMooKMWKWKMMKWKWMKooMMK',
    'KMMooKMWWWKMMKWWWMKooMMK',
    'KMMooKMMMMKMMKMMMMKooMMK',
    '.KMMooKMMMMKKMMMMKooMMK.',
    '.KKMMMKKMMMKKMMMKKMMMKK.',
    '...KKK..KKMMMMKK..KKK...',
    '.......KMMKKKKMMK.......',
    '......KMMMMMMMMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMKMMKMMMK......',
    '......KCCCMMMMCCCK......',
    '.......KKKKKKKKKK.......',
  ],
  dormido: [
    '...KOKOK........KOKOK...',
    '...KOOOK........KOOOK...',
    '....KKOOK......KOOKK....',
    '......KKOKKKKKKOKK......',
    '...KKKKKKMMMMMMKKKKKK...',
    '..KMMMKKMMMMMMMMKKMMMK..',
    '.KMMMoKMMMMMMMMMMKoMMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KMMoKMMKKMMMMKKMMKoMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KKMMoKoMMMMMMMMoKoMMKK.',
    '..KKMMMKMMKMMKMMKMMMKK..',
    '...KKKK.KKKMMKKK.KKKK...',
    '.......KMMKMMKMMK.......',
    '......KMMMKMMKKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKKKKMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMKMMKMMMK......',
    '......KCCCMMMMCCCK......',
    '.......KKKKKKKKKK.......',
  ],
  feliz: [
    '...KOKOK........KOKOK...',
    '...KOOOK........KOOOK...',
    '....KKOOK......KOOKK....',
    '......KKOKKKKKKOKK......',
    '...KKKKKKMMMMMMKKKKKK...',
    '..KMMMKKMMMMMMMMKKMMMK..',
    '.KMMMoKMMMMMMMMMMKoMMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KMMoKMMKMMMMMMKMMKoMMK.',
    '.KMMoKMKMKMMMMKMKMKoMMK.',
    '.KMMoKMMMMMMMMMMMMKoMMK.',
    '.KKMMoKoMMMMMMMMoKoMMKK.',
    '..KKMMMKMMKMMKMMKMMMKK..',
    '...KKKK.KKKMMKKK.KKKK...',
    '.......KMMKMMKMMK.......',
    '......KMMMKMMKKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKMMMKMMK......',
    '......KMMMKKKKMMMK......',
    '......KMMMMMMMMMMK......',
    '......KMMMKMMKMMMK......',
    '......KCCCMMMMCCCK......',
    '.......KKKKKKKKKK.......',
  ],
} as const;

/** La z del sueño y el destello de la celebración, del mismo pixel art. */
export const EXTRAS_MEMO = {
  z: ['MMMM', '..M.', '.M..', 'MMMM'],
  destello: ['.X.', 'XXX', '.X.'],
} as const;

export type CuadroMemo = keyof typeof CUADROS_MEMO;
export type ColorSprite = keyof typeof PALETA_MEMO;
