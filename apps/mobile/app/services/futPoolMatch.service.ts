import { resolveApiUrl } from '../config/api';
import FutPoolMatch from '../types/futPoolMatch';
import { throwForErrorResponse } from '../utils/api-helpers';

const FUT_POOL_MATCH_ENDPOINT = resolveApiUrl('/fut-pool-match');

export const updateMatch = async (
  matchId: string,
  value: Partial<FutPoolMatch>,
) => {
  try {
    const endpoint = `${FUT_POOL_MATCH_ENDPOINT}/${encodeURIComponent(matchId)}`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(value),
    });

    await throwForErrorResponse(response);
    return await response.json();
  } catch (error) {
    console.error(`Failed to update match ${matchId}:`, error);
    throw error;
  }
};
