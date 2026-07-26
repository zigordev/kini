'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { useToast } from '@/contexts/ToastContext';
import { usersApi } from '@/lib/api';
import {
  DEFAULT_POOL_DEFAULTS,
  readPoolDefaults,
  writePoolDefaults,
} from '@/lib/preferences';
import type { Language, PoolDefaults, ThemeMode } from '@/types/domain';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();
  const { language, setLanguage, setTheme, t, theme } = usePreferences();
  const { teams, selectedTeam, select } = useTeams();
  const showToast = useToast();
  const [defaults, setDefaults] = useState<PoolDefaults>(DEFAULT_POOL_DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDefaults(readPoolDefaults(selectedTeam?.id));
  }, [selectedTeam?.id]);

  const updatePreference = async (
    payload:
      { language: Language } | { theme: ThemeMode } | { activeTeamId: string },
  ) => {
    setSaving(true);
    try {
      const nextUser = await usersApi.update(payload);
      updateUser(nextUser);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    void updatePreference({ language: next });
  };

  const changeTheme = (next: ThemeMode) => {
    setTheme(next);
    void updatePreference({ theme: next });
  };

  const changeTeam = async (teamId: string) => {
    try {
      await select(teamId);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    }
  };

  const changeDefaults = (next: PoolDefaults) => {
    setDefaults(next);
    if (selectedTeam) writePoolDefaults(selectedTeam.id, next);
  };

  if (!user) return null;

  return (
    <div className="page profile-page">
      <header className="page-header">
        <p className="eyebrow">{t('tabs.profile')}</p>
        <h1>{t('nav.user')}</h1>
      </header>

      <section className="profile-hero">
        <div className="profile-avatar">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={user.avatarUrl} />
          ) : (
            user.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </section>

      <div className="profile-grid">
        <section className="panel form-stack">
          <div className="panel-heading">
            <div>
              <h2>{t('profile.team')}</h2>
              <p>{t('teams.subtitle')}</p>
            </div>
          </div>
          <label className="field">
            <span>{t('profile.team')}</span>
            <select
              disabled={saving || teams.length === 0}
              onChange={(event) => void changeTeam(event.target.value)}
              value={selectedTeam?.id ?? ''}
            >
              {teams.length === 0 && <option value="">—</option>}
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="panel form-stack">
          <div className="panel-heading">
            <div>
              <h2>{t('language.title')}</h2>
              <p>{t('nav.language')}</p>
            </div>
          </div>
          <div className="segmented">
            {(['en', 'es'] as const).map((entry) => (
              <button
                aria-pressed={language === entry}
                className={language === entry ? 'segment active' : 'segment'}
                disabled={saving}
                key={entry}
                onClick={() => changeLanguage(entry)}
                type="button"
              >
                {entry === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
              </button>
            ))}
          </div>
        </section>

        <section className="panel form-stack">
          <div className="panel-heading">
            <div>
              <h2>{t('theme.toggle')}</h2>
              <p>{theme === 'dark' ? t('theme.dark') : t('theme.light')}</p>
            </div>
          </div>
          <div className="segmented">
            {(['light', 'dark'] as const).map((entry) => (
              <button
                aria-pressed={theme === entry}
                className={theme === entry ? 'segment active' : 'segment'}
                disabled={saving}
                key={entry}
                onClick={() => changeTheme(entry)}
                type="button"
              >
                {entry === 'light' ? '☀ ' : '☾ '}
                {t(`theme.${entry}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="panel form-stack">
          <div className="panel-heading">
            <div>
              <h2>{t('profile.pool_defaults')}</h2>
              <p>{selectedTeam?.name ?? t('profile.team')}</p>
            </div>
          </div>
          <ProfileCounter
            disabled={!selectedTeam}
            label={t('fields.doubles')}
            max={14}
            onChange={(doubles) => changeDefaults({ ...defaults, doubles })}
            value={defaults.doubles}
          />
          <ProfileCounter
            disabled={!selectedTeam}
            label={t('fields.triples')}
            max={9}
            onChange={(triples) => changeDefaults({ ...defaults, triples })}
            value={defaults.triples}
          />
          <label className="switch-row">
            <span>
              <strong>E8</strong>
              <small>Elige 8</small>
            </span>
            <input
              checked={defaults.elige8}
              disabled={!selectedTeam}
              onChange={(event) =>
                changeDefaults({ ...defaults, elige8: event.target.checked })
              }
              type="checkbox"
            />
          </label>
        </section>
      </div>

      <section className="danger-zone">
        <p>{t('profile.support_hint')}</p>
        <button
          className="button button-danger"
          onClick={() => {
            if (!window.confirm(t('auth.sign_out_confirm_message'))) return;
            void signOut().then(() => router.replace('/'));
          }}
          type="button"
        >
          {t('auth.sign_out')}
        </button>
      </section>
    </div>
  );
}

function ProfileCounter({
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
    <div className="counter-row">
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
