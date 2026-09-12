'use client';

import type { PropsWithChildren } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { TeamsProvider } from '@/contexts/TeamsContext';
import { ToastProvider } from '@/contexts/ToastContext';

export function Providers({ children }: PropsWithChildren) {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <AuthProvider>
          <TeamsProvider>{children}</TeamsProvider>
        </AuthProvider>
      </ToastProvider>
    </PreferencesProvider>
  );
}
