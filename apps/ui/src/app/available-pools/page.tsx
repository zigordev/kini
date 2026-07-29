'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { useToast } from '@/contexts/ToastContext';
import { availablePoolsApi, poolsApi } from '@/lib/api';
import { formatDate, full15Results, regularResults } from '@/lib/pools';
import { readPoolDefaults } from '@/lib/preferences';
import type {
  AvailablePool,
  AvailablePoolJackpot,
  ResultValue,
} from '@/types/domain';
import { Button } from '../../../design-system/components/core/Button.jsx';

const backgroundRefreshMs = 15 * 60 * 1000;

export default function AvailablePoolsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedTeam } = useTeams();
  const { t, language } = usePreferences();
  const showToast = useToast();
  const [pools, setPools] = useState<AvailablePool[]>([]);
  const [jackpot, setJackpot] = useState<AvailablePoolJackpot | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nextPools, nextJackpot] = await Promise.all([
        availablePoolsApi.list(),
        availablePoolsApi.jackpot().catch(() => null),
      ]);
      setPools(nextPools);
      setJackpot(nextJackpot);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast, user]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      void availablePoolsApi
        .list()
        .then(setPools)
        .catch(() => undefined);
    }, backgroundRefreshMs);
    return () => window.clearInterval(id);
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      setPools(await availablePoolsApi.sync());
      showToast(t('available_pools.synced'), 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setSyncing(false);
    }
  };

  const addToTeam = async (availablePool: AvailablePool) => {
    if (!selectedTeam) {
      showToast(t('available_pools.no_team_selected'), 'error');
      return;
    }
    setAddingId(availablePool.id);
    try {
      const created = await availablePoolsApi.addToTeam(
        availablePool.id,
        selectedTeam.id,
      );
      const defaults = readPoolDefaults(selectedTeam.id);
      await poolsApi.update(created.id, defaults);
      showToast(t('available_pools.added'), 'success');
      router.push(`/pools?poolId=${encodeURIComponent(created.id)}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setAddingId(null);
    }
  };

  const updateOfficialResult = async (
    pool: AvailablePool,
    order: number,
    value: ResultValue,
  ) => {
    const key = `${pool.id}:${order}`;
    setUpdatingMatch(key);
    try {
      const updated = await availablePoolsApi.updateResult(pool.id, order, [
        value,
      ]);
      setPools((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setUpdatingMatch(null);
    }
  };

  if (!user) return null;

  return (
    <div className="page">
      <header className="page-header button-row button-row-end">
        <div className="button-row">
          <Button as={Link} variant="secondary" href="/create-pool">
            {t('pools.create_title')}
          </Button>
          <Button variant="primary"
            disabled={syncing}
            onClick={() => void sync()}
            type="button"
          >
            {syncing ? t('status.preparing') : t('available_pools.sync')}
          </Button>
        </div>
      </header>

      {jackpot && (
        <section className="jackpot-card">
          <div>
            <span>{t('teams.jackpot')}</span>
            <strong>
              {jackpot.jackpotPublished
                ? (jackpot.jackpotFormatted ?? jackpot.jackpot)
                : t('teams.jackpot_not_published')}
            </strong>
          </div>
          {jackpot.drawDate && (
            <small>{formatDate(jackpot.drawDate, language)}</small>
          )}
        </section>
      )}

      {!selectedTeam && (
        <div className="notice notice-warning">
          <span>{t('available_pools.no_team_selected')}</span>
          <Link href="/teams?manage=1">{t('tabs.teams')}</Link>
        </div>
      )}

      {loading ? (
        <Loading label={t('available_pools.loading')} />
      ) : pools.length === 0 ? (
        <EmptyState
          action={
            <Button variant="primary"
              onClick={() => void sync()}
              type="button"
            >
              {t('available_pools.sync')}
            </Button>
          }
          description={t('available_pools.empty_text')}
          title={t('available_pools.empty_title')}
        />
      ) : (
        <section className="catalog-list">
          {pools.map((pool) => (
            <article className="catalog-card" key={pool.id}>
              <header>
                <div>
                  <span className="status-badge">{pool.status}</span>
                  <h2>{pool.name}</h2>
                  <p>
                    {formatDate(pool.drawDate, language, true)} ·{' '}
                    {t('available_pools.match_count', {
                      count: pool.matches.length,
                    })}
                  </p>
                </div>
                <Button variant="primary"
                  disabled={!selectedTeam || addingId === pool.id}
                  onClick={() => void addToTeam(pool)}
                  type="button"
                >
                  {addingId === pool.id
                    ? t('status.preparing')
                    : t('available_pools.play')}
                </Button>
              </header>

              {pool.matches.length === 0 ? (
                <p className="muted">{t('available_pools.no_matches')}</p>
              ) : (
                <div className="available-match-list">
                  {pool.matches.map((match) => {
                    const matchKey = `${pool.id}:${match.order}`;
                    const values = match.full15
                      ? full15Results
                      : regularResults;
                    return (
                      <div className="available-match" key={match.order}>
                        <span className="match-order">{match.order}</span>
                        <div className="match-teams">
                          <strong>{match.homeTeam}</strong>
                          <span>{match.awayTeam}</span>
                        </div>
                        {selectedTeam?.role === 'admin' && (
                          <div
                            aria-label={t('matches.official_result_label', {
                              home: match.homeTeam,
                              away: match.awayTeam,
                            })}
                            className="result-buttons"
                          >
                            {values.map((value) => (
                              <button
                                aria-pressed={match.officialResults?.includes(
                                  value,
                                )}
                                className={
                                  match.officialResults?.includes(value)
                                    ? 'result-button result-button-active'
                                    : 'result-button'
                                }
                                disabled={updatingMatch === matchKey}
                                key={value}
                                onClick={() =>
                                  void updateOfficialResult(
                                    pool,
                                    match.order,
                                    value,
                                  )
                                }
                                type="button"
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
