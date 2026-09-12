import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Team } from '@/types/domain';

const api = vi.hoisted(() => ({
  teamsApi: { list: vi.fn(), create: vi.fn(), invite: vi.fn(), accept: vi.fn() },
  usersApi: { update: vi.fn() },
}));
vi.mock('@/lib/api', () => api);

const auth = vi.hoisted(() => ({
  user: null as { id: string; activeTeamId: string | null } | null,
  updateUser: vi.fn(),
}));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: auth.user, updateUser: auth.updateUser }),
}));

import { TeamsProvider, useTeams } from './TeamsContext';

const team = (id: string, name: string): Team => ({
  id,
  name,
  ownerId: 'user-1',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});
const one = team('t1', 'One');
const two = team('t2', 'Two');

function Probe() {
  const { selectedTeam, teams, select, create } = useTeams();
  return (
    <div>
      <span data-testid="selected">{selectedTeam?.name ?? 'none'}</span>
      <span data-testid="count">{teams.length}</span>
      <button onClick={() => void select('t2')}>select two</button>
      <button onClick={() => void select('ghost')}>select ghost</button>
      <button onClick={() => void create('Three')}>create</button>
    </div>
  );
}

const mount = () => render(<TeamsProvider><Probe /></TeamsProvider>);

describe('TeamsProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    api.teamsApi.list.mockResolvedValue([one, two]);
    api.usersApi.update.mockImplementation(async (payload: { activeTeamId: string | null }) => ({
      ...auth.user,
      ...payload,
    }));
    auth.user = { id: 'user-1', activeTeamId: null };
  });

  afterEach(cleanup);

  it('prefers the account\'s active team over the stored one and over the first', async () => {
    auth.user = { id: 'user-1', activeTeamId: 't2' };
    window.localStorage.setItem('kini-selected-team', 't1');
    mount();

    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe('Two'));
    expect(window.localStorage.getItem('kini-selected-team')).toBe('t2');
  });

  it('restores the stored team when the account has none, and falls back to the first', async () => {
    window.localStorage.setItem('kini-selected-team', 't2');
    mount();
    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe('Two'));
    cleanup();

    window.localStorage.removeItem('kini-selected-team');
    mount();
    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe('One'));
  });

  it('ignores a selection of a team the user is not in', async () => {
    mount();
    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe('One'));

    await act(async () => {
      fireEvent.click(screen.getByText('select ghost'));
    });

    expect(screen.getByTestId('selected').textContent).toBe('One');
    expect(api.usersApi.update).not.toHaveBeenCalled();
  });

  it('persists a real selection to the account', async () => {
    mount();
    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe('One'));

    await act(async () => {
      fireEvent.click(screen.getByText('select two'));
    });

    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe('Two'));
    expect(api.usersApi.update).toHaveBeenCalledWith({ activeTeamId: 't2' });
    expect(auth.updateUser).toHaveBeenCalledWith(expect.objectContaining({ activeTeamId: 't2' }));
  });

  it('selects a newly created team and persists it', async () => {
    api.teamsApi.create.mockResolvedValue(team('t3', 'Three'));
    mount();
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'));

    await act(async () => {
      fireEvent.click(screen.getByText('create'));
    });

    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe('Three'));
    expect(screen.getByTestId('count').textContent).toBe('3');
    expect(api.usersApi.update).toHaveBeenCalledWith({ activeTeamId: 't3' });
  });
});
