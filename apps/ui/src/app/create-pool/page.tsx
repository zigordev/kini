'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { EmptyState, Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { useToast } from '@/contexts/ToastContext';
import { poolsApi, usersApi } from '@/lib/api';
import { readPoolDefaults } from '@/lib/preferences';
import { todayInputValue } from '@/lib/pools';
import type { PoolForm, UserSummary } from '@/types/domain';
import { Button } from '../../../design-system/components/core/Button.jsx';

interface MatchDraft {
  order: number;
  homeTeam: string;
  awayTeam: string;
  userId: string;
}

const emptyMatches = (): MatchDraft[] =>
  Array.from({ length: 15 }, (_, index) => ({
    order: index + 1,
    homeTeam: '',
    awayTeam: '',
    userId: '',
  }));

export default function CreatePoolPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedTeam, loading: teamsLoading } = useTeams();
  const { t } = usePreferences();
  const showToast = useToast();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayInputValue());
  const [doubles, setDoubles] = useState(6);
  const [triples, setTriples] = useState(0);
  const [elige8, setElige8] = useState(false);
  const [matches, setMatches] = useState<MatchDraft[]>(emptyMatches);

  useEffect(() => {
    if (!selectedTeam) return;
    const defaults = readPoolDefaults(selectedTeam.id);
    setDoubles(defaults.doubles);
    setTriples(defaults.triples);
    setElige8(defaults.elige8);
    void usersApi
      .list()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [selectedTeam]);

  const updateMatch = (index: number, update: Partial<MatchDraft>) => {
    setMatches((current) =>
      current.map((match, matchIndex) =>
        matchIndex === index ? { ...match, ...update } : match,
      ),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTeam) return;
    const incomplete = matches.some(
      (match) =>
        Boolean(match.homeTeam.trim()) !== Boolean(match.awayTeam.trim()),
    );
    if (incomplete) {
      showToast(t('pools.match_teams_required'), 'error');
      return;
    }

    const payload: PoolForm = {
      name: name.trim() || undefined,
      teamId: selectedTeam.id,
      date,
      doubles,
      triples,
      elige8,
      active: true,
      matches: matches
        .filter((match) => match.homeTeam.trim() && match.awayTeam.trim())
        .map((match) => ({
          order: match.order,
          homeTeam: match.homeTeam.trim(),
          awayTeam: match.awayTeam.trim(),
          userId: match.userId || undefined,
        })),
    };

    setCreating(true);
    try {
      const created = await poolsApi.create(payload);
      showToast(t('pools.created'), 'success');
      router.replace(`/pools?poolId=${encodeURIComponent(created.id)}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;
  if (teamsLoading) return <Loading label={t('status.preparing')} />;
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

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{selectedTeam.name}</p>
        <h1>{t('pools.create_title')}</h1>
        <p>{t('pools.workspace_subtitle')}</p>
      </header>

      <form className="panel form-stack" onSubmit={submit}>
        <div className="form-grid">
          <label className="field field-span-2">
            <span>{t('fields.name')}</span>
            <input
              maxLength={160}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('pools.name_placeholder')}
              value={name}
            />
          </label>
          <label className="field">
            <span>{t('fields.date')}</span>
            <input
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </label>
          <label className="field">
            <span>{t('fields.doubles')}</span>
            <input
              max={14}
              min={0}
              onChange={(event) => setDoubles(Number(event.target.value))}
              required
              type="number"
              value={doubles}
            />
          </label>
          <label className="field">
            <span>{t('fields.triples')}</span>
            <input
              max={9}
              min={0}
              onChange={(event) => setTriples(Number(event.target.value))}
              required
              type="number"
              value={triples}
            />
          </label>
          <label className="switch-row field-span-2">
            <span>
              <strong>E8</strong>
              <small>Elige 8</small>
            </span>
            <input
              checked={elige8}
              onChange={(event) => setElige8(event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>

        <div className="panel-heading">
          <div>
            <h2>{t('pools.matches')}</h2>
            <p>{t('pools.manual_matches_help')}</p>
          </div>
        </div>
        <div className="match-draft-list">
          {matches.map((match, index) => (
            <div className="match-draft" key={match.order}>
              <span className="match-order">{match.order}</span>
              <label className="field">
                <span className="sr-only">{t('matches.home_team')}</span>
                <input
                  onChange={(event) =>
                    updateMatch(index, { homeTeam: event.target.value })
                  }
                  placeholder={t('matches.home_team')}
                  value={match.homeTeam}
                />
              </label>
              <label className="field">
                <span className="sr-only">{t('matches.away_team')}</span>
                <input
                  onChange={(event) =>
                    updateMatch(index, { awayTeam: event.target.value })
                  }
                  placeholder={t('matches.away_team')}
                  value={match.awayTeam}
                />
              </label>
              <label className="field">
                <span className="sr-only">{t('users.select')}</span>
                <select
                  onChange={(event) =>
                    updateMatch(index, { userId: event.target.value })
                  }
                  value={match.userId}
                >
                  <option value="">{t('users.select')}</option>
                  {users.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>

        <div className="button-row button-row-end sticky-form-actions">
          <Button as={Link} variant="secondary" href="/pools">
            {t('actions.cancel')}
          </Button>
          <Button variant="primary"
            disabled={creating}
            type="submit"
          >
            {creating ? t('status.preparing') : t('actions.create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
