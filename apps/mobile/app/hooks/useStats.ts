import { useCallback, useEffect, useState } from 'react';
import { fetchStats } from '../services/futPool.service';
import Stats from '../types/stats';
import showErrorToast, { resolveErrorMessage } from '../utils/toast';

const useStats = (teamId?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await fetchStats(teamId);

      setStats(stats);

      setError(null);
    } catch (caughtError) {
      console.error('Failed to load pool stats:', caughtError);
      const message = resolveErrorMessage(caughtError);
      setError(message ?? null);
      showErrorToast(caughtError);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    error,
    stats,
  };
};

export default useStats;
