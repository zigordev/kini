import type { PoolDefaults } from '@/types/domain';

export const DEFAULT_POOL_DEFAULTS: PoolDefaults = {
  doubles: 6,
  triples: 0,
  elige8: false,
};

const clamp = (value: unknown, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.trunc(value)))
    : fallback;

export const normalizePoolDefaults = (value: unknown): PoolDefaults => {
  const candidate =
    value && typeof value === 'object' ? (value as Partial<PoolDefaults>) : {};

  return {
    doubles: clamp(candidate.doubles, 14, DEFAULT_POOL_DEFAULTS.doubles),
    triples: clamp(candidate.triples, 9, DEFAULT_POOL_DEFAULTS.triples),
    elige8:
      typeof candidate.elige8 === 'boolean'
        ? candidate.elige8
        : DEFAULT_POOL_DEFAULTS.elige8,
  };
};

export const readPoolDefaults = (teamId?: string | null): PoolDefaults => {
  if (!teamId || typeof window === 'undefined') {
    return DEFAULT_POOL_DEFAULTS;
  }
  try {
    const value = window.localStorage.getItem(`kini-pool-defaults:${teamId}`);
    return value
      ? normalizePoolDefaults(JSON.parse(value))
      : DEFAULT_POOL_DEFAULTS;
  } catch {
    return DEFAULT_POOL_DEFAULTS;
  }
};

export const writePoolDefaults = (
  teamId: string,
  defaults: PoolDefaults,
): void => {
  window.localStorage.setItem(
    `kini-pool-defaults:${teamId}`,
    JSON.stringify(normalizePoolDefaults(defaults)),
  );
};
