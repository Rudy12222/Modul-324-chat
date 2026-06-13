import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['build/**', 'node_modules/**'],
  },
  {
    ...pluginJs.configs.recommended,
    files: ['client/**/*.js'],
    languageOptions: {
      ...pluginJs.configs.recommended.languageOptions,
      globals: globals.browser,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['server/**/*.ts'],
    languageOptions: {
      ...config.languageOptions,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  })),
];
