#!/usr/bin/env node
/**
 * This script ensures that react and react-dom versions remain identical.
 * It should be run as a preinstall hook to prevent version mismatches.
 */

const { readFileSync } = require('fs');
const { join } = require('path');

const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const reactVersion = packageJson.dependencies?.react;
const reactDomVersion = packageJson.dependencies?.['react-dom'];

if (!reactVersion || !reactDomVersion) {
  console.error('Error: Both react and react-dom must be specified in dependencies');
  process.exit(1);
}

// Normalize versions for comparison (remove ^ or ~ prefixes if present)
const normalizeVersion = (version) => {
  return version.replace(/^[\^~]/, '');
};

const normalizedReact = normalizeVersion(reactVersion);
const normalizedReactDom = normalizeVersion(reactDomVersion);

if (normalizedReact !== normalizedReactDom) {
  console.error('\n❌ React version mismatch detected!');
  console.error(`   react: ${reactVersion}`);
  console.error(`   react-dom: ${reactDomVersion}`);
  console.error('\nReact and react-dom versions must be identical.');
  console.error('Please update package.json to use the same version for both packages.\n');
  process.exit(1);
}

console.log(`✓ React versions are synchronized (${reactVersion})`);
