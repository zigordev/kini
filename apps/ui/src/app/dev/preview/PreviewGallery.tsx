'use client';

import Link from 'next/link';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { StatTile } from '../../../../design-system/components/data-display/StatTile.jsx';
import { PageHeader } from '../../../../design-system/components/data-display/PageHeader.jsx';
import { EmptyState } from '../../../../design-system/components/feedback/EmptyState.jsx';
import { Badge } from '../../../../design-system/components/feedback/Badge.jsx';
import { Icon } from '../../../../design-system/components/icons/Icon.jsx';
import { Field } from '../../../../design-system/components/forms/Field.jsx';
import { Input } from '../../../../design-system/components/forms/Input.jsx';
import { DateField } from '../../../../design-system/components/forms/DateField.jsx';
import { Select } from '../../../../design-system/components/forms/Select.jsx';
import { Checkbox } from '../../../../design-system/components/forms/Checkbox.jsx';
import { Switch } from '../../../../design-system/components/forms/Switch.jsx';
import { Table } from '../../../../design-system/components/data-display/Table.jsx';

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
    // Rendered outside AppShell, so it supplies the same 24px gutter the
    // shell normally does — otherwise the preview misrepresents spacing.
    <main className="page" style={{ padding: 24 }}>
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

      <h2 style={{ margin: '28px 0 12px' }}>Form controls</h2>
      <section className="panel">
        <div className="form-grid">
          <Field className="field-span-2" label="Pool name" hint="Shown everywhere this pool appears.">
            <Input placeholder="Jornada 12" defaultValue="" />
          </Field>
          <Field label="Date" required>
            <DateField defaultValue="2026-06-11" />
          </Field>
          <Field label="Deadline">
            <DateField type="datetime-local" defaultValue="2026-06-11T20:00" />
          </Field>
          <Field label="Doubles" required>
            <Input type="number" min={0} max={14} defaultValue={6} />
          </Field>
          <Field label="Assignee">
            <Select defaultValue="a">
              <option value="a">Ana</option>
              <option value="b">Bruno</option>
            </Select>
          </Field>
          <Field label="Invalid example" error="Enter a value between 0 and 14.">
            <Input type="number" defaultValue={99} invalid />
          </Field>
          <div className="field-span-2" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Checkbox label="Elige 8" defaultChecked />
            <Switch label="Receive notifications" checked onChange={() => {}} />
          </div>
        </div>
      </section>

      <h2 style={{ margin: '28px 0 12px' }}>EmptyState</h2>
      <EmptyState
        icon={<Icon name="trophy" size={22} />}
        title="No pools yet"
        description="Create the first pool for this team to get started."
        action={<Button variant="primary">Create pool</Button>}
      />

      <h2 style={{ margin: '28px 0 12px' }}>Table — the matches list, as a real table</h2>
      <p className="muted" style={{ margin: '0 0 12px' }}>
        Quinielas and Próximas were CSS grids with a header row of column labels. Same
        columns, now a real table on the shared component, so kini matches gpool and the
        operator console.
      </p>
      <Table density="compact" hoverable={false} minWidth={520} className="matches-table">
        <thead>
          <tr>
            <th className="match-col-order">#</th>
            <th>Partido</th>
            <th>Pronóstico</th>
            <th className="match-col-e8">E8</th>
          </tr>
        </thead>
        <tbody>
          {[
            { n: 1, home: 'Real Madrid', away: 'Barcelona' },
            { n: 2, home: 'Atlético', away: 'Sevilla' },
          ].map((m) => (
            <tr className="match-row" key={m.n}>
              <td className="match-order"><span className="match-order">{m.n}</span></td>
              <td className="match-teams">
                <strong>{m.home}</strong>
                <span>{m.away}</span>
              </td>
              <td>
                <div className="result-buttons">
                  {['1', 'X', '2'].map((v) => (
                    <button className="result-button" key={v} type="button">{v}</button>
                  ))}
                </div>
              </td>
              <td className="e8-check">
                <label>
                  <span className="sr-only">E8</span>
                  <input type="checkbox" readOnly />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

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
