import type {
  AuthenticatedUser,
  AvailablePool,
  AvailablePoolJackpot,
  FutPool,
  PoolForm,
  ResultValue,
  Stats,
  Team,
  UserSummary,
} from '@/types/domain';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3012'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly params?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
      code?: string;
      params?: Record<string, unknown>;
    } | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message;
    throw new ApiError(
      message || `Request failed (${response.status})`,
      response.status,
      payload?.code,
      payload?.params,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const authApi = {
  me: async () => {
    try {
      return await request<AuthenticatedUser>('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },
  googleConfig: () =>
    request<{ enabled?: boolean; clientId?: string }>('/auth/google/config'),
  loginUrl: (callbackUrl: string) => {
    const url = new URL(`${API_BASE_URL}/auth/google`);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('failure_redirect', callbackUrl);
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  },
  logout: async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
    }
  },
};

export const teamsApi = {
  list: () => request<Team[]>('/teams'),
  create: (name: string) =>
    request<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  invite: (teamId: string, email: string) =>
    request<void>(`/teams/${encodeURIComponent(teamId)}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  accept: async (teamId: string) => {
    const response = await request<{ team: Team }>(
      `/teams/${encodeURIComponent(teamId)}/accept-invitation`,
      { method: 'POST' },
    );
    return response.team;
  },
};

export const usersApi = {
  list: () => request<UserSummary[]>('/users'),
  update: (payload: Partial<AuthenticatedUser>) =>
    request<AuthenticatedUser>('/users', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export interface PoolsPage {
  data: FutPool[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export const poolsApi = {
  list: (teamId: string, page = 1, limit = 20) => {
    const query = new URLSearchParams({
      teamId,
      page: String(page),
      limit: String(limit),
      sortBy: 'date',
      sortOrder: 'desc',
    });
    return request<PoolsPage>(`/fut-pool?${query}`);
  },
  stats: (teamId: string) =>
    request<Stats>(`/fut-pool/stats?teamId=${encodeURIComponent(teamId)}`),
  create: (payload: PoolForm) =>
    request<FutPool>('/fut-pool', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (poolId: string, payload: Partial<PoolForm>) =>
    request<FutPool>(`/fut-pool/${encodeURIComponent(poolId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateMatch: (
    matchId: string,
    payload: {
      results?: ResultValue[];
      elige8?: boolean;
      userId?: string;
      homeTeam?: string;
      awayTeam?: string;
    },
  ) =>
    request<FutPoolMatchResponse>(
      `/fut-pool-match/${encodeURIComponent(matchId)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    ),
  checkResults: (poolId: string) =>
    request<FutPool>(
      `/available-pools/team-pools/${encodeURIComponent(poolId)}/check-results`,
      { method: 'POST' },
    ),
};

type FutPoolMatchResponse = FutPool['matches'][number];

export const availablePoolsApi = {
  list: () => request<AvailablePool[]>('/available-pools'),
  sync: () =>
    request<AvailablePool[]>('/available-pools/sync', { method: 'POST' }),
  jackpot: () => request<AvailablePoolJackpot>('/available-pools/jackpot'),
  addToTeam: (availablePoolId: string, teamId: string) =>
    request<FutPool>(
      `/available-pools/${encodeURIComponent(availablePoolId)}/add-to-team`,
      { method: 'POST', body: JSON.stringify({ teamId }) },
    ),
  updateResult: (
    availablePoolId: string,
    order: number,
    officialResults: ResultValue[],
  ) =>
    request<AvailablePool>(
      `/available-pools/${encodeURIComponent(availablePoolId)}/matches/${order}/result`,
      { method: 'PATCH', body: JSON.stringify({ officialResults }) },
    ),
};
