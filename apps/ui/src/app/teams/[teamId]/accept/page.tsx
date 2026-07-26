'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';

export default function AcceptInvitationPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { accept } = useTeams();
  const { t } = usePreferences();
  const [message, setMessage] = useState(t('teams.accept_processing'));
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    const teamId = params.teamId;
    if (!teamId) {
      setMessage(t('teams.accept_invalid'));
      setDone(true);
      return;
    }

    let active = true;
    void accept(teamId)
      .then(() => {
        if (active) setMessage(t('teams.accept_success'));
      })
      .catch(() => {
        if (active) setMessage(t('teams.accept_failed'));
      })
      .finally(() => {
        if (active) setDone(true);
      });
    return () => {
      active = false;
    };
  }, [accept, params.teamId, t, user]);

  if (!user) return null;
  if (!done) return <Loading label={message} />;

  return (
    <section className="empty-state">
      <div className="empty-state-icon">✓</div>
      <h1>{t('teams.accept_title')}</h1>
      <p>{message}</p>
      <button
        className="button button-primary"
        onClick={() => router.replace('/pools')}
        type="button"
      >
        {t('teams.go_to_team')}
      </button>
    </section>
  );
}
