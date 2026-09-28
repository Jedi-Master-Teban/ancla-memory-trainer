import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de extremo a extremo de la PWA (ADR-032). Corren contra el build de
 * producción (`dist/`), servido como lo sirve GitHub Pages, en WebKit —el motor
 * de Safari en iPhone— y en Chromium.
 *
 *   npm run test:e2e        construye la PWA y corre las pruebas
 *   npx playwright test     solo las pruebas, sobre el dist/ que ya haya
 *
 * Si otro checkout (un worktree) ya tiene su servidor en el 4173, Playwright lo
 * reutiliza y prueba el dist/ de ESE checkout. Para correr en paralelo, otro
 * puerto: `ANCLA_E2E_PUERTO=4174 npm run test:e2e`.
 */
const PUERTO = Number(process.env.ANCLA_E2E_PUERTO ?? 4173);

export default defineConfig({
  testDir: 'e2e',
  // Cada prueba abre su propio contexto, pero las de actualización cambian el
  // build servido: en serie para que no se pisen.
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PUERTO}/ancla-memory-trainer/`,
    trace: 'retain-on-failure',
    locale: 'es-CO',
  },
  projects: [
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
    { name: 'chromium-movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `PUERTO=${PUERTO} node e2e/servidor.mjs`,
    url: `http://localhost:${PUERTO}/ancla-memory-trainer/`,
    reuseExistingServer: !process.env.CI,
  },
});
