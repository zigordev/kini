'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { usersApi } from '@/lib/api';
import type { Language, ThemeMode } from '@/types/domain';
import { Button } from '../../design-system/components/core/Button.jsx';
import { Flag } from '../../design-system/components/icons/Flag.jsx';
import { Icon } from '../../design-system/components/icons/Icon.jsx';
import { Menu, MenuItem } from '../../design-system/components/overlay/Menu.jsx';

const ICON_STYLE: React.CSSProperties = { lineHeight: 1 };

export function ThemeButton() {
  const { theme, setTheme, t } = usePreferences();
  const { updateUser } = useAuth();

  const toggle = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Local preference is already applied via setTheme; this syncs it to the
    // account too. If it fails, the user's next explicit change retries it —
    // not worth a toast for a background preference sync.
    void usersApi.update({ theme: next }).then(updateUser).catch(() => {});
  };

  return (
    <Button
      aria-label={t('theme.toggle')}
      onClick={toggle}
      size="icon"
      style={ICON_STYLE}
      title={t('theme.toggle')}
      type="button"
      variant="ghost"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </Button>
  );
}

export function LanguageButton() {
  const { t } = usePreferences();
  const { updateUser } = useAuth();

  const change = (next: Language) => {
    void usersApi.update({ language: next }).then(updateUser).catch(() => {});
  };

  return (
    <Menu
      trigger={
        <Button
          aria-label={t('nav.language')}
          size="icon"
          style={ICON_STYLE}
          title={t('nav.language')}
          type="button"
          variant="ghost"
        >
          <Icon name="globe" />
        </Button>
      }
    >
      {({ close }: { close: () => void }) => (
        <>
          <MenuItem onClick={() => { close(); change('en'); }}>
            <Flag code="gb" /> {t('language.english')}
          </MenuItem>
          <MenuItem onClick={() => { close(); change('es'); }}>
            <Flag code="es" /> {t('language.spanish')}
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

export function UserButton() {
  const { user, signOut } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();

  if (!user) return null;

  return (
    <Menu
      trigger={
        <Button
          aria-label={t('nav.user')}
          size="icon"
          style={ICON_STYLE}
          title={t('nav.user')}
          type="button"
          variant="ghost"
        >
          <Icon name="user" />
        </Button>
      }
    >
      {({ close }: { close: () => void }) => (
        <>
          <div
            style={{
              padding: '6px 10px 8px', marginBottom: 4,
              borderBottom: '1px solid var(--ds-color-border)',
            }}
          >
            <div style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-weight-semibold)', color: 'var(--ds-color-fg)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-color-fg-subtle)' }}>
              {user.email}
            </div>
          </div>
          <MenuItem
            onClick={() => {
              close();
              if (!window.confirm(t('auth.sign_out_confirm_message'))) return;
              void signOut().then(() => router.replace('/'));
            }}
          >
            <Icon name="log-out" /> {t('auth.sign_out')}
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
