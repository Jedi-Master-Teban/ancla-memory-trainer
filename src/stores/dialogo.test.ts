import { avisar, confirmar, preguntar, useDialogoStore } from './dialogo';

const actual = () => useDialogoStore.getState().cola[0];
const responder = (valor: boolean) => useDialogoStore.getState().responder(valor);

describe('diálogos propios', () => {
  afterEach(() => useDialogoStore.setState({ cola: [] }));

  it('confirmar resuelve con el botón pulsado', async () => {
    const promesa = confirmar({ titulo: 'Eliminar lista', accion: 'Eliminar', destructiva: true });
    expect(actual().botones.map((b) => [b.texto, b.estilo])).toEqual([
      ['Cancelar', 'secundario'],
      ['Eliminar', 'destructivo'],
    ]);
    responder(true);
    await expect(promesa).resolves.toBe(true);
    expect(actual()).toBeUndefined();
  });

  it('cancelar resuelve false', async () => {
    const promesa = confirmar({ titulo: '¿Seguro?', accion: 'Sí' });
    responder(false);
    await expect(promesa).resolves.toBe(false);
  });

  it('si llegan dos a la vez, se muestran en orden', async () => {
    const primero = avisar({ titulo: 'Uno' });
    const segundo = confirmar({ titulo: 'Dos', accion: 'Vale' });
    expect(actual().titulo).toBe('Uno');
    responder(true);
    await primero;
    expect(actual().titulo).toBe('Dos');
    responder(true);
    await expect(segundo).resolves.toBe(true);
  });

  it('preguntar admite botones propios', async () => {
    const promesa = preguntar({
      titulo: 'Tu respaldo está listo',
      botones: [{ texto: 'Guardar respaldo', estilo: 'principal', valor: true }],
    });
    expect(actual().botones).toHaveLength(1);
    responder(true);
    await expect(promesa).resolves.toBe(true);
  });

  it('responder sin diálogo abierto no rompe nada', () => {
    expect(() => responder(true)).not.toThrow();
  });
});
