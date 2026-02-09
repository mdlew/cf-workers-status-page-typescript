#!/usr/bin/env node
/**
 * This script ensures that react and react-dom versions remain identical.
 * It should be run as a preinstall hook to prevent version mismatches.
 * 
 * During Dependabot updates, this check is skipped to allow temporary
 * version mismatches that occur during the dependency update process.
 */

const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const process = require('node:process');

// Detect if running in Dependabot context
// Dependabot sets DEPENDABOT environment variable during updates, or runs as dependabot[bot] actor
// We also check for the Dependabot updater home directory pattern via the HOME environment variable
const isDependabot = process.env.DEPENDABOT === 'true' || 
                     process.env.GITHUB_ACTOR === 'dependabot[bot]' ||
                     (process.env.CI && process.env.npm_config_ignore_scripts === 'true') ||
                     // Check if running in Dependabot updater container (HOME path includes /home/dependabot)
                     (process.env.HOME && process.env.HOME.includes('dependabot'));

if (isDependabot) {
  console.log('ℹ️  Dependabot environment detected - skipping React version check');
  process.exit(0);
}

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
