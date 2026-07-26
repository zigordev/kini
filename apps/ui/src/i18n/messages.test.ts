import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import { translate } from './messages';

const leafKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe('translation snapshots', () => {
  it('keeps English and Spanish key sets in parity', () => {
    expect(leafKeys(es).sort()).toEqual(leafKeys(en).sort());
  });

  it('interpolates named parameters', () => {
    expect(translate('en', 'pools.success_count', { count: 7 })).toBe(
      '7 successes',
    );
    expect(translate('es', 'pools.success_count', { count: 7 })).toBe(
      '7 aciertos',
    );
  });

  it('falls back to the key for unknown messages', () => {
    expect(translate('en', 'unknown.message')).toBe('unknown.message');
  });
});
