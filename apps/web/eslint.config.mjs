import { fixupConfigRules } from '@eslint/compat';
import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  {
    ignores: ['.next/**', 'next-env.d.ts', 'src/observability/**/*'],
  },
  ...fixupConfigRules([...nextCoreWebVitals, ...nextTypescript]),
  {
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  {
    files: ['next.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
