module.exports = {
  preset: 'jest-expo',
  // Las carpetas `implementacion*` son paquetes de staging que Claude Design
  // entrega para copiar a mano: sus archivos son copias fuera del árbol de
  // imports, así que sus tests fallan al resolver rutas relativas y sus
  // duplicados ensucian el conteo. No son código de la app.
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/implementacion'],
};
