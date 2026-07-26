'use client';

import { usePreferences } from '@/contexts/PreferencesContext';

export function Loading({ label }: { label?: string }) {
  const { t } = usePreferences();
  return (
    <div className="page-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label ?? t('common.loading')}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        K
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
