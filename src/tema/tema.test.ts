import { coloresDelTema, type TemaId, recetaBotonCalificacion } from './colores';
import { tipografiaDelTema } from './tipografia';

describe('sistema de tema', () => {
  describe('coloresDelTema', () => {
    it('devuelve tokens para los 3 estilos disponibles', () => {
      const estilos: TemaId[] = ['arcade', 'soft', 'papel'];
      estilos.forEach((estilo) => {
        const tokens = coloresDelTema(estilo);
        expect(tokens.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(tokens.card).toBeDefined();
        expect(tokens.ink).toBeDefined();
        expect(tokens.accent1).toBeDefined();
      });
    });

    it('los 3 estilos tienen paletas distintas (bg)', () => {
      const arcade = coloresDelTema('arcade').bg;
      const soft = coloresDelTema('soft').bg;
      const papel = coloresDelTema('papel').bg;
      expect(soft).not.toBe(arcade);
      expect(soft).not.toBe(papel);
      expect(arcade).not.toBe(papel);
    });

    it('soft usa cream cálido (#F0EEE9) como bg claro', () => {
      expect(coloresDelTema('soft').bg).toBe('#F0EEE9');
    });

    it('soft usa accent naranja saturado (#FF6B35)', () => {
      expect(coloresDelTema('soft').accent1).toBe('#FF6B35');
    });
  });

  describe('tipografiaDelTema', () => {
    it('soft usa Nunito (sans redondeada, cálida)', () => {
      const tokens = tipografiaDelTema('soft', 'tematica');
      expect(tokens.display).toBe('Nunito_600SemiBold');
      expect(tokens.body).toBe('Nunito_400Regular');
    });

    it('arcade usa Fredoka/Nunito', () => {
      const tokens = tipografiaDelTema('arcade', 'tematica');
      expect(tokens.display).toBe('Fredoka_600SemiBold');
      expect(tokens.body).toBe('Nunito_400Regular');
    });

    it('papel usa Lora/Karla (editorial)', () => {
      const tokens = tipografiaDelTema('papel', 'tematica');
      expect(tokens.display).toBe('Lora_600SemiBold');
      expect(tokens.body).toBe('Karla_400Regular');
    });

    it('preferencia sistema = tokens vacíos (usar fuente del sistema)', () => {
      expect(tipografiaDelTema('soft', 'sistema')).toEqual({});
      expect(tipografiaDelTema('arcade', 'sistema')).toEqual({});
      expect(tipografiaDelTema('papel', 'sistema')).toEqual({});
    });
  });

  describe('recetaBotonCalificacion con soft', () => {
    it('soft usa bordes redondeados tipo píldora', () => {
      const receta = recetaBotonCalificacion('soft', '#FF6B35');
      expect(receta.contenedor.borderRadius).toBeGreaterThanOrEqual(14);
    });
  });
});
