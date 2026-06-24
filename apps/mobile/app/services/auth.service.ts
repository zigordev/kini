import { resolveApiUrl } from '../config/api';
import { AuthenticatedUser } from '../types/auth';
import { throwForErrorResponse } from '../utils/api-helpers';

const AUTH_BASE_URL = resolveApiUrl('/auth');

export const fetchSessionUser = async (): Promise<AuthenticatedUser | null> => {
  const response = await fetch(`${AUTH_BASE_URL}/me`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  await throwForErrorResponse(response);
  return (await response.json()) as AuthenticatedUser;
};

export const logout = async (): Promise<void> => {
  const response = await fetch(`${AUTH_BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (response.status === 401 || response.status === 204) {
    return;
  }

  await throwForErrorResponse(response);
};

export interface GoogleConfig {
  clientId?: string;
  scopes: string[];
  mobileRedirectUri?: string | null;
  enabled?: boolean;
}

export const fetchGoogleConfig = async (): Promise<GoogleConfig> => {
  const response = await fetch(`${AUTH_BASE_URL}/google/config`, {
    headers: { Accept: 'application/json' },
  });

  await throwForErrorResponse(response);
  return (await response.json()) as GoogleConfig;
};

export const exchangeMobileSession = async (token: string): Promise<void> => {
  const response = await fetch(`${AUTH_BASE_URL}/mobile/session`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });

  await throwForErrorResponse(response);
};
