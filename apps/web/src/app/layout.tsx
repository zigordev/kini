import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { Providers } from '@/components/Providers';
import { I18nProvider } from '@/i18n/client';
import { getLocale, getMessages } from '@/i18n/server';
import './globals.css';
import { RumProvider } from '@/observability/RumProvider';

export const metadata: Metadata = {
  title: {
    default: 'Kini',
    template: '%s · Kini',
  },
  description: 'Kini',
  icons: { icon: '/icon.svg' },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html data-theme="kini" lang={locale} suppressHydrationWarning>
      <body>
        <RumProvider />
        <I18nProvider locale={locale} messages={messages}>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
