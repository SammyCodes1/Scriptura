// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      'scripts/**',
      'supabase/**',
    ],
  },
  expoConfig,
  {
    rules: {
      // Supabase Edge Functions use Deno-style URL imports.
      'import/no-unresolved': 'off',
      // React Native text frequently includes scripture quotes and apostrophes.
      'react/no-unescaped-entities': 'off',
      // Existing screens intentionally hydrate modal/stateful UI from effects.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]);