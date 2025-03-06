import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import sort from 'eslint-plugin-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  sort.configs['flat/recommended'],
  {
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
    files: ['**/*.{ts,tsx}', '**/*.d.ts'],
  },
  {
    rules: {
      'sort/object-properties': 'off',
    },
  },
);
