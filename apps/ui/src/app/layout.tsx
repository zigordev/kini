import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { Providers } from '@/components/Providers';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html data-theme="kini" lang="en" suppressHydrationWarning>
      <body>
        <RumProvider />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
