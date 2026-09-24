import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registry } from '@/observability/metrics.registry';

import { loadMessages } from './messages';

vi.mock('./local', () => ({ loadLocalMessages: vi.fn() }));
vi.mock('./remote', () => ({ loadRemoteMessages: vi.fn() }));

const { loadLocalMessages } = await import('./local');
const { loadRemoteMessages } = await import('./remote');

const local = vi.mocked(loadLocalMessages);
const remote = vi.mocked(loadRemoteMessages);

async function sources(): Promise<Record<string, number>> {
  const scrape = await registry.metrics();
  const counted: Record<string, number> = {};
  for (const line of scrape.split('\n')) {
    const match = /^kini_i18n_messages_total\{source="([a-z_]+)"\} (\d+)/.exec(line);
    if (match) counted[match[1]!] = Number(match[2]);
  }
  return counted;
}

describe('loadMessages', () => {
  beforeEach(() => {
    local.mockReset();
    remote.mockReset();
  });

  it('counts every known source from zero, so a silent fallback is visible', async () => {
    expect(await sources()).toEqual({ merged: 0, remote: 0, local: 0, default_locale: 0 });
  });

  it('records the merged copy when both Tolgee and the committed files answer', async () => {
    local.mockResolvedValue({ greeting: 'hola', only_local: 'local' });
    remote.mockResolvedValue({ greeting: 'hello' });

    await expect(loadMessages('en')).resolves.toEqual({
      greeting: 'hello',
      only_local: 'local',
    });
    expect((await sources()).merged).toBe(1);
  });

  it('records the committed copy when Tolgee has nothing to give', async () => {
    local.mockResolvedValue({ greeting: 'hello' });
    remote.mockResolvedValue(null);

    await expect(loadMessages('en')).resolves.toEqual({ greeting: 'hello' });
    expect((await sources()).local).toBe(1);
  });

  it('records the default locale when the requested one has no copy at all', async () => {
    local.mockImplementation(async (locale) => (locale === 'en' ? { greeting: 'hello' } : null));
    remote.mockResolvedValue(null);

    await expect(loadMessages('es')).resolves.toEqual({ greeting: 'hello' });
    const counted = await sources();
    expect(counted.default_locale).toBe(1);
    expect(counted.local).toBe(2);
  });

  it('throws when even the default locale has no copy', async () => {
    local.mockResolvedValue(null);
    remote.mockResolvedValue(null);

    await expect(loadMessages('en')).rejects.toThrow(/Translations not available/);
  });
});
