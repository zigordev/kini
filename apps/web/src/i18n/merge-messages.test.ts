import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Messages } from './translator';

const loadLocalMessages = vi.hoisted(() => vi.fn<() => Promise<Messages | null>>());
const loadRemoteMessages = vi.hoisted(() => vi.fn<() => Promise<Messages | null>>());

vi.mock('./local', () => ({ loadLocalMessages }));
vi.mock('./remote', () => ({ loadRemoteMessages }));

import { loadMessages } from './messages';

describe('loadMessages list merging', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    delete (globalThis as Record<symbol, unknown>)[Symbol.for('kini.i18n.listLengthReported')];
  });

  const merge = async (local: Messages, remote: Messages) => {
    loadLocalMessages.mockResolvedValue(local);
    loadRemoteMessages.mockResolvedValue(remote);
    return loadMessages('en');
  };

  it('layers the export over the committed copy key by key', async () => {
    const messages = await merge(
      { pools: { title: 'Pools', empty: 'No pools yet' } },
      { pools: { title: 'Quinielas' } }
    );

    expect(messages).toEqual({ pools: { title: 'Quinielas', empty: 'No pools yet' } });
  });

  it('takes the export list when it matches the committed one entry for entry', async () => {
    const messages = await merge(
      { pools: { steps: ['one', 'two'] } },
      { pools: { steps: ['uno', 'dos'] } }
    );

    expect(messages).toEqual({ pools: { steps: ['uno', 'dos'] } });
  });

  it('keeps the fields of a list entry the export did not carry', async () => {
    const messages = await merge(
      { pools: { steps: [{ label: 'Join', hint: 'Pick a pool first' }] } },
      { pools: { steps: [{ label: 'Unirse' }] } }
    );

    expect(messages).toEqual({
      pools: { steps: [{ label: 'Unirse', hint: 'Pick a pool first' }] },
    });
  });

  it('keeps the committed list when the export carries fewer entries', async () => {
    const messages = await merge(
      { pools: { steps: ['one', 'two', 'three'] } },
      { pools: { steps: ['uno', 'dos'] } }
    );

    expect(messages).toEqual({ pools: { steps: ['one', 'two', 'three'] } });
  });

  it('keeps the committed list when the export carries more entries', async () => {
    const messages = await merge(
      { pools: { steps: ['one', 'two'] } },
      { pools: { steps: ['uno', 'dos', 'tres'] } }
    );

    expect(messages).toEqual({ pools: { steps: ['one', 'two'] } });
  });

  it('names the list it kept, once per process', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await merge({ pools: { steps: ['one', 'two'] } }, { pools: { steps: ['uno'] } });
    await merge({ pools: { steps: ['one', 'two'] } }, { pools: { steps: ['uno'] } });

    const mismatches = stdout.mock.calls
      .map(([line]) => JSON.parse(String(line)))
      .filter((record) => record.event === 'i18n.list_length_mismatch');

    expect(mismatches).toEqual([
      expect.objectContaining({
        level: 'warn',
        key: 'pools.steps',
        committed: 2,
        remote: 1,
      }),
    ]);
  });
});
