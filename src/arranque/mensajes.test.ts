import { mensajeDeErrorDeDatos } from './mensajes';

describe('mensajeDeErrorDeDatos', () => {
  it('Safari sin almacenamiento (navegación privada) no es culpa de otra pestaña', () => {
    const m = mensajeDeErrorDeDatos(
      'Error: UnknownError: The operation failed for an unknown transient reason (e.g. out of memory).',
    );
    expect(m.titulo).toBe('Safari no dejó guardar tus datos');
    expect(m.texto).toContain('navegación privada');
    expect(m.texto).not.toContain('otra pestaña');
  });

  it('OPFS ocupado apunta a otra pestaña abierta', () => {
    const m = mensajeDeErrorDeDatos('NoModificationAllowedError: Failed to execute createSyncAccessHandle');
    expect(m.titulo).toBe('No pude abrir tus datos');
    expect(m.texto).toContain('otra pestaña');
  });

  it('cualquier otro error: tranquiliza y propone reintentar', () => {
    const m = mensajeDeErrorDeDatos('Error: algo raro');
    expect(m.titulo).toBe('No pude abrir tus datos');
    expect(m.texto).toContain('Tus datos no se borran por esto');
  });
});
