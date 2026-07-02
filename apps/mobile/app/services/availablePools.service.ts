import { resolveApiUrl } from '../config/api';
import {
  AvailablePool,
  AvailablePoolJackpot,
} from '../types/availablePool';
import FutPoolSnapshot from '../types/futPool';
import { throwForErrorResponse } from '../utils/api-helpers';

const AVAILABLE_POOLS_ENDPOINT = resolveApiUrl('/available-pools');

export const fetchAvailablePools = async (): Promise<AvailablePool[]> => {
  const response = await fetch(AVAILABLE_POOLS_ENDPOINT, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  await throwForErrorResponse(response);
  return (await response.json()) as AvailablePool[];
};

export const syncAvailablePools = async (): Promise<AvailablePool[]> => {
  const response = await fetch(`${AVAILABLE_POOLS_ENDPOINT}/sync`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  await throwForErrorResponse(response);
  return (await response.json()) as AvailablePool[];
};

export const fetchAvailablePoolJackpot =
  async (): Promise<AvailablePoolJackpot> => {
    const response = await fetch(`${AVAILABLE_POOLS_ENDPOINT}/jackpot`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    await throwForErrorResponse(response);
    return (await response.json()) as AvailablePoolJackpot;
  };

export const addAvailablePoolToTeam = async (
  availablePoolId: string,
  teamId: string,
): Promise<FutPoolSnapshot> => {
  const response = await fetch(
    `${AVAILABLE_POOLS_ENDPOINT}/${encodeURIComponent(availablePoolId)}/add-to-team`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ teamId }),
    },
  );

  await throwForErrorResponse(response);
  return (await response.json()) as FutPoolSnapshot;
};

export const updateAvailablePoolMatchResult = async (
  availablePoolId: string,
  order: number,
  officialResults: string[],
): Promise<AvailablePool> => {
  const response = await fetch(
    `${AVAILABLE_POOLS_ENDPOINT}/${encodeURIComponent(availablePoolId)}/matches/${encodeURIComponent(String(order))}/result`,
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ officialResults }),
    },
  );

  await throwForErrorResponse(response);
  return (await response.json()) as AvailablePool;
};
