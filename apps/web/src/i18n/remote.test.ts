import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { health, reportComponent } from '@/observability/health';

import { loadRemoteMessages } from './remote';

describe('loadRemoteMessages', () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).__tolgeeMessagesCache;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('returns null when Tolgee is not configured, without calling fetch', async () => {
    delete process.env.TOLGEE_API_URL;
    delete process.env.TOLGEE_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(loadRemoteMessages('en')).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('asks for the i18next export, the dialect the committed messages are written in', async () => {
    process.env.TOLGEE_API_URL = 'http://tolgee.invalid';
    process.env.TOLGEE_API_KEY = 'test-key';
    process.env.TOLGEE_PROJECT_ID = '1';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ greeting: 'hello' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await loadRemoteMessages('en');

    const requested = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(requested.searchParams.get('format')).toBe('JSON_I18NEXT');
  });

  it('asks Tolgee to structure the export the way the committed messages are structured', async () => {
    process.env.TOLGEE_API_URL = 'http://tolgee.invalid';
    process.env.TOLGEE_API_KEY = 'test-key';
    process.env.TOLGEE_PROJECT_ID = '1';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ actions: { cancel: 'Cancel' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await loadRemoteMessages('en');

    const requested = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(requested.searchParams.get('structureDelimiter')).toBe('.');
    expect(requested.searchParams.get('supportArrays')).toBe('true');
  });

  it('keeps a structured export, arrays and all', async () => {
    process.env.TOLGEE_API_URL = 'http://tolgee.invalid';
    process.env.TOLGEE_API_KEY = 'test-key';
    process.env.TOLGEE_PROJECT_ID = '1';
    const nested = { pools: { steps: ['pick', 'submit'], title: 'Pools' } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(nested), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(loadRemoteMessages('en')).resolves.toEqual(nested);
  });

  it('falls back rather than throwing when the fetch rejects', async () => {
    process.env.TOLGEE_API_URL = 'http://tolgee.invalid';
    process.env.TOLGEE_API_KEY = 'test-key';
    process.env.TOLGEE_PROJECT_ID = '1';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connection refused'));

    await expect(loadRemoteMessages('en')).resolves.toBeNull();
  });

  it('falls back rather than throwing when Tolgee answers with an error status', async () => {
    process.env.TOLGEE_API_URL = 'http://tolgee.invalid';
    process.env.TOLGEE_API_KEY = 'test-key';
    process.env.TOLGEE_PROJECT_ID = '1';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 500 }) as Response
    );

    await expect(loadRemoteMessages('en')).resolves.toBeNull();
  });

  describe('health', () => {
    const configure = () => {
      process.env.TOLGEE_API_URL = 'http://tolgee.invalid';
      process.env.TOLGEE_API_KEY = 'test-key';
      process.env.TOLGEE_PROJECT_ID = '1';
    };

    const logged = (stdout: { mock: { calls: unknown[][] } }) =>
      stdout.mock.calls.map(([line]) => JSON.parse(String(line)));

    beforeEach(() => {
      reportComponent('tolgee', 'unknown');
    });

    it('reports Tolgee down when it answers with an error status, and says why', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 401 }));

      await loadRemoteMessages('en');

      expect(health().components.tolgee).toEqual({ status: 'down' });
      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          error: { name: 'HttpError', message: 'Tolgee answered 401' },
        })
      );
    });

    it('names the Tolgee error code, not just the status', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ code: 'invalid_project_api_key' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        })
      );

      await loadRemoteMessages('en');

      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          error: {
            name: 'HttpError',
            message: 'Tolgee answered 401 (invalid_project_api_key)',
          },
        })
      );
    });

    it('keeps Tolgee up when it has nothing to export for a language, and says so', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ code: 'no_exported_result', params: null }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      );

      await expect(loadRemoteMessages('es')).resolves.toBeNull();

      expect(health().components.tolgee).toEqual({ status: 'up' });
      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          locale: 'es',
          error: { name: 'NoExport', message: 'Tolgee has no es translations to export' },
        })
      );
    });

    it('reports Tolgee down for any other rejected request', async () => {
      configure();
      vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ code: 'validation_error' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(new Response('not json', { status: 400 }));

      await loadRemoteMessages('es');
      expect(health().components.tolgee).toEqual({ status: 'down' });

      reportComponent('tolgee', 'unknown');
      await loadRemoteMessages('es');
      expect(health().components.tolgee).toEqual({ status: 'down' });
    });

    it('keeps Tolgee up when the export comes back empty, because a 200 was answered', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('null', { status: 200, headers: { 'content-type': 'application/json' } })
      );

      await expect(loadRemoteMessages('es')).resolves.toBeNull();

      expect(health().components.tolgee).toEqual({ status: 'up' });
      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          locale: 'es',
          projectId: '1',
          error: { name: 'EmptyExport', message: 'Tolgee returned no messages' },
        })
      );
    });

    it('keeps Tolgee up when the archive it sends holds no JSON file', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const zip = new JSZip();
      zip.file('README.txt', 'exported with the wrong file filter');
      const archive = await zip.generateAsync({ type: 'arraybuffer' });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(archive, { status: 200, headers: { 'content-type': 'application/zip' } })
      );

      await expect(loadRemoteMessages('en')).resolves.toBeNull();

      expect(health().components.tolgee).toEqual({ status: 'up' });
      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          error: expect.objectContaining({ name: 'EmptyExport' }),
        })
      );
    });

    it('still reports Tolgee down when the body is not the archive it claims to be', async () => {
      configure();
      vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('not a zip', { status: 200, headers: { 'content-type': 'application/zip' } })
      );

      await expect(loadRemoteMessages('en')).resolves.toBeNull();

      expect(health().components.tolgee).toEqual({ status: 'down' });
    });

    it('still reports Tolgee down when the request never completes', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        Object.assign(new Error('The operation was aborted due to timeout'), {
          name: 'TimeoutError',
        })
      );

      await expect(loadRemoteMessages('en')).resolves.toBeNull();

      expect(health().components.tolgee).toEqual({ status: 'down' });
      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          error: expect.objectContaining({ name: 'TimeoutError' }),
        })
      );
    });

    it('refuses a flat export but keeps Tolgee up, because a 200 is not an unreachable Tolgee', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ 'actions.cancel': 'Cancel', 'pools.title': 'Pools' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await expect(loadRemoteMessages('en')).resolves.toBeNull();

      expect(health().components.tolgee).toEqual({ status: 'up' });
      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          source: 'local',
          error: {
            name: 'FlatExport',
            message: 'Tolgee returned dotted keys; the app reads a nested export',
          },
        })
      );
    });

    it('refuses an export that indexes arrays in the key, not in the value', async () => {
      configure();
      vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ 'pools[0]': 'first' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await expect(loadRemoteMessages('en')).resolves.toBeNull();
      expect(health().components.tolgee).toEqual({ status: 'up' });
    });

    it('names the locale and the Tolgee project on every fallback line', async () => {
      configure();
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ 'pools.title': 'Pools' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await loadRemoteMessages('es');

      expect(logged(stdout)).toContainEqual(
        expect.objectContaining({
          event: 'i18n.fallback',
          locale: 'es',
          projectId: '1',
          error: expect.objectContaining({ name: 'FlatExport' }),
        })
      );
    });

    it('reports Tolgee up when it answers, including a 304 for copy it already sent', async () => {
      configure();
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ greeting: 'hello' }), {
            status: 200,
            headers: { 'content-type': 'application/json', etag: '"v1"' },
          })
        )
        .mockResolvedValueOnce(new Response(null, { status: 304 }));

      await expect(loadRemoteMessages('en')).resolves.toEqual({ greeting: 'hello' });
      expect(health().components.tolgee).toEqual({ status: 'up' });

      reportComponent('tolgee', 'unknown');
      const cache = (globalThis as unknown as Record<string, Map<string, { updatedAt: number }>>)
        .__tolgeeMessagesCache;
      cache.get('en')!.updatedAt = 0;

      await expect(loadRemoteMessages('en')).resolves.toEqual({ greeting: 'hello' });
      expect(health().components.tolgee).toEqual({ status: 'up' });
    });
  });
});
