import { beforeAll, describe, expect, it, vi } from 'vitest';

import { registry } from '@/observability/metrics.registry';
import { RUM_INTERACTIONS } from '@/observability/rum-events';
import { RUM_PAGES } from '@/observability/rum-pages';

vi.mock('@/observability/tracing', () => ({}));
vi.mock('@/observability/standard-events', () => ({
  logServiceStarted: vi.fn(),
  logServiceStopping: vi.fn(),
  observeProcessFailures: vi.fn(),
}));

const interactionValue = async (name: string, page: string) => {
  const metric = await registry.getSingleMetric('rum_interactions_total')?.get();
  return metric?.values.find(
    (value) => value.labels.interaction_type === name && value.labels.page === page
  )?.value;
};

describe('register', () => {
  beforeAll(() => {
    expect(registry.getSingleMetric('rum_interactions_total')).toBeUndefined();
  });

  it('declares the RUM vocabulary at startup, without the ingest route ever loading', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';
    const { register } = await import('./instrumentation');

    await register();

    for (const name of RUM_INTERACTIONS) {
      expect(await interactionValue(name, '/')).toBe(0);
    }

    const { pageLabel } = await import('@/observability/rum-metrics');
    for (const page of RUM_PAGES) {
      expect(pageLabel(page)).toBe(page);
    }
    expect(pageLabel('/not-a-kini-page')).toBe('other');
  });
});
