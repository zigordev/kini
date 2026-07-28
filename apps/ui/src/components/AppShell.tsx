'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTeams } from '@/contexts/TeamsContext';
import { AuthCard } from '../../design-system/components/auth/AuthCard.jsx';
import { AuthShell } from '../../design-system/components/auth/AuthShell.jsx';
import { Button } from '../../design-system/components/core/Button.jsx';
import { GoogleMark } from '../../design-system/components/icons/GoogleMark.jsx';
import { Icon } from '../../design-system/components/icons/Icon.jsx';
import { AppShell as DsAppShell } from '../../design-system/components/navigation/AppShell.jsx';
import { ScopeSwitcher } from '../../design-system/components/navigation/ScopeSwitcher.jsx';
import { MenuItem } from '../../design-system/components/overlay/Menu.jsx';
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
// Every screen below is team-scoped, so the team is the app's scope, not a
// destination — it moved into the Sidebar's ScopeSwitcher, taking the
// "Teams" management page with it (reachable from the switcher's footer).
// Profile is account settings, so it lives in the account menu next to
// Sign out rather than competing with it from the primary nav.
const navItems = [
  { href: '/pools', key: 'tabs.pools', icon: <Icon name="trophy" /> },
  { href: '/available-pools', key: 'mobile_tabs.available_pools', icon: <Icon name="list-plus" /> },
  { href: '/stats', key: 'tabs.stats', icon: <Icon name="trending-up" /> },
];

function KiniLogo({
  href,
  size = 'md',
  style,
}: {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}) {
  return (
    <Logo
      href={href}
      initials="K"
      linkComponent={Link}
      shape="circle"
      size={size}
      style={style}
      wordmark="Kini"
    />
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signingIn, googleAuthEnabled, signInWithGoogle } =
    useAuth();
  const { selectedTeam, teams, loading: teamsLoading, select } = useTeams();
  const { t } = usePreferences();

  // Dev-only design-system preview (see app/dev/preview). Renders outside
  // the auth gate so the primitives can be inspected without a session; the
  // route itself 404s in production builds.
  if (process.env.NODE_ENV !== 'production' && pathname.startsWith('/dev/')) {
    return <>{children}</>;
  }

  if (pathname === '/auth/callback') {
    return <AuthShell>{children}</AuthShell>;
  }

  if (loading) return <Loading label={t('status.preparing')} />;

  if (!user) {
    return (
      <AuthShell utilities={<><ThemeButton /><LanguageButton /></>}>
        <AuthCard
          logo={<KiniLogo />}
          eyebrow={t('login.eyebrow')}
          title={t('login.title')}
          description={t('login.tagline')}
          error={!googleAuthEnabled ? t('auth.google_unavailable') : null}
          footer={t('login.terms')}
        >
          <Button
            variant="primary"
            size="lg"
            style={{ width: '100%' }}
            disabled={!googleAuthEnabled || signingIn}
            onClick={() =>
              signInWithGoogle(`${pathname}${window.location.search}`)
            }
            type="button"
          >
            <GoogleMark />
            {signingIn ? t('auth.connecting') : t('auth.sign_in_google')}
          </Button>
        </AuthCard>
      </AuthShell>
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
      brand={<KiniLogo href="/pools" size="sm" />}
      bottomNavItems={sidebarItems}
      linkComponent={Link}
      scope={
        <ScopeSwitcher
          label={t('profile.team')}
          value={selectedTeam?.name}
          placeholder={teamsLoading ? t('common.loading') : t('teams.title')}
          items={teams.map((team) => ({
            id: team.id,
            label: team.name,
            active: team.id === selectedTeam?.id,
            onSelect: (id: string) => void select(id),
          }))}
          footer={({ close }: { close: () => void }) => (
            <MenuItem onClick={() => { close(); router.push('/teams'); }}>
              <Icon name="users" /> {t('tabs.teams')}
            </MenuItem>
          )}
        />
      }
      sidebarItems={sidebarItems}
      topbar={{
        utilities: (
          <>
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
