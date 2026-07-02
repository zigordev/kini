import { resolveApiUrl } from '../config/api';
import { AuthenticatedUser } from '../types/auth';
import { throwForErrorResponse } from '../utils/api-helpers';

const USERS_BASE_URL = resolveApiUrl('/users');

export interface UserSummary {
  id: string;
  name: string;
  textColor?: string;
  backgroundColor?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  textColor?: string;
  backgroundColor?: string;
  language?: 'en' | 'es';
  theme?: 'light' | 'dark';
  activeTeamId?: string | null;
}

export const updateUser = async (
  updateData: UpdateUserRequest,
): Promise<AuthenticatedUser> => {
  const response = await fetch(`${USERS_BASE_URL}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updateData),
  });

  await throwForErrorResponse(response);
  return (await response.json()) as AuthenticatedUser;
};

export const updateLanguage = async (
  language: 'en' | 'es',
): Promise<AuthenticatedUser> => {
  return updateUser({ language });
};

export const updateTheme = async (
  theme: 'light' | 'dark',
): Promise<AuthenticatedUser> => {
  return updateUser({ theme });
};

export const updateActiveTeam = async (
  activeTeamId: string | null,
): Promise<AuthenticatedUser> => {
  return updateUser({ activeTeamId });
};

export const listUsers = async (): Promise<UserSummary[]> => {
  const response = await fetch(`${USERS_BASE_URL}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  await throwForErrorResponse(response);
  return (await response.json()) as UserSummary[];
};
