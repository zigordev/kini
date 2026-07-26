'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { Loading } from './Loading';

const navItems = [
  { href: '/pools', key: 'tabs.pools', icon: '◫' },
  { href: '/available-pools', key: 'mobile_tabs.available_pools', icon: '＋' },
  { href: '/stats', key: 'tabs.stats', icon: '↗' },
  { href: '/teams?manage=1', key: 'tabs.teams', icon: '◎' },
  { href: '/profile', key: 'tabs.profile', icon: '○' },
];

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signingIn, googleAuthEnabled, signInWithGoogle } =
    useAuth();
  const { selectedTeam, teams, loading: teamsLoading, select } = useTeams();
  const { t } = usePreferences();

  if (pathname === '/auth/callback') {
    return <main className="login-shell">{children}</main>;
  }

  if (loading) return <Loading label={t('status.preparing')} />;

  if (!user) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <div className="brand-mark" aria-hidden="true">
            K
          </div>
          <p className="eyebrow">{t('login.eyebrow')}</p>
          <h1>{t('login.title')}</h1>
          <p className="lead">{t('login.tagline')}</p>
          <button
            className="button button-primary button-large"
            disabled={!googleAuthEnabled || signingIn}
            onClick={() =>
              signInWithGoogle(`${pathname}${window.location.search}`)
            }
            type="button"
          >
            <span className="google-mark" aria-hidden="true">
              G
            </span>
            {signingIn ? t('auth.connecting') : t('auth.sign_in_google')}
          </button>
          {!googleAuthEnabled && (
            <p className="form-error">{t('auth.google_unavailable')}</p>
          )}
          <p className="fine-print">{t('login.terms')}</p>
        </section>
      </main>
    );
  }

  const activePath = pathname === '/' ? '/pools' : pathname;

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" href="/pools">
          <span className="brand-mark brand-mark-small">K</span>
          <span>Kini</span>
        </Link>
        <div className="topbar-actions">
          {teams.length > 0 && (
            <label className="team-switcher">
              <span className="sr-only">{t('profile.team')}</span>
              <select
                disabled={teamsLoading}
                onChange={(event) => void select(event.target.value)}
                value={selectedTeam?.id ?? ''}
              >
                {!selectedTeam && <option value="">—</option>}
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="avatar"
            onClick={() => router.push('/profile')}
            title={user.name}
            type="button"
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={user.avatarUrl} />
            ) : (
              user.name.slice(0, 1).toUpperCase()
            )}
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar" aria-label="Primary navigation">
          <nav>
            {navItems.map((item) => {
              const itemPath = item.href.split('?')[0];
              const active =
                activePath === itemPath ||
                (itemPath !== '/pools' &&
                  activePath.startsWith(`${itemPath}/`));
              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={active ? 'nav-link nav-link-active' : 'nav-link'}
                  href={item.href}
                  key={item.href}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="content">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {navItems.slice(0, 4).map((item) => {
          const itemPath = item.href.split('?')[0];
          const active =
            activePath === itemPath ||
            (itemPath !== '/pools' && activePath.startsWith(`${itemPath}/`));
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={
                active ? 'mobile-link mobile-link-active' : 'mobile-link'
              }
              href={item.href}
              key={item.href}
            >
              <span aria-hidden="true">{item.icon}</span>
              <small>{t(item.key)}</small>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
