import path from 'node:path';

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Vitest, not Jest — one runner across the estate.
 *
 * The SWC plugin is not optional here. Vitest transforms with esbuild by
 * default and esbuild does not implement `emitDecoratorMetadata`, so Nest's
 * dependency injection has no type information to resolve providers from and
 * every `Test.createTestingModule` in this suite fails. SWC implements it.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../coverage',
      include: ['src/**/*.ts'],
    },
  },
  resolve: {
    // Replaces the Jest `moduleNameMapper` for `^src/(.*)$`.
    alias: { src: path.resolve(__dirname, 'src') },
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
