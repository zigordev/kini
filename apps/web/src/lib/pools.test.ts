import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FutPool } from '@/types/domain';
import { formatDate, poolOutcome, poolStatus } from './pools';

const pool = (update: Partial<FutPool> = {}): FutPool => ({
  id: 'pool-1',
  name: 'Pool',
  date: '2026-08-01',
  matches: [],
  elige8: false,
  doubles: 6,
  triples: 0,
  active: true,
  ...update,
});

describe('pool helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('honors an explicit API status', () => {
    expect(poolStatus(pool({ status: 'closed' }))).toBe('closed');
  });

  it('derives programmed, active, and closed states when needed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-26T10:00:00.000Z'));

    expect(poolStatus(pool({ date: '2026-07-27', active: true }))).toBe(
      'programmed',
    );
    expect(poolStatus(pool({ date: '2026-07-25', active: true }))).toBe(
      'active',
    );
    expect(poolStatus(pool({ active: false }))).toBe('closed');
  });

  it('calculates only resolved matches in the success rate', () => {
    const result = poolOutcome(
      pool({
        matches: [
          { id: '1', success: true },
          { id: '2', success: true },
          { id: '3', success: false },
          { id: '4', success: null },
        ] as FutPool['matches'],
      }),
    );

    expect(result).toEqual({
      successes: 2,
      failures: 1,
      pending: 1,
      successRate: 67,
    });
  });

  it('keeps invalid date values readable', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
