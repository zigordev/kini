import { describe, expect, it } from 'vitest';
import { DEFAULT_POOL_DEFAULTS, normalizePoolDefaults } from './preferences';

describe('normalizePoolDefaults', () => {
  it('uses the product defaults for malformed input', () => {
    expect(normalizePoolDefaults(null)).toEqual(DEFAULT_POOL_DEFAULTS);
  });

  it('clamps integer limits and preserves the E8 preference', () => {
    expect(
      normalizePoolDefaults({ doubles: 99.9, triples: -3, elige8: true }),
    ).toEqual({ doubles: 14, triples: 0, elige8: true });
  });
});
