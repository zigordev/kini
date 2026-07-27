'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { AppShell as DsAppShell } from '../../design-system/components/navigation/AppShell.jsx';
import { Logo } from '../../design-system/components/navigation/Logo.jsx';
import { Loading } from './Loading';
import { LanguageButton, ThemeButton, UserButton } from './TopbarUtilities';

// Nav item hrefs match today's routes verbatim, with one deviation: the
// Teams item drops the inert `?manage=1` query string (confirmed unused by
// TeamsPage — grep shows no useSearchParams() reads it anywhere) so that the
// shared Sidebar/BottomNav's plain string-equality active-match
// (`href === activeHref`) can actually recognize `/teams` as active. Keeping
// the literal `?manage=1` here would silently break active-state
// highlighting for that one tab, since the shared components have no
// query-string-aware matching and we're not patching them locally.
const navItems = [
  { href: '/pools', key: 'tabs.pools', icon: '◫' },
  { href: '/available-pools', key: 'mobile_tabs.available_pools', icon: '＋' },
  { href: '/stats', key: 'tabs.stats', icon: '↗' },
  { href: '/teams', key: 'tabs.teams', icon: '◎' },
  { href: '/profile', key: 'tabs.profile', icon: '○' },
];

function KiniLogo({
  href,
  style,
}: {
  href?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Logo
      href={href}
      initials="K"
      linkComponent={Link}
      shape="circle"
      style={style}
      wordmark="Kini"
    />
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
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
          <KiniLogo style={{ marginBottom: 24 }} />
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

  const sidebarItems = navItems.map((item) => ({
    href: item.href,
    label: t(item.key),
    icon: item.icon,
  }));

  return (
    <DsAppShell
      activeHref={activePath}
      brand={<KiniLogo href="/pools" />}
      bottomNavItems={sidebarItems.slice(0, 4)}
      linkComponent={Link}
      sidebarItems={sidebarItems}
      topbar={{
        utilities: (
          <>
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
            <ThemeButton />
            <LanguageButton />
            <UserButton />
          </>
        ),
      }}
    >
      {children}
    </DsAppShell>
  );
}
