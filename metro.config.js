const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('db');

// Force Metro to resolve .js (CJS) over .mjs (ESM) for web
// Zustand's ESM build uses import.meta.env which Metro doesn't support
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

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
