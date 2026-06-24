import { resolveApiUrl } from '../config/api';
import { throwForErrorResponse } from '../utils/api-helpers';

const NOTIF_BASE_URL = resolveApiUrl('/notifications');

export const registerPushToken = async (
  token: string,
  platform?: string,
): Promise<void> => {
  const response = await fetch(`${NOTIF_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, platform }),
  });
  await throwForErrorResponse(response);
};

export const unregisterPushToken = async (token: string): Promise<void> => {
  const response = await fetch(`${NOTIF_BASE_URL}/unregister`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });
  await throwForErrorResponse(response);
};
