import { describe, expect, it } from 'vitest';

import { registry } from '@/observability/metrics.registry';
import { RUM_INTERACTIONS } from '@/observability/rum-events';

import { POST } from './route';

let nextAddress = 1;

const post = (events: unknown[]) =>
  POST(
    new Request('http://localhost:3001/rum/events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `203.0.113.${nextAddress++}`,
      },
      body: JSON.stringify({ events }),
    })
  );

const interactionCount = async (name: string, page: string) => {
  const metric = await registry.getSingleMetric('rum_interactions_total')?.get();
  return (
    metric?.values.find(
      (value) => value.labels.interaction_type === name && value.labels.page === page
    )?.value ?? 0
  );
};

describe('POST /rum/events', () => {
  it('exports every declared interaction at zero before a beacon arrives', async () => {
    for (const name of RUM_INTERACTIONS) {
      expect(await interactionCount(name, '/')).toBe(0);
    }
  });

  it('counts a declared interaction under its own name', async () => {
    const before = await interactionCount('pool-created', '/create-pool');

    const response = await post([
      { type: 'interaction', name: 'pool-created', page: '/create-pool' },
    ]);

    expect(response.status).toBe(204);
    expect(await interactionCount('pool-created', '/create-pool')).toBe(before + 1);
  });

  it('collapses an undeclared name to other', async () => {
    const before = await interactionCount('other', '/create-pool');

    const response = await post([
      { type: 'interaction', name: 'pool-renamed', page: '/create-pool' },
    ]);

    expect(response.status).toBe(204);
    expect(await interactionCount('pool-renamed', '/create-pool')).toBe(0);
    expect(await interactionCount('other', '/create-pool')).toBe(before + 1);
  });
});
