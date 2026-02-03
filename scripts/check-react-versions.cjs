#!/usr/bin/env node
/**
 * This script ensures that react and react-dom versions remain identical.
 * It should be run as a preinstall hook to prevent version mismatches.
 */

const { readFileSync } = require('node:fs');
const { join } = require('node:path');

try {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const reactVersion = packageJson.dependencies?.react;
  const reactDomVersion = packageJson.dependencies?.['react-dom'];

  if (!reactVersion || !reactDomVersion) {
    console.error('Error: Both react and react-dom must be specified in dependencies');
    process.exit(1);
  }

  // For validation, we require exact version match including any range specifiers
  // This ensures that both packages use identical version constraints
  if (reactVersion !== reactDomVersion) {
    console.error('\n❌ React version mismatch detected!');
    console.error(`   react: ${reactVersion}`);
    console.error(`   react-dom: ${reactDomVersion}`);
    console.error('\nReact and react-dom versions must be identical.');
    console.error('Please update package.json to use the same version for both packages.\n');
    process.exit(1);
  }

  console.log(`✓ React versions are synchronized (${reactVersion})`);
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Error: package.json contains invalid JSON');
  } else if (error.code === 'ENOENT') {
    console.error('Error: package.json not found in current directory');
  } else {
    console.error('Error reading package.json:', error.message);
  }
  process.exit(1);
}
