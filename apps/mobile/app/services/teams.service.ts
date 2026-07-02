import { resolveApiUrl } from '../config/api';
import { Team } from '../types/team';
import { throwForErrorResponse } from '../utils/api-helpers';

const TEAMS_ENDPOINT = resolveApiUrl('/teams');

export const fetchTeams = async (): Promise<Team[]> => {
  const response = await fetch(TEAMS_ENDPOINT, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  await throwForErrorResponse(response);
  return (await response.json()) as Team[];
};

export const createTeam = async (name: string): Promise<Team> => {
  const response = await fetch(TEAMS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });

  await throwForErrorResponse(response);
  return (await response.json()) as Team;
};

export const inviteTeamUser = async (
  teamId: string,
  email: string,
): Promise<void> => {
  const response = await fetch(
    `${TEAMS_ENDPOINT}/${encodeURIComponent(teamId)}/invite`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    },
  );

  await throwForErrorResponse(response);
};

export const acceptTeamInvitation = async (teamId: string): Promise<Team> => {
  const response = await fetch(
    `${TEAMS_ENDPOINT}/${encodeURIComponent(teamId)}/accept-invitation`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    },
  );

  await throwForErrorResponse(response);
  const payload = await response.json();
  return payload.team as Team;
};
