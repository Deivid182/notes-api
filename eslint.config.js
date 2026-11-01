// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'data', 'infra', '.husky'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // Scripts de Node en JS plano (no pasan por tsc).
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },

  {
    files: ['**/*.ts'],
    plugins: { 'import-x': importX },
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.json',
        }),
      ],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': 'off',
      // `#modules/*` ya agrega `.js` en el mapa `imports` de package.json: con extensión
      // funciona en dev (alias) pero rompe en dist (`x.js.js`).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^#modules/.*\\.js$',
              message: 'Imports con alias #modules no llevan extensión .js.',
            },
          ],
        },
      ],

      // Orden de imports: builtin, external, internal, parent, sibling, index
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-cycle': ['error', { maxDepth: 10, ignoreExternal: true }],
    },
  },

  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'import-x/no-cycle': 'off',
    },
  },

  prettier,
);
