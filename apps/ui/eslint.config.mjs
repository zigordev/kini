import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
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
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // next.config.js is loaded by Next's config loader as CommonJS, so it
    // has to use require() regardless of what the rest of the app does.
    files: ['next.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];

export default eslintConfig;
