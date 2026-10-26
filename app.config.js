// Configuración dinámica: parte de app.json y solo cambia la ruta base de la
// alfa (ADR-039). `EXPO_PUBLIC_CANAL=alfa` la publica bajo /alpha/ del mismo
// sitio; sin él, todo queda exactamente como en app.json.
module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_CANAL !== 'alfa') return config;
  const base = config.experiments?.baseUrl ?? '';
  return {
    ...config,
    name: `${config.name} alfa`,
    experiments: { ...config.experiments, baseUrl: `${base}/alpha` },
  };
};
