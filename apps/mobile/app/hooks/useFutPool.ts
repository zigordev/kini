import { useCallback, useEffect, useRef, useState } from 'react';
import { featchPools } from '../services/futPool.service';
import realtime from '../services/realtime.service';
import FutPoolSnapshot from '../types/futPool';
import showErrorToast, { resolveErrorMessage } from '../utils/toast';

interface UseFutPoolOptions {
  enabled?: boolean;
  teamId?: string;
}

const useFutPool = (options: UseFutPoolOptions = {}) => {
  const enabled = options.enabled ?? true;
  const teamId = options.teamId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<FutPoolSnapshot[]>([]);
  const [activePool, setActivePool] = useState<FutPoolSnapshot | null>(null);
  const [totalPools, setTotalPools] = useState(0);
  const loadedPoolIds = useRef<Set<string>>(new Set());
  const poolsMapRef = useRef<Map<string, FutPoolSnapshot>>(new Map());

  // Load the latest pool initially
  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    try {
      // Fetch the latest pool (descending order by date, page 1, limit 1)
      const response = await featchPools({
        page: 1,
        limit: 1,
        sortBy: 'date',
        sortOrder: 'desc',
        teamId,
      });

      if (!response || !response.data || response.data.length === 0) {
        setPools([]);
        setTotalPools(0);
        setError('No se encontraron quinielas disponibles.');
        return;
      }

      const latestPool = response.data[0];
      setTotalPools(response.meta.total);
      loadedPoolIds.current.clear();
      poolsMapRef.current.clear();

      loadedPoolIds.current.add(latestPool.id);
      poolsMapRef.current.set(latestPool.id, latestPool);

      setPools([latestPool]);
      setActivePool(latestPool);
      setError(null);
    } catch (caughtError) {
      console.error('Failed to load quinielas:', caughtError);
      const message = resolveErrorMessage(caughtError);
      setError(message ?? null);
      showErrorToast(caughtError);
    } finally {
      setLoading(false);
    }
  }, [enabled, teamId]);

  // Load a specific pool by page number (counting from the latest)
  const loadPoolByIndex = useCallback(
    async (index: number) => {
      if (!enabled || index < 0 || index >= totalPools) {
        return null;
      }

      try {
        // Convert index to page number (descending order)
        const page = index + 1;
        const response = await featchPools({
          page,
          limit: 1,
          sortBy: 'date',
          sortOrder: 'desc',
          teamId,
        });

        if (!response || !response.data || response.data.length === 0) {
          return null;
        }

        const pool = response.data[0];

        if (!loadedPoolIds.current.has(pool.id)) {
          loadedPoolIds.current.add(pool.id);
          poolsMapRef.current.set(pool.id, pool);

          setPools((prev) => {
            // Add pool in sorted order (by date ascending for display)
            const newPools = [...prev, pool].sort((a, b) => {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
            return newPools;
          });
        }

        return pool;
      } catch (caughtError) {
        console.error('Failed to load pool:', caughtError);
        showErrorToast(caughtError);
        return null;
      }
    },
    [enabled, teamId, totalPools],
  );

  const loadAllPools = useCallback(async () => {
    if (!enabled || totalPools <= 0) {
      return [];
    }

    try {
      const response = await featchPools({
        page: 1,
        limit: totalPools,
        sortBy: 'date',
        sortOrder: 'desc',
        teamId,
      });

      if (!response || !response.data || response.data.length === 0) {
        return [];
      }

      const sortedPools = [...response.data].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      loadedPoolIds.current.clear();
      poolsMapRef.current.clear();
      for (const pool of sortedPools) {
        loadedPoolIds.current.add(pool.id);
        poolsMapRef.current.set(pool.id, pool);
      }

      setTotalPools(response.meta.total);
      setPools(sortedPools);
      setError(null);
      return sortedPools;
    } catch (caughtError) {
      console.error('Failed to load pool history:', caughtError);
      showErrorToast(caughtError);
      return [];
    }
  }, [enabled, teamId, totalPools]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setPools([]);
      setActivePool(null);
      setTotalPools(0);
      loadedPoolIds.current.clear();
      poolsMapRef.current.clear();
      return;
    }

    load();
    const handlePool = (payload: { poolId: string; pool: FutPoolSnapshot }) => {
      setPools((prev) =>
        prev.map((p) => (p.id === payload.poolId ? payload.pool : p)),
      );
      setActivePool((prev) =>
        prev?.id === payload.poolId ? payload.pool : prev,
      );
      // Update the map as well
      if (poolsMapRef.current.has(payload.poolId)) {
        poolsMapRef.current.set(payload.poolId, payload.pool);
      }
    };
    const handleMatch = (payload: {
      poolId: string;
      matchId: string;
      match: any;
    }) => {
      setPools((prev) =>
        prev.map((p) => {
          if (p.id !== payload.poolId) return p;
          const nextMatches = Array.isArray(p.matches)
            ? p.matches.map((m: any) =>
                String(m.id) === String(payload.matchId) ? payload.match : m,
              )
            : p.matches;
          return {
            ...p,
            matches: nextMatches,
            successes: payload.match?.futPool?.successes ?? p.successes,
          } as FutPoolSnapshot;
        }),
      );
      setActivePool((prev) => {
        if (!prev || prev.id !== payload.poolId) return prev;
        const nextMatches = Array.isArray(prev.matches)
          ? prev.matches.map((m: any) =>
              String(m.id) === String(payload.matchId) ? payload.match : m,
            )
          : prev.matches;
        return {
          ...prev,
          matches: nextMatches,
          successes: payload.match?.futPool?.successes ?? prev.successes,
        } as FutPoolSnapshot;
      });
      // Update the map as well
      if (poolsMapRef.current.has(payload.poolId)) {
        const pool = poolsMapRef.current.get(payload.poolId);
        if (pool) {
          const nextMatches = Array.isArray(pool.matches)
            ? pool.matches.map((m: any) =>
                String(m.id) === String(payload.matchId) ? payload.match : m,
              )
            : pool.matches;
          poolsMapRef.current.set(payload.poolId, {
            ...pool,
            matches: nextMatches,
            successes: payload.match?.futPool?.successes ?? pool.successes,
          } as FutPoolSnapshot);
        }
      }
    };

    realtime.onPoolUpdated(handlePool);
    realtime.onMatchUpdated(handleMatch);

    return () => {
      realtime.offPoolUpdated(handlePool);
      realtime.offMatchUpdated(handleMatch);
    };
  }, [enabled, load, teamId]);

  const updatePoolSnapshot = useCallback((updated: FutPoolSnapshot) => {
    setPools((previous) =>
      previous.map((pool) => (pool.id === updated.id ? updated : pool)),
    );
    setActivePool((previous) =>
      previous?.id === updated.id ? updated : previous,
    );
    // Update the map as well
    if (poolsMapRef.current.has(updated.id)) {
      poolsMapRef.current.set(updated.id, updated);
    }
  }, []);

  return {
    loading,
    error,
    pools,
    activePool,
    totalPools,
    setActivePool,
    refresh: load,
    updatePoolSnapshot,
    loadPoolByIndex,
    loadAllPools,
  };
};

export default useFutPool;
