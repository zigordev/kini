'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState, Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { useToast } from '@/contexts/ToastContext';
import { availablePoolsApi } from '@/lib/api';
import { formatDate } from '@/lib/pools';
import type { AvailablePoolJackpot, Team } from '@/types/domain';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { StatTile } from '../../../design-system/components/data-display/StatTile.jsx';

export default function TeamsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = usePreferences();
  const { teams, selectedTeam, loading, create, invite, select, refresh } =
    useTeams();
  const showToast = useToast();
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [invitingTeam, setInvitingTeam] = useState<Team | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [jackpot, setJackpot] = useState<AvailablePoolJackpot | null>(null);

  useEffect(() => {
    if (!user) return;
    void availablePoolsApi
      .jackpot()
      .then(setJackpot)
      .catch(() => undefined);
  }, [user]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const name = newTeamName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await create(name);
      setNewTeamName('');
      showToast(t('teams.created'), 'success');
      router.push('/pools');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = async (team: Team, destination = '/pools') => {
    try {
      await select(team.id);
      router.push(destination);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    }
  };

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (!invitingTeam || !inviteEmail.trim()) return;
    try {
      await select(invitingTeam.id);
      await invite(inviteEmail.trim(), invitingTeam.id);
      showToast(t('teams.invited', { email: inviteEmail.trim() }), 'success');
      setInvitingTeam(null);
      setInviteEmail('');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    }
  };

  if (!user) return null;

  return (
    <div className="page">
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">{t('teams.eyebrow')}</p>
          <h1>{t('teams.title')}</h1>
          <p>{t('teams.subtitle')}</p>
        </div>
        <Button variant="secondary"
          disabled={loading}
          onClick={() => void refresh()}
          type="button"
        >
          {t('teams.refresh')}
        </Button>
      </header>

      <section className="metrics-grid metrics-grid-compact">
        <StatTile
          label={t('teams.jackpot')}
          value={
            jackpot?.jackpotPublished
              ? (jackpot.jackpotFormatted ?? jackpot.jackpot)
              : t('teams.jackpot_not_published')
          }
          hint={jackpot?.drawDate ? formatDate(jackpot.drawDate, language) : undefined}
        />
        <StatTile
          label={t('tabs.teams')}
          value={teams.length}
          hint={selectedTeam?.name ?? '—'}
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('teams.create')}</h2>
            <p>{t('teams.empty_text')}</p>
          </div>
        </div>
        <form className="inline-form" onSubmit={handleCreate}>
          <label className="field field-grow">
            <span>{t('teams.create_prompt')}</span>
            <input
              autoComplete="off"
              maxLength={120}
              onChange={(event) => setNewTeamName(event.target.value)}
              placeholder={t('teams.create_prompt')}
              value={newTeamName}
            />
          </label>
          <Button variant="primary"
            disabled={creating || !newTeamName.trim()}
            type="submit"
          >
            {creating ? t('status.preparing') : t('actions.create')}
          </Button>
        </form>
      </section>

      {loading ? (
        <Loading label={t('teams.loading')} />
      ) : teams.length === 0 ? (
        <EmptyState
          description={t('teams.empty_text')}
          title={t('teams.empty_title')}
        />
      ) : (
        <section className="card-grid">
          {teams.map((team) => {
            const active = team.id === selectedTeam?.id;
            return (
              <article
                className={active ? 'team-card team-card-active' : 'team-card'}
                key={team.id}
              >
                <div className="team-card-heading">
                  <div className="team-icon">{team.name.slice(0, 1)}</div>
                  <div>
                    <h2>{team.name}</h2>
                    <span className="status-badge">
                      {t(`teams.role_${team.role}`)}
                    </span>
                  </div>
                  {active && (
                    <span className="status-badge status-badge-primary">
                      {t('teams.current')}
                    </span>
                  )}
                </div>
                <p>{t('teams.card_text')}</p>
                <small>
                  {t('teams.created_at', {
                    date: formatDate(team.createdAt, language),
                  })}
                </small>
                <div className="button-row">
                  <Button variant="primary"
                    onClick={() => void handleOpen(team)}
                    type="button"
                  >
                    {t('teams.open_pools')}
                  </Button>
                  <Button variant="secondary"
                    onClick={() => void handleOpen(team, '/stats')}
                    type="button"
                  >
                    {t('teams.show_stats')}
                  </Button>
                  {team.role === 'admin' && (
                    <Button variant="ghost"
                      onClick={() => setInvitingTeam(team)}
                      type="button"
                    >
                      {t('teams.invite')}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {invitingTeam && (
        <div
          aria-labelledby="invite-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <form className="modal" onSubmit={handleInvite}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t('teams.invite')}</p>
                <h2 id="invite-title">{invitingTeam.name}</h2>
              </div>
              <button
                aria-label={t('actions.cancel')}
                className="icon-button"
                onClick={() => setInvitingTeam(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <label className="field">
              <span>Email</span>
              <input
                autoFocus
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder={t('teams.invite_prompt', {
                  team: invitingTeam.name,
                })}
                required
                type="email"
                value={inviteEmail}
              />
            </label>
            <div className="button-row button-row-end">
              <Button variant="secondary"
                onClick={() => setInvitingTeam(null)}
                type="button"
              >
                {t('actions.cancel')}
              </Button>
              <Button variant="primary" type="submit">
                {t('teams.invite')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
