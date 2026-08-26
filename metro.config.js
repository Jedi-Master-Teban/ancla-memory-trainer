const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permitir que Metro empaquete el binario WASM que expo-sqlite usa en web
// (wa-sqlite). Sin esto, `expo export --platform web` falla al resolverlo.
config.resolver.assetExts.push('wasm');

module.exports = config;
