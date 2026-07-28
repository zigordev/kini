'use client';

import Link from 'next/link';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { StatTile } from '../../../../design-system/components/data-display/StatTile.jsx';
import { PageHeader } from '../../../../design-system/components/data-display/PageHeader.jsx';
import { EmptyState } from '../../../../design-system/components/feedback/EmptyState.jsx';
import { Badge } from '../../../../design-system/components/feedback/Badge.jsx';
import { Icon } from '../../../../design-system/components/icons/Icon.jsx';

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {children}
      </div>
    </section>
  );
}

export function PreviewGallery() {
  return (
    <main className="page">
      <PageHeader
        eyebrow="Dev only"
        title="Design system preview"
        description="The shared primitives rendered in kini's theme. Toggle light/dark in the topbar to check both."
        actions={<Button variant="secondary">Header action</Button>}
      />

      <Row title="Button — variants">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </Row>

      <Row title="Button — sizes, icons, and as={Link}">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
        <Button variant="secondary"><Icon name="plus" /> With icon</Button>
        <Button variant="primary" size="icon" aria-label="Icon only"><Icon name="settings" /></Button>
        <Button as={Link} href="/dev/preview" variant="primary">Link as button</Button>
      </Row>

      {/* The exact composition the pools and stats screens use, so the grid
          and the tile are checked together rather than in isolation. */}
      <h2 style={{ margin: '28px 0 12px' }}>StatTile in metrics-grid</h2>
      <section className="metrics-grid">
        <StatTile label="Successes" value={12} hint="Success rate: 63%" />
        <StatTile label="Pending" value={4} hint="3 failures" />
        <StatTile label="Assigned to me" value={7} hint="15 matches" />
        <StatTile label="Earning" value="€120.00" hint="Active" />
      </section>

      <section className="metrics-grid metrics-grid-compact" style={{ marginTop: 16 }}>
        <StatTile tone="accent" label="Balance — positive" value="€1,240" hint="valueTone: default" />
        <StatTile tone="accent" valueTone="danger" label="Balance — negative" value="-€310" hint="valueTone: danger" />
      </section>

      <Row title="Badge">
        <Badge>Neutral</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success" dot>Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
      </Row>

      <h2 style={{ margin: '28px 0 12px' }}>EmptyState</h2>
      <EmptyState
        icon={<Icon name="trophy" size={22} />}
        title="No pools yet"
        description="Create the first pool for this team to get started."
        action={<Button variant="primary">Create pool</Button>}
      />

      <h2 style={{ margin: '28px 0 12px' }}>Icons</h2>
      <section className="panel">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {(['trophy', 'list-plus', 'trending-up', 'users', 'user', 'settings', 'log-out',
             'sun', 'moon', 'globe', 'star', 'clock', 'calendar', 'search', 'plus',
             'pencil', 'trash-2', 'copy', 'filter', 'info', 'circle-check', 'circle-x',
             'triangle-alert', 'external-link', 'dollar-sign', 'chart-column'] as const).map((n) => (
            <span key={n} style={{ display: 'grid', justifyItems: 'center', gap: 4, width: 76 }}>
              <Icon name={n} size={20} />
              <small style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{n}</small>
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
