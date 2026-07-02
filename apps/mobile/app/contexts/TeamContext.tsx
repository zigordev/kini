import {
  PropsWithChildren,
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useAuth from '../hooks/useAuth';
import {
  acceptTeamInvitation,
  createTeam as createTeamRequest,
  fetchTeams,
  inviteTeamUser,
} from '../services/teams.service';
import { updateActiveTeam } from '../services/users.service';
import { Team } from '../types/team';
import { readTeamStorage, writeTeamStorage } from '../../src/utils/teamStorage';

interface TeamContextValue {
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  refreshTeams: () => Promise<void>;
  selectTeam: (teamId: string) => void;
  createTeam: (name: string) => Promise<Team>;
  inviteUser: (email: string) => Promise<void>;
  acceptInvitation: (teamId: string) => Promise<Team>;
}

const STORAGE_KEY = 'kini-selected-team';

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

const readStoredTeamId = async (): Promise<string | null> => {
  return readTeamStorage(STORAGE_KEY);
};

const writeStoredTeamId = async (teamId: string | null): Promise<void> => {
  await writeTeamStorage(STORAGE_KEY, teamId);
};

export const TeamProvider = ({ children }: PropsWithChildren): ReactElement => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setSelectedTeamId(null);
      setStorageLoaded(true);
      return;
    }

    if (!storageLoaded) {
      return;
    }

    setLoading(true);
    try {
      const nextTeams = await fetchTeams();
      setTeams(nextTeams);
      setSelectedTeamId((current) => {
        const preferredTeamId = current ?? user.activeTeamId;
        const selected =
          nextTeams.find((team) => team.id === preferredTeamId) ?? null;
        void writeStoredTeamId(selected?.id ?? null);
        return selected?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [storageLoaded, user]);

  useEffect(() => {
    let active = true;

    const loadStoredTeam = async () => {
      if (!user) {
        setStorageLoaded(true);
        return;
      }

      setStorageLoaded(false);
      try {
        const storedTeamId = user.activeTeamId ?? (await readStoredTeamId());
        if (active) {
          setSelectedTeamId(storedTeamId);
        }
      } finally {
        if (active) {
          setStorageLoaded(true);
        }
      }
    };

    void loadStoredTeam();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    void refreshTeams();
  }, [refreshTeams]);

  const selectedTeam =
    teams.find((team) => team.id === selectedTeamId) ?? null;

  const selectTeam = useCallback(
    (teamId: string) => {
      setSelectedTeamId(teamId);
      void writeStoredTeamId(teamId);
      void updateActiveTeam(teamId).catch((caughtError) => {
        console.error('Failed to persist active team', caughtError);
      });
    },
    [],
  );

  const createTeam = useCallback(async (name: string) => {
    const team = await createTeamRequest(name);
    setTeams((current) => [...current, team]);
    setSelectedTeamId(team.id);
    void writeStoredTeamId(team.id);
    void updateActiveTeam(team.id).catch((caughtError) => {
      console.error('Failed to persist active team', caughtError);
    });
    return team;
  }, []);

  const inviteUser = useCallback(
    async (email: string) => {
      if (!selectedTeam) {
        throw new Error('No team selected');
      }
      await inviteTeamUser(selectedTeam.id, email);
    },
    [selectedTeam],
  );

  const acceptInvitation = useCallback(async (teamId: string) => {
    const team = await acceptTeamInvitation(teamId);
    setTeams((current) => {
      const exists = current.some((entry) => entry.id === team.id);
      return exists
        ? current.map((entry) => (entry.id === team.id ? team : entry))
        : [...current, team];
    });
    setSelectedTeamId(team.id);
    void writeStoredTeamId(team.id);
    void updateActiveTeam(team.id).catch((caughtError) => {
      console.error('Failed to persist active team', caughtError);
    });
    return team;
  }, []);

  const value = useMemo<TeamContextValue>(
    () => ({
      teams,
      selectedTeam,
      loading: loading || (Boolean(user) && !storageLoaded),
      refreshTeams,
      selectTeam,
      createTeam,
      inviteUser,
      acceptInvitation,
    }),
    [
      acceptInvitation,
      createTeam,
      inviteUser,
      loading,
      refreshTeams,
      selectTeam,
      selectedTeam,
      storageLoaded,
      teams,
      user,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeams = (): TeamContextValue => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
};
