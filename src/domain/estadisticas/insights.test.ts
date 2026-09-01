import {
  generarInsights,
  insightMemoriaSolida,
  insightPuntoDebil,
  insightRachaEnRiesgo,
  insightTendenciaPositiva,
} from './insights';

const RETENCION_BUENA = { colgadero: 0.92, naipe: 0.88, lista_item: 0.95, numero: 0.9 };
const RETENCION_MIXTA = { colgadero: 0.55, naipe: 0.81, lista_item: 0.94, numero: 0.62 };
const RETENCION_TODOS_BAJA = { colgadero: 0.4, naipe: 0.5, lista_item: 0.3, numero: 0.45 };

describe('insightPuntoDebil', () => {
  it('detecta la categoría con menor retención bajo 60%', () => {
    const r = insightPuntoDebil(RETENCION_MIXTA);
    expect(r).not.toBeNull();
    expect(r?.tipo).toBe('alerta');
    expect(r?.contexto).toBe('colgadero'); // 55% < 62%
  });

  it('devuelve null si todas las retenciones están sobre 60%', () => {
    expect(insightPuntoDebil(RETENCION_BUENA)).toBeNull();
  });

  it('incluye CTA accionable (tarjetas para recuperar)', () => {
    const r = insightPuntoDebil(RETENCION_TODOS_BAJA);
    expect(r?.detalle).toMatch(/tarjetas bastan/);
  });
});

describe('insightTendenciaPositiva', () => {
  it('devuelve positivo cuando XP actual > anterior', () => {
    const r = insightTendenciaPositiva(150, 100);
    expect(r?.tipo).toBe('positivo');
    expect(r?.titulo).toBe('+50% XP esta semana');
  });

  it('devuelve null cuando no hay mejora', () => {
    expect(insightTendenciaPositiva(100, 100)).toBeNull();
    expect(insightTendenciaPositiva(80, 100)).toBeNull();
  });

  it('devuelve null cuando semana anterior fue 0 (no comparable)', () => {
    expect(insightTendenciaPositiva(50, 0)).toBeNull();
  });
});

describe('insightRachaEnRiesgo', () => {
  it('emite motivación si racha >= 7 y meta no cumplida', () => {
    const r = insightRachaEnRiesgo(10, 5, 20);
    expect(r?.tipo).toBe('motivacion');
    expect(r?.detalle).toContain('15 XP'); // 20-5
  });

  it('NO emite si racha corta (< 7 días)', () => {
    expect(insightRachaEnRiesgo(3, 5, 20)).toBeNull();
  });

  it('NO emite si meta ya cumplida hoy', () => {
    expect(insightRachaEnRiesgo(15, 25, 20)).toBeNull();
  });
});

describe('insightMemoriaSolida', () => {
  it('felicita cuando todas las categorías >= 85%', () => {
    const r = insightMemoriaSolida(RETENCION_BUENA);
    expect(r?.tipo).toBe('positivo');
    expect(r?.titulo).toBe('Memoria sólida');
  });

  it('NO emite si alguna categoría < 85%', () => {
    expect(insightMemoriaSolida(RETENCION_MIXTA)).toBeNull();
  });
});

describe('generarInsights (orquestador)', () => {
  it('combina múltiples insights cuando aplican', () => {
    const insights = generarInsights({
      retencion: RETENCION_MIXTA,
      xpSemanaActual: 200,
      xpSemanaAnterior: 100,
      diasConsecutivos: 10,
      xpHoy: 5,
      metaDiaria: 20,
    });
    // Esperamos al menos 3: punto débil + tendencia + racha en riesgo
    expect(insights.length).toBeGreaterThanOrEqual(3);
  });

  it('memoria sólida desactiva el punto débil', () => {
    const insights = generarInsights({
      retencion: RETENCION_BUENA,
      xpSemanaActual: 50,
      xpSemanaAnterior: 50,
      diasConsecutivos: 2,
      xpHoy: 25,
      metaDiaria: 20,
    });
    expect(insights.length).toBe(1);
    expect(insights[0].titulo).toBe('Memoria sólida');
  });

  it('con racha corta y sin problemas → solo memoria sólida', () => {
    const insights = generarInsights({
      retencion: RETENCION_BUENA,
      xpSemanaActual: 80,
      xpSemanaAnterior: 100, // baja
      diasConsecutivos: 2,
      xpHoy: 20,
      metaDiaria: 20,
    });
    expect(insights.length).toBe(1);
    expect(insights[0].tipo).toBe('positivo');
  });
});
