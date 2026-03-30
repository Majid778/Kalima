const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('db');

// Force Metro to resolve .js (CJS) over .mjs (ESM) for web
// Zustand's ESM build uses import.meta.env which Metro doesn't support
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

module.exports = config;
