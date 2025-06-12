const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('cjs');

// Configure resolver to handle node modules properly
config.resolver.nodeModulesPaths = [
  './node_modules',
];

// Handle platform-specific extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 