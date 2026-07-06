const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Disable watching of node_modules
config.watchFolders = [];

// Exclude heavy directories from resolution
config.resolver.blockList = [
  /node_modules\/.*\/node_modules/,
  /\.expo\/.*/,
  /\.git\/.*/,
];

// Simplify transform options
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Reduce workers
config.maxWorkers = 1;

module.exports = config;

