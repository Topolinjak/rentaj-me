import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['src/generated/', 'node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Express prepozna error handler po štirih parametrih, zato je neuporabljen `next` nujen.
      'no-unused-vars': ['error', { argsIgnorePattern: '^(next|_)' }],
    },
  },
  // Pravila za oblikovanje kode prepusti Prettierju.
  prettier,
];
