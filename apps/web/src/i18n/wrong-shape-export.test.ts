import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { health, reportComponent } from '@/observability/health';
import { registry } from '@/observability/metrics.registry';

import { loadMessages } from './messages';

const NESTED = { pools: { title: 'Pools' } };
const FLAT = { 'pools.title': 'Pools' };

const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  });

async function sources(): Promise<Record<string, number>> {
  const scrape = await registry.metrics();
  const counted: Record<string, number> = {};
  for (const line of scrape.split('\n')) {
    const match = /^kini_i18n_messages_total\{source="([a-z_]+)"\} (\d+)/.exec(line);
    if (match) counted[match[1]!] = Number(match[2]);
  }
  return counted;
}

function expireCache(locale: string): void {
  const cache = (globalThis as unknown as Record<string, Map<string, { updatedAt: number }>>)
    .__tolgeeMessagesCache;
  cache.get(locale)!.updatedAt = 0;
}

describe('a wrong-shape export while a process holds a cached one', () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).__tolgeeMessagesCache;
    reportComponent('tolgee', 'unknown');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    process.env.TOLGEE_API_URL = 'http://tolgee.invalid';
    process.env.TOLGEE_API_KEY = 'test-key';
    process.env.TOLGEE_PROJECT_ID = '1';
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('is invisible to Prometheus: the render counts as merged and the component stays up', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(NESTED)).mockResolvedValue(json(FLAT));

    await loadMessages('en');
    const warm = await sources();

    expireCache('en');
    await loadMessages('en');
    const after = await sources();

    expect(after.merged).toBe(warm.merged! + 1);
    expect(after.local).toBe(warm.local);
    expect(health().components.tolgee).toEqual({ status: 'up' });
  });

  it('is visible to Prometheus only once no process holds one, which a restart guarantees', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(FLAT));

    const before = await sources();
    await loadMessages('en');

    expect((await sources()).local).toBe(before.local! + 1);
  });
});
