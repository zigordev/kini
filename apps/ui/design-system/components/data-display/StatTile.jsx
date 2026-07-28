import React from 'react';

const TONE = {
  default: 'var(--ds-color-fg-muted)',
  accent: 'var(--ds-color-accent)',
  success: 'var(--ds-color-success)',
  warning: 'var(--ds-color-warning)',
  danger: 'var(--ds-color-danger)',
};

const DIRECTION = {
  up: 'var(--ds-color-success)',
  down: 'var(--ds-color-danger)',
  flat: 'var(--ds-color-fg-subtle)',
};

export function StatTile({ label, value, delta, direction = 'flat', hint, tone = 'default', className = '', style }) {
  return (
    <div
      className={`ds-stat-tile ${className}`.trim()}
      style={{
        display: 'grid', gap: 8, padding: 16, borderRadius: 'var(--ds-radius-lg)',
        border: `1px solid ${tone === 'default' ? 'var(--ds-color-border)' : TONE[tone]}`,
        background: 'var(--ds-color-surface)', fontFamily: 'var(--ds-font-sans)', ...style,
      }}
    >
      <span style={{ fontSize: 'var(--ds-text-xs)', fontWeight: 'var(--ds-weight-bold)', letterSpacing: 'var(--ds-tracking-wide)', textTransform: 'uppercase', color: 'var(--ds-color-fg-subtle)' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 'var(--ds-text-2xl)', fontWeight: 'var(--ds-weight-bold)', lineHeight: 1, color: 'var(--ds-color-fg)' }}>{value}</span>
        {delta != null ? (
          <span style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-weight-semibold)', color: DIRECTION[direction] }}>{delta}</span>
        ) : null}
      </div>
      {hint ? <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-color-fg-subtle)' }}>{hint}</span> : null}
    </div>
  );
}
