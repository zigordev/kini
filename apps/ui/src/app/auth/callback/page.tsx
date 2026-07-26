'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { refresh } = useAuth();
  const { t } = usePreferences();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authError = search.get('error');
    if (authError) {
      setError(authError);
      return;
    }
    const requestedPath = search.get('next');
    const returnPath =
      requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/';
    void refresh()
      .then(() => router.replace(returnPath))
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : String(caught)),
      );
  }, [refresh, router, search]);

  if (error) {
    return (
      <section className="page-state">
        <h1>{t('login.title')}</h1>
        <p className="form-error">{error}</p>
        <button
          className="button button-primary"
          onClick={() => router.replace('/')}
          type="button"
        >
          {t('actions.done')}
        </button>
      </section>
    );
  }

  return <Loading label={t('auth.connecting')} />;
}
