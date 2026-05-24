import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import noForbiddenTailwindClasses from './apps/web/eslint-rules/no-forbidden-tailwind-classes.mjs';

const selectImportRestriction = {
  name: '@oktavius/base-ui',
  importNames: [
    'Select',
    'SelectTrigger',
    'SelectContent',
    'SelectItem',
    'SelectValue',
    'SelectGroup',
    'SelectLabel',
    'SelectSeparator',
  ],
  message: 'Use Combobox instead of Select in apps/web.',
};

const phosphorImportRestriction = {
  name: '@phosphor-icons/react',
  message: 'Import icons from @/lib/icons only.',
};

const oktaviusUiPlugin = {
  rules: {
    'no-forbidden-tailwind-classes': noForbiddenTailwindClasses,
  },
};

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'apps/web/dist/**'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      oktavius: oktaviusUiPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    rules: {
      'oktavius/no-forbidden-tailwind-classes': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [phosphorImportRestriction, selectImportRestriction],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/lib/icons.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [selectImportRestriction],
        },
      ],
    },
  },
  {
    files: ['packages/base-ui/src/**/*.{ts,tsx}'],
    rules: {
      'oktavius/no-forbidden-tailwind-classes': 'error',
    },
  },
  eslintConfigPrettier,
);
