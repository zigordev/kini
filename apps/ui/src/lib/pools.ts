import type { FutPool, ResultValue } from '@/types/domain';

export const regularResults: ResultValue[] = ['1', 'X', '2'];
export const full15Results: ResultValue[] = ['0', '1', '2', 'M'];

export const poolStatus = (pool: FutPool) => {
  if (pool.status) return pool.status;
  if (!pool.active) return 'closed' as const;
  return new Date(pool.date).getTime() > Date.now()
    ? ('programmed' as const)
    : ('active' as const);
};

export const poolOutcome = (pool: FutPool) => {
  const matches = Array.isArray(pool.matches) ? pool.matches : [];
  const successes = matches.filter((match) => match.success === true).length;
  const failures = matches.filter((match) => match.success === false).length;
  const pending = Math.max(0, matches.length - successes - failures);
  const resolved = successes + failures;
  return {
    successes,
    failures,
    pending,
    successRate: resolved ? Math.round((successes / resolved) * 100) : 0,
  };
};

export const formatDate = (
  value: string,
  locale = 'en',
  includeTime = false,
) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(date);
};

export const todayInputValue = () => new Date().toISOString().slice(0, 10);
