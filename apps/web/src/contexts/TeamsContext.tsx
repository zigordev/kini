'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { teamsApi, usersApi } from '@/lib/api';
import type { Team } from '@/types/domain';
import { useAuth } from './AuthContext';

interface TeamsContextValue {
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  refresh: () => Promise<void>;
  select: (teamId: string) => Promise<void>;
  create: (name: string) => Promise<Team>;
  invite: (email: string, teamId?: string) => Promise<void>;
  accept: (teamId: string) => Promise<Team>;
}

const TeamsContext = createContext<TeamsContextValue | null>(null);
const storageKey = 'kini-selected-team';

export function TeamsProvider({ children }: PropsWithChildren) {
  const { user, updateUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const persistSelection = useCallback(
    async (teamId: string | null) => {
      setSelectedTeamId(teamId);
      if (teamId) window.localStorage.setItem(storageKey, teamId);
      else window.localStorage.removeItem(storageKey);
      if (user?.activeTeamId !== teamId) {
        const nextUser = await usersApi.update({ activeTeamId: teamId });
        updateUser(nextUser);
      }
    },
    [updateUser, user?.activeTeamId],
  );

  const refresh = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setSelectedTeamId(null);
      return;
    }
    setLoading(true);
    try {
      const nextTeams = await teamsApi.list();
      setTeams(nextTeams);
      const preferred =
        user.activeTeamId ?? window.localStorage.getItem(storageKey);
      const nextSelected =
        nextTeams.find((team) => team.id === preferred) ?? nextTeams[0] ?? null;
      setSelectedTeamId(nextSelected?.id ?? null);
      if (nextSelected) {
        window.localStorage.setItem(storageKey, nextSelected.id);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const select = useCallback(
    async (teamId: string) => {
      if (!teams.some((team) => team.id === teamId)) return;
      await persistSelection(teamId);
    },
    [persistSelection, teams],
  );

  const create = useCallback(
    async (name: string) => {
      const team = await teamsApi.create(name);
      setTeams((current) => [...current, team]);
      await persistSelection(team.id);
      return team;
    },
    [persistSelection],
  );

  const invite = useCallback(
    async (email: string, teamId?: string) => {
      const selected = teams.find(
        (team) => team.id === (teamId ?? selectedTeamId),
      );
      if (!selected) throw new Error('No team selected');
      await teamsApi.invite(selected.id, email);
    },
    [selectedTeamId, teams],
  );

  const accept = useCallback(
    async (teamId: string) => {
      const team = await teamsApi.accept(teamId);
      setTeams((current) => {
        const exists = current.some((entry) => entry.id === team.id);
        return exists
          ? current.map((entry) => (entry.id === team.id ? team : entry))
          : [...current, team];
      });
      await persistSelection(team.id);
      return team;
    },
    [persistSelection],
  );

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;
  const value = useMemo(
    () => ({
      teams,
      selectedTeam,
      loading,
      refresh,
      select,
      create,
      invite,
      accept,
    }),
    [accept, create, invite, loading, refresh, select, selectedTeam, teams],
  );

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
}

export const useTeams = () => {
  const value = useContext(TeamsContext);
  if (!value) throw new Error('useTeams must be used within TeamsProvider');
  return value;
};
