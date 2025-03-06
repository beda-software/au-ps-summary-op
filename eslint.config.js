import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import eslint from '@eslint/js';

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  files: ['**/*.{ts,tsx}', '**/*.d.ts'],
  extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
});
