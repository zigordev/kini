import { readTeamStorage, writeTeamStorage } from './teamStorage';

export type PoolDefaults = {
  doubles: number;
  triples: number;
  elige8: boolean;
};

export const DEFAULT_POOL_DEFAULTS: PoolDefaults = {
  doubles: 6,
  triples: 0,
  elige8: false,
};

const DOUBLES_MAX = 14;
const TRIPLES_MAX = 9;

const storageKey = (teamId: string) => `kini-pool-defaults:${teamId}`;

const normalizePoolDefaults = (value: unknown): PoolDefaults => {
  const candidate =
    value && typeof value === 'object'
      ? (value as Partial<PoolDefaults>)
      : {};

  return {
    doubles:
      typeof candidate.doubles === 'number'
        ? Math.max(0, Math.min(DOUBLES_MAX, candidate.doubles))
        : DEFAULT_POOL_DEFAULTS.doubles,
    triples:
      typeof candidate.triples === 'number'
        ? Math.max(0, Math.min(TRIPLES_MAX, candidate.triples))
        : DEFAULT_POOL_DEFAULTS.triples,
    elige8:
      typeof candidate.elige8 === 'boolean'
        ? candidate.elige8
        : DEFAULT_POOL_DEFAULTS.elige8,
  };
};

export const readPoolDefaults = async (
  teamId?: string | null,
): Promise<PoolDefaults> => {
  if (!teamId) {
    return DEFAULT_POOL_DEFAULTS;
  }

  const raw = await readTeamStorage(storageKey(teamId));
  if (!raw) {
    return DEFAULT_POOL_DEFAULTS;
  }

  try {
    return normalizePoolDefaults(JSON.parse(raw));
  } catch {
    return DEFAULT_POOL_DEFAULTS;
  }
};

export const writePoolDefaults = async (
  teamId: string,
  defaults: PoolDefaults,
): Promise<void> => {
  await writeTeamStorage(
    storageKey(teamId),
    JSON.stringify(normalizePoolDefaults(defaults)),
  );
};
