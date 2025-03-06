import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    importPlugin.flatConfigs.recommended,
    tseslint.configs.recommended,
);
