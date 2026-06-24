import { resolveApiUrl } from '../config/api';
import FutPoolSnapshot from '../types/futPool';
import Stats from '../types/stats';
import { throwForErrorResponse } from '../utils/api-helpers';

const FUT_POOLS_ENDPOINT = resolveApiUrl('/fut-pool');

interface FetchPoolsOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedPoolsResponse {
  data: FutPoolSnapshot[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export const featchPools = async (
  options: FetchPoolsOptions = {},
): Promise<PaginatedPoolsResponse | null> => {
  try {
    const {
      page = 1,
      limit = 1,
      sortBy = 'date',
      sortOrder = 'desc',
    } = options;
    const url = new URL(FUT_POOLS_ENDPOINT);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('sortOrder', sortOrder);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    await throwForErrorResponse(response);

    const payload = await response.json();

    if (!payload?.data || !Array.isArray(payload.data)) {
      return null;
    }

    return {
      data: payload.data,
      meta: payload.meta,
    };
  } catch (error) {
    console.error('Failed to fetch remote quinielas:', error);
    throw error;
  }
};

export const fetchStats = async (): Promise<Stats> => {
  const response = await fetch(`${FUT_POOLS_ENDPOINT}/stats`, {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  await throwForErrorResponse(response);

  const payload = await response.json();
  const stats = (payload?.data ?? payload) as Stats;

  return stats;
};

export const updatePoolDoubles = async (poolId: string, doubles: number) => {
  try {
    const endpoint = `${FUT_POOLS_ENDPOINT}/${encodeURIComponent(poolId)}`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ doubles }),
    });

    await throwForErrorResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Failed to update pool doubles:', error);
    throw error;
  }
};

export const updatePoolTriples = async (poolId: string, triples: number) => {
  try {
    const endpoint = `${FUT_POOLS_ENDPOINT}/${encodeURIComponent(poolId)}`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ triples }),
    });

    await throwForErrorResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Failed to update pool triples:', error);
    throw error;
  }
};

export const updatePoolElige8 = async (poolId: string, elige8: boolean) => {
  try {
    const endpoint = `${FUT_POOLS_ENDPOINT}/${encodeURIComponent(poolId)}`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ elige8 }),
    });

    await throwForErrorResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Failed to update pool elige8:', error);
    throw error;
  }
};

type UpdatePoolDetailsPayload = {
  description?: string;
  doubles?: number;
  triples?: number;
  elige8?: boolean;
  active?: boolean;
  date?: string;
  earning?: number;
};

type CreateMatchPayload = {
  order: number;
  homeTeam: string;
  awayTeam: string;
  userId?: string;
};

type CreatePoolPayload = {
  doubles: number;
  triples?: number;
  elige8?: boolean;
  active?: boolean;
  date: string;
  earning?: number;
  matches?: CreateMatchPayload[];
};

export const updatePoolDetails = async (
  poolId: string,
  payload: UpdatePoolDetailsPayload,
) => {
  try {
    const endpoint = `${FUT_POOLS_ENDPOINT}/${encodeURIComponent(poolId)}`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    await throwForErrorResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Failed to update pool details:', error);
    throw error;
  }
};

export const createPool = async (payload: CreatePoolPayload) => {
  try {
    const response = await fetch(FUT_POOLS_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    await throwForErrorResponse(response);
    return await response.json();
  } catch (error) {
    console.error('Failed to create pool:', error);
    throw error;
  }
};
