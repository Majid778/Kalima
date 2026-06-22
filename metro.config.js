const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('db');

// Force Metro to resolve .js (CJS) over .mjs (ESM) for web
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

// Web-only: Add an alias for expo-sqlite to prevent .wasm bundling
// Metro on web will prefer our .web.ts shim over the native module
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Add COOP/COEP headers for SharedArrayBuffer (required by react-native-reanimated on web)
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
