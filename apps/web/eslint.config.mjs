import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  {
    ignores: [
      // `next lint` always excluded these by default; a plain `eslint .`
      // does not, so they need to be explicit now that it's gone.
      '.next/**',
      'next-env.d.ts',
      // Vendored from platform-ops and formatted there. Each repo's
      // prettier config differs slightly, so linting a generated file
      // here only ever produces churn the sync script would overwrite.
      'src/observability/**/*',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  {
    // next.config.js is loaded by Next's config loader as CommonJS, so it
    // has to use require() regardless of what the rest of the app does.
    files: ['next.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
