'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { EmptyState, Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE_URL, poolsApi, usersApi } from '@/lib/api';
import {
  formatDate,
  full15Results,
  poolOutcome,
  poolStatus,
  regularResults,
} from '@/lib/pools';
import type {
  FutPool,
  FutPoolMatch,
  ResultValue,
  UserSummary,
} from '@/types/domain';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { StatTile } from '../../../design-system/components/data-display/StatTile.jsx';

const backgroundRefreshMs = 15 * 60 * 1000;

export default function PoolsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PoolsContent />
    </Suspense>
  );
}

function PoolsContent() {
  const search = useSearchParams();
  const { user } = useAuth();
  const { selectedTeam } = useTeams();
  const { t, language } = usePreferences();
  const showToast = useToast();
  const [pools, setPools] = useState<FutPool[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editEarning, setEditEarning] = useState('');

  const selectedPool =
    pools.find((pool) => pool.id === selectedId) ?? pools[0] ?? null;
  const selectedPoolId = selectedPool?.id;

  const replacePool = useCallback((updated: FutPool) => {
    setPools((current) =>
      current.map((pool) => (pool.id === updated.id ? updated : pool)),
    );
  }, []);

  const load = useCallback(async () => {
    if (!user || !selectedTeam) return;
    setLoading(true);
    try {
      const [response, userList] = await Promise.all([
        poolsApi.list(selectedTeam.id, 1, 100),
        usersApi.list().catch(() => []),
      ]);
      setPools(response.data);
      setUsers(userList);
      const requestedId = search.get('poolId');
      setSelectedId((current) => {
        if (
          requestedId &&
          response.data.some((pool) => pool.id === requestedId)
        ) {
          return requestedId;
        }
        if (current && response.data.some((pool) => pool.id === current)) {
          return current;
        }
        return response.data[0]?.id ?? null;
      });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [search, selectedTeam, showToast, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socket.on('pool.updated', (payload: { poolId: string; pool: FutPool }) => {
      replacePool(payload.pool);
    });
    socket.on(
      'match.updated',
      (payload: { poolId: string; matchId: string; match: FutPoolMatch }) => {
        setPools((current) =>
          current.map((pool) =>
            pool.id === payload.poolId
              ? {
                  ...pool,
                  matches: pool.matches.map((match) =>
                    match.id === payload.matchId ? payload.match : match,
                  ),
                }
              : pool,
          ),
        );
      },
    );
    return () => {
      socket.disconnect();
    };
  }, [replacePool]);

  const checkResults = useCallback(
    async (quiet = false) => {
      if (!selectedPoolId) return;
      setChecking(true);
      try {
        replacePool(await poolsApi.checkResults(selectedPoolId));
        if (!quiet) showToast(t('pools.results_checked'), 'success');
      } catch (error) {
        if (!quiet) {
          showToast(
            error instanceof Error ? error.message : String(error),
            'error',
          );
        }
      } finally {
        setChecking(false);
      }
    },
    [replacePool, selectedPoolId, showToast, t],
  );

  useEffect(() => {
    if (!selectedPool?.availablePoolId) return;
    void checkResults(true);
    const id = window.setInterval(
      () => void checkResults(true),
      backgroundRefreshMs,
    );
    return () => window.clearInterval(id);
  }, [checkResults, selectedPool?.availablePoolId]);

  useEffect(() => {
    if (!selectedPool) return;
    setEditName(selectedPool.name ?? '');
    setEditDate(new Date(selectedPool.date).toISOString().slice(0, 10));
    setEditEarning(String(selectedPool.earning ?? 0));
  }, [selectedPool]);

  const updatePool = async (payload: Parameters<typeof poolsApi.update>[1]) => {
    if (!selectedPool) return;
    setSaving(`pool:${selectedPool.id}`);
    try {
      const updated = await poolsApi.update(selectedPool.id, payload);
      replacePool(updated);
      showToast(t('pools.updated'), 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setSaving(null);
    }
  };

  const updateMatch = async (
    match: FutPoolMatch,
    payload: Parameters<typeof poolsApi.updateMatch>[1],
  ) => {
    if (!selectedPool) return;
    if (payload.results && match.userId && match.userId !== user?.id) {
      showToast(t('matches.edit_denied'), 'error');
      return;
    }
    setSaving(`match:${match.id}`);
    try {
      const updated = await poolsApi.updateMatch(match.id, payload);
      setPools((current) =>
        current.map((pool) =>
          pool.id === selectedPool.id
            ? {
                ...pool,
                matches: pool.matches.map((entry) =>
                  entry.id === updated.id ? updated : entry,
                ),
              }
            : pool,
        ),
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setSaving(null);
    }
  };

  const toggleResult = (
    match: FutPoolMatch,
    value: ResultValue,
    splitIndex?: number,
  ) => {
    if (typeof splitIndex === 'number') {
      const next = [...(match.results ?? [])];
      while (next.length < 2) next.push('' as ResultValue);
      next[splitIndex] =
        next[splitIndex] === value ? ('' as ResultValue) : value;
      void updateMatch(match, { results: next });
      return;
    }
    const selected = match.results ?? [];
    const next = selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value];
    void updateMatch(match, { results: next });
  };

  if (!user) return null;
  if (!selectedTeam) {
    return (
      <EmptyState
        action={
          <Button as={Link} variant="primary" href="/teams?manage=1">
            {t('teams.create_first')}
          </Button>
        }
        description={t('teams.empty_text')}
        title={t('teams.empty_title')}
      />
    );
  }
  if (loading) return <Loading label={t('pools.loading')} />;
  if (!selectedPool) {
    return (
      <EmptyState
        action={
          <div className="button-row">
            <Button as={Link} variant="primary" href="/available-pools">
              {t('available_pools.add_short')}
            </Button>
            <Button as={Link} variant="secondary" href="/create-pool">
              {t('pools.create_title')}
            </Button>
          </div>
        }
        description={t('pools.workspace_subtitle')}
        title={t('pools.no_pools')}
      />
    );
  }

  const outcome = poolOutcome(selectedPool);
  const status = poolStatus(selectedPool);
  const canEdit = status === 'programmed';
  const assignedToMe = selectedPool.matches.filter(
    (match) => match.userId === user.id,
  ).length;

  return (
    <div className="page">
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">{t('pools.active_pool_subtitle')}</p>
          <h1>{t('pools.workspace_title', { team: selectedTeam.name })}</h1>
          <p>{t('pools.workspace_subtitle')}</p>
        </div>
        <div className="button-row">
          <Button variant="secondary"
            disabled={checking}
            onClick={() => void checkResults()}
            type="button"
          >
            {checking ? t('status.preparing') : t('pools.check_results')}
          </Button>
          <Button as={Link} variant="primary" href="/create-pool">
            {t('pools.create_title')}
          </Button>
        </div>
      </header>

      <section className="metrics-grid">
        <StatTile
          label={t('pools.metric_successes')}
          value={outcome.successes}
          hint={<>{t('pools.metric_success_rate')}: {outcome.successRate}%</>}
        />
        <StatTile
          label={t('pools.metric_pending')}
          value={outcome.pending}
          hint={<>{t('pools.failure_count', { count: outcome.failures })}</>}
        />
        <StatTile
          label={t('pools.metric_assigned_to_me')}
          value={assignedToMe}
          hint={<>{selectedPool.matches.length} {t('pools.matches')}</>}
        />
        <StatTile
          label={t('pools.earning')}
          value={<>{new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR', }).format(selectedPool.earning ?? 0)}</>}
          hint={<>{t(`status.${status}`)}</>}
        />
      </section>

      <div className="pool-layout">
        <section className="panel pool-main">
          <div className="pool-selector-row">
            <label className="field field-grow">
              <span>{t('pools.pool_selector_label')}</span>
              <select
                onChange={(event) => setSelectedId(event.target.value)}
                value={selectedPool.id}
              >
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name || formatDate(pool.date, language)}
                  </option>
                ))}
              </select>
            </label>
            <span className={`status-pill status-${status}`}>
              {t(`status.${status}`)}
            </span>
          </div>

          <div className="matches-table">
            <div className="matches-header">
              <span>#</span>
              <span>{t('pools.matches')}</span>
              <span>{t('matches.prediction')}</span>
              {selectedPool.elige8 && <span>E8</span>}
            </div>
            {selectedPool.matches.map((match, index) => (
              <MatchRow
                canEdit={canEdit}
                currentUserId={user.id}
                elige8Enabled={selectedPool.elige8}
                key={match.id}
                match={match}
                number={index + 1}
                saving={saving === `match:${match.id}`}
                users={users}
                assignedPlayerLabel={t('matches.assigned_player')}
                unassignedLabel={t('matches.unassigned')}
                onAssign={(userId) => void updateMatch(match, { userId })}
                onToggleE8={(elige8) => void updateMatch(match, { elige8 })}
                onToggleResult={(value, splitIndex) =>
                  toggleResult(match, value, splitIndex)
                }
              />
            ))}
          </div>
        </section>

        <aside className="panel pool-inspector">
          <div className="panel-heading">
            <div>
              <h2>{t('pools.inspector_title')}</h2>
              <p>{t('pools.inspector_subtitle')}</p>
            </div>
          </div>

          <label className="field">
            <span>{t('fields.name')}</span>
            <input
              disabled={!canEdit}
              onChange={(event) => setEditName(event.target.value)}
              value={editName}
            />
          </label>
          <label className="field">
            <span>{t('fields.date')}</span>
            <input
              disabled={!canEdit}
              onChange={(event) => setEditDate(event.target.value)}
              type="date"
              value={editDate}
            />
          </label>
          <label className="field">
            <span>{t('pools.earning')}</span>
            <input
              min="0"
              onChange={(event) => setEditEarning(event.target.value)}
              step="0.01"
              type="number"
              value={editEarning}
            />
          </label>

          <div className="stepper-grid">
            <Stepper
              disabled={!canEdit}
              label={t('fields.doubles')}
              max={14}
              onChange={(doubles) => void updatePool({ doubles })}
              value={selectedPool.doubles}
            />
            <Stepper
              disabled={!canEdit}
              label={t('fields.triples')}
              max={9}
              onChange={(triples) => void updatePool({ triples })}
              value={selectedPool.triples}
            />
          </div>
          <label className="switch-row">
            <span>
              <strong>E8</strong>
              <small>Elige 8</small>
            </span>
            <input
              checked={selectedPool.elige8}
              disabled={!canEdit}
              onChange={(event) =>
                void updatePool({ elige8: event.target.checked })
              }
              type="checkbox"
            />
          </label>
          <label className="switch-row">
            <span>
              <strong>{t('fields.active')}</strong>
              <small>{t(`status.${status}`)}</small>
            </span>
            <input
              checked={selectedPool.active}
              onChange={(event) =>
                void updatePool({ active: event.target.checked })
              }
              type="checkbox"
            />
          </label>
          <Button variant="primary" style={{ width: '100%' }}
            disabled={saving === `pool:${selectedPool.id}`}
            onClick={() =>
              void updatePool({
                name: editName.trim() || undefined,
                date: editDate,
                earning: Number(editEarning) || 0,
              })
            }
            type="button"
          >
            {t('actions.save')}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function MatchRow({
  match,
  number,
  canEdit,
  currentUserId,
  elige8Enabled,
  saving,
  users,
  assignedPlayerLabel,
  unassignedLabel,
  onToggleResult,
  onToggleE8,
  onAssign,
}: {
  match: FutPoolMatch;
  number: number;
  canEdit: boolean;
  currentUserId: string;
  elige8Enabled: boolean;
  saving: boolean;
  users: UserSummary[];
  assignedPlayerLabel: string;
  unassignedLabel: string;
  onToggleResult: (value: ResultValue, splitIndex?: number) => void;
  onToggleE8: (value: boolean) => void;
  onAssign: (userId: string) => void;
}) {
  const editableByUser =
    canEdit && (!match.userId || match.userId === currentUserId);
  const resultClass =
    match.success === true
      ? 'match-success'
      : match.success === false
        ? 'match-failure'
        : '';

  return (
    <div className={`match-row ${resultClass}`}>
      <span className="match-order">{number}</span>
      <div className="match-teams">
        <strong>{match.homeTeam}</strong>
        <span>{match.awayTeam}</span>
        <label className="assignee">
          <span className="sr-only">{assignedPlayerLabel}</span>
          <select
            disabled={!canEdit || saving}
            onChange={(event) => onAssign(event.target.value)}
            value={match.userId ?? ''}
          >
            <option disabled value="">
              {unassignedLabel}
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {match.full15 || number === 15 ? (
        <div className="full15-picker">
          {[0, 1].map((splitIndex) => (
            <div className="result-buttons" key={splitIndex}>
              <span>{splitIndex === 0 ? match.homeTeam : match.awayTeam}</span>
              {full15Results.map((value) => (
                <ResultButton
                  active={match.results?.[splitIndex] === value}
                  disabled={!editableByUser || saving}
                  key={value}
                  onClick={() => onToggleResult(value, splitIndex)}
                  value={value}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="result-buttons">
          {regularResults.map((value) => (
            <ResultButton
              active={match.results?.includes(value)}
              disabled={!editableByUser || saving}
              key={value}
              onClick={() => onToggleResult(value)}
              value={value}
            />
          ))}
        </div>
      )}
      {elige8Enabled && (
        <label className="e8-check">
          <span className="sr-only">E8</span>
          <input
            checked={match.elige8}
            disabled={!canEdit || saving}
            onChange={(event) => onToggleE8(event.target.checked)}
            type="checkbox"
          />
        </label>
      )}
    </div>
  );
}

function ResultButton({
  active,
  disabled,
  onClick,
  value,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  value: ResultValue;
}) {
  return (
    <button
      aria-pressed={active}
      className={
        active ? 'result-button result-button-active' : 'result-button'
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {value}
    </button>
  );
}

function Stepper({
  label,
  value,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div>
        <button
          disabled={disabled || value <= 0}
          onClick={() => onChange(value - 1)}
          type="button"
        >
          −
        </button>
        <strong>{value}</strong>
        <button
          disabled={disabled || value >= max}
          onClick={() => onChange(value + 1)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}
