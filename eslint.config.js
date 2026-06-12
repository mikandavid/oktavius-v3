import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import noForbiddenTailwindClasses from './apps/web/eslint-rules/no-forbidden-tailwind-classes.mjs';
import maxDetailTabsTriggers from './apps/web/eslint-rules/max-detail-tabs-triggers.mjs';
import maxListFilters from './apps/web/eslint-rules/max-list-filters.mjs';
import noBareJsxStrings from './apps/web/eslint-rules/no-bare-jsx-strings.mjs';

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
  allowTypeImports: true,
};

const phosphorImportRestriction = {
  name: '@phosphor-icons/react',
  message: 'Import icons from @/lib/icons only.',
  allowTypeImports: true,
};

const oktaviusUiPlugin = {
  rules: {
    'no-forbidden-tailwind-classes': noForbiddenTailwindClasses,
    'max-detail-tabs-triggers': maxDetailTabsTriggers,
    'max-list-filters': maxListFilters,
    'no-bare-jsx-strings': noBareJsxStrings,
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
      'simple-import-sort': simpleImportSort,
      oktavius: oktaviusUiPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.tsx', 'packages/base-ui/src/**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Our form controls (base-ui) render native inputs / Radix controls internally.
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          controlComponents: [
            'Input',
            'Checkbox',
            'Switch',
            'Combobox',
            'MultiSelect',
            'NumberInput',
            'PhoneInput',
            'FileInput',
            'DatePicker',
            'DateRangePicker',
            'TagsInput',
            'Textarea',
            'RadioGroup',
          ],
          // label text often sits inside layout wrappers (label > div > div > span)
          depth: 5,
        },
      ],
      // autoFocus on our own components is deliberate focus management (dialog/quick-create forms);
      // only flag it on native DOM elements.
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },
  {
    files: ['packages/base-ui/src/components/split-view.tsx'],
    rules: {
      // ARIA window-splitter pattern: a focusable separator with full keyboard support
      // is the correct role for a resize handle; jsx-a11y does not model this pattern.
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'off',
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    rules: {
      'oktavius/no-forbidden-tailwind-classes': 'error',
      // The @typescript-eslint variant allows type-only imports of restricted names.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [phosphorImportRestriction, selectImportRestriction],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/modules/**/*DetailPage.tsx', 'apps/web/src/components/detail/**/*.tsx'],
    ignores: ['**/showcase/**'],
    rules: {
      'oktavius/max-detail-tabs-triggers': 'error',
    },
  },
  {
    files: ['apps/web/src/modules/**/*.{ts,tsx}'],
    ignores: ['**/showcase/**'],
    rules: {
      'oktavius/max-list-filters': 'error',
      'oktavius/no-bare-jsx-strings': 'warn',
    },
  },
  {
    files: ['apps/web/src/lib/icons.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
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
