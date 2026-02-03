import antfu from '@antfu/eslint-config';

export default antfu({
  react: true,
  typescript: true,
  formatters: false, // Disable formatters to avoid conflicts with existing code style
  stylistic: false, // Disable stylistic rules to avoid conflicts
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/.github/**',
    '**/public/**',
    '*.md',
  ],
}, {
  rules: {
    // Disable React 19 migration warnings to avoid breaking changes
    'react/no-context-provider': 'off',
    'react/no-forward-ref': 'off',
    'react/no-use-context': 'off',
  },
});
