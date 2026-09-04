import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Vendored from platform-ops and formatted there. Each repo's prettier
    // config differs slightly, so linting a generated file here only ever
    // produces churn the sync script would overwrite.
    ignores: ['eslint.config.mjs', 'src/observability/**'],
  },
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
