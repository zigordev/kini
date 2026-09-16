import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import { createTranslator, type Messages } from './translator';

const leafKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  );
};

describe('translation snapshots', () => {
  it('keeps English and Spanish key sets in parity', () => {
    expect(leafKeys(es).sort()).toEqual(leafKeys(en).sort());
  });

  it('interpolates named parameters', () => {
    expect(createTranslator(en as Messages)('pools.success_count', { count: 7 })).toBe(
      '7 successes'
    );
    expect(createTranslator(es as Messages)('pools.success_count', { count: 7 })).toBe(
      '7 aciertos'
    );
  });

  it('falls back to the key for unknown messages', () => {
    expect(createTranslator(en as Messages)('unknown.message')).toBe('unknown.message');
  });

  it('leaves a placeholder alone when no value is given for it', () => {
    expect(createTranslator(en as Messages)('pools.success_count')).toBe('{count} successes');
  });
});
