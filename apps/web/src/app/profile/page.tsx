'use client';

import { useEffect, useState } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import {
  DEFAULT_POOL_DEFAULTS,
  readPoolDefaults,
  writePoolDefaults,
} from '@/lib/preferences';
import type { PoolDefaults } from '@/types/domain';

export default function ProfilePage() {
  const { t } = usePreferences();
  const { selectedTeam } = useTeams();
  const [defaults, setDefaults] = useState<PoolDefaults>(DEFAULT_POOL_DEFAULTS);

  useEffect(() => {
    setDefaults(readPoolDefaults(selectedTeam?.id));
  }, [selectedTeam?.id]);

  const changeDefaults = (next: PoolDefaults) => {
    setDefaults(next);
    if (selectedTeam) writePoolDefaults(selectedTeam.id, next);
  };

  return (
    <div className="page profile-page">
      <header className="page-header">
        <p className="eyebrow">{t('tabs.profile')}</p>
        <h1>{t('profile.pool_defaults')}</h1>
      </header>

      <div className="profile-grid">
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
