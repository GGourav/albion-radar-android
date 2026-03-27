const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Add local modules to watch paths
const modulesRoot = path.join(projectRoot, 'modules');
config.watchFolders = [modulesRoot];

// Add additional asset extensions
config.resolver.assetExts.push(
  // Add any additional extensions here
);

// Configure source extensions
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

module.exports = config;
