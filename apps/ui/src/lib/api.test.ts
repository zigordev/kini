import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  authApi,
  availablePoolsApi,
  poolsApi,
  teamsApi,
} from './api';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('API client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps an unauthenticated session response to null', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: 'Unauthorized' }, 401),
    );

    await expect(authApi.me()).resolves.toBeNull();
  });

  it('supports successful no-content responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(authApi.logout()).resolves.toBeUndefined();
  });

  it('normalizes structured server errors', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          message: ['Email is invalid', 'Name is required'],
          code: 'VALIDATION.FAILED',
          params: { field: 'email' },
        },
        400,
      ),
    );

    const error = await teamsApi.list().catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: 'Email is invalid, Name is required',
      status: 400,
      code: 'VALIDATION.FAILED',
      params: { field: 'email' },
    });
  });

  it('sends JSON mutations with credentials', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 'team-1',
        name: 'Weekend',
        ownerId: 'user-1',
        role: 'admin',
        createdAt: '2026-07-26T00:00:00.000Z',
        updatedAt: '2026-07-26T00:00:00.000Z',
      }),
    );

    await teamsApi.create('Weekend');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/teams$/);
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ name: 'Weekend' }),
    });
    expect(new Headers(init?.headers).get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('encodes pool list filters into the request URL', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [],
        meta: {
          total: 0,
          page: 2,
          limit: 25,
          totalPages: 1,
          sortBy: 'date',
          sortOrder: 'desc',
        },
      }),
    );

    await poolsApi.list('team with spaces', 2, 25);

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.pathname).toBe('/fut-pool');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      teamId: 'team with spaces',
      page: '2',
      limit: '25',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('encodes available-pool path segments and result payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'pool/1', matches: [] }),
    );

    await availablePoolsApi.updateResult('pool/1', 15, ['M']);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(
      /\/available-pools\/pool%2F1\/matches\/15\/result$/,
    );
    expect(init?.body).toBe(JSON.stringify({ officialResults: ['M'] }));
  });
});
