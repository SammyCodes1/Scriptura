// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm and db support for expo-sqlite web & bundled databases
config.resolver.assetExts.push('wasm', 'db');

module.exports = config;
