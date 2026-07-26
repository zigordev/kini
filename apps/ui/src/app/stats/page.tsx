'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState, Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { useToast } from '@/contexts/ToastContext';
import { poolsApi } from '@/lib/api';
import type { Stats } from '@/types/domain';

const combined = (entry: Stats['ranking'][number]) => ({
  successes:
    entry.successes +
    entry.doubleSuccesses +
    entry.tripleSuccesses +
    entry.full15Successes +
    entry.elige8Successes,
  failures:
    entry.failures +
    entry.doubleFailures +
    entry.tripleFailures +
    entry.full15Failures +
    entry.elige8Failures,
});

export default function StatsPage() {
  const { user } = useAuth();
  const { selectedTeam } = useTeams();
  const { t, language } = usePreferences();
  const showToast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      setStats(await poolsApi.stats(selectedTeam.id));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const rows = stats?.ranking ?? [];
    return rows.reduce(
      (current, entry) => {
        const value = combined(entry);
        return {
          successes: current.successes + value.successes,
          failures: current.failures + value.failures,
        };
      },
      { successes: 0, failures: 0 },
    );
  }, [stats]);
  const resolved = totals.successes + totals.failures;
  const rate = resolved ? Math.round((totals.successes / resolved) * 100) : 0;
  const best = [...(stats?.resultBreakdown ?? [])].sort(
    (left, right) => right.successRate - left.successRate,
  )[0];

  if (!user) return null;
  if (!selectedTeam) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/teams?manage=1">
            {t('tabs.teams')}
          </Link>
        }
        description={t('teams.subtitle')}
        title={t('teams.empty_title')}
      />
    );
  }
  if (loading) return <Loading label={t('stats.loading')} />;

  const ranking = stats?.ranking ?? [];

  return (
    <div className="page">
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">{selectedTeam.name}</p>
          <h1>{t('stats.title')}</h1>
          <p>{t('stats.subtitle')}</p>
        </div>
        <button
          className="button button-secondary"
          onClick={() => void load()}
          type="button"
        >
          {t('actions.refresh')}
        </button>
      </header>

      <section className="metrics-grid">
        <article className="metric-card metric-card-accent">
          <span>{t('stats.summary_balance')}</span>
          <strong className={(stats?.balance ?? 0) < 0 ? 'negative' : ''}>
            {new Intl.NumberFormat(language, {
              style: 'currency',
              currency: 'EUR',
            }).format(stats?.balance ?? 0)}
          </strong>
          <small>{t('stats.balance_help')}</small>
        </article>
        <article className="metric-card">
          <span>{t('stats.summary_leader')}</span>
          <strong>{ranking[0]?.user?.name ?? '—'}</strong>
          <small>{t('stats.ranking_help')}</small>
        </article>
        <article className="metric-card">
          <span>{t('stats.summary_success_rate')}</span>
          <strong>{rate}%</strong>
          <small>
            {resolved} {t('stats.total_predictions')}
          </small>
        </article>
        <article className="metric-card">
          <span>{t('stats.summary_best_result')}</span>
          <strong>{best?.key ?? '—'}</strong>
          <small>{best ? `${Math.round(best.successRate)}%` : '—'}</small>
        </article>
      </section>

      <div className="stats-layout">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('stats.ranking_heading')}</h2>
              <p>{t('stats.ranking_help')}</p>
            </div>
          </div>
          {ranking.length === 0 ? (
            <p className="muted">{t('stats.empty')}</p>
          ) : (
            <div className="ranking-table">
              {ranking.map((entry, index) => {
                const values = combined(entry);
                const entryResolved = values.successes + values.failures;
                const entryRate = entryResolved
                  ? Math.round((values.successes / entryResolved) * 100)
                  : 0;
                return (
                  <div className="ranking-row" key={entry.user.id}>
                    <span className="rank">{index + 1}</span>
                    <span
                      className="player-dot"
                      style={{
                        background: entry.user.backgroundColor,
                        color: entry.user.textColor,
                      }}
                    >
                      {entry.user.name.slice(0, 1)}
                    </span>
                    <strong>{entry.user.name}</strong>
                    <span>
                      {values.successes} {t('stats.successes')}
                    </span>
                    <span>
                      {values.failures} {t('stats.failures')}
                    </span>
                    <strong>{entryRate}%</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('stats.result_breakdown_heading')}</h2>
              <p>{t('stats.breakdown_help')}</p>
            </div>
          </div>
          {(stats?.resultBreakdown ?? []).length === 0 ? (
            <p className="muted">{t('stats.empty')}</p>
          ) : (
            <div className="breakdown-grid">
              {stats?.resultBreakdown?.map((entry) => (
                <article className="breakdown-card" key={entry.key}>
                  <header>
                    <strong>{entry.key}</strong>
                    <span>{Math.round(entry.successRate)}%</span>
                  </header>
                  <div className="progress">
                    <span
                      style={{
                        width: `${Math.max(0, Math.min(100, entry.successRate))}%`,
                      }}
                    />
                  </div>
                  <small>
                    {entry.successes} {t('stats.successes')} · {entry.failures}{' '}
                    {t('stats.failures')}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
