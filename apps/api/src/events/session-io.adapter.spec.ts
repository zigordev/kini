import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { vi } from 'vitest';
import type { RequestHandler } from 'express';
import type { Server, Socket } from 'socket.io';
import { io as connect } from 'socket.io-client';
import { registry } from '../observability';
import {
  isOriginAllowed,
  onlyOnHandshake,
  requireSignedInUser,
  SessionIoAdapter,
  sessionUserId,
} from './session-io.adapter';

const withSession = (user: unknown) =>
  ({ session: { passport: { user } } }) as unknown as IncomingMessage;

const connections = async (outcome: string, reason: string) =>
  (await registry.getSingleMetric('kini_websocket_connections_total')?.get())?.values.find(
    (value) => value.labels.outcome === outcome && value.labels.reason === reason
  )?.value ?? 0;

describe('isOriginAllowed', () => {
  it('lets a request without an Origin through, since only browsers send one', () => {
    expect(isOriginAllowed(undefined, ['https://kini.example'])).toBe(true);
  });

  it('accepts a listed origin and refuses any other', () => {
    expect(isOriginAllowed('https://kini.example', ['https://kini.example'])).toBe(true);
    expect(isOriginAllowed('https://tolgee.example', ['https://kini.example'])).toBe(false);
  });

  it('refuses every origin when none is configured', () => {
    expect(isOriginAllowed('https://kini.example', [])).toBe(false);
  });
});

describe('sessionUserId', () => {
  it('reads the user id passport keeps in the session', () => {
    expect(sessionUserId(withSession('user-1'))).toBe('user-1');
  });

  it('finds nobody without a session or with an unusable id', () => {
    expect(sessionUserId({} as IncomingMessage)).toBeUndefined();
    expect(sessionUserId(withSession(undefined))).toBeUndefined();
    expect(sessionUserId(withSession(''))).toBeUndefined();
    expect(sessionUserId(withSession({ id: 'user-1' }))).toBeUndefined();
  });
});

describe('onlyOnHandshake', () => {
  const res = {} as ServerResponse;

  it('runs the middleware on the handshake, which carries no sid yet', () => {
    const middleware = vi.fn();
    const next = vi.fn();

    onlyOnHandshake(middleware)({ _query: {} } as unknown as IncomingMessage, res, next);

    expect(middleware).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('skips it on the requests that follow', () => {
    const middleware = vi.fn();
    const next = vi.fn();

    onlyOnHandshake(middleware)(
      { _query: { sid: 'abc' } } as unknown as IncomingMessage,
      res,
      next
    );

    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('requireSignedInUser', () => {
  const socket = (request: IncomingMessage) => ({ request, data: {} }) as unknown as Socket;

  it('admits a signed-in user and remembers who it is', async () => {
    const before = await connections('accepted', 'none');
    const next = vi.fn();
    const admitted = socket(withSession('user-1'));

    requireSignedInUser(admitted, next);

    expect(next).toHaveBeenCalledWith();
    expect(admitted.data.userId).toBe('user-1');
    expect(await connections('accepted', 'none')).toBe(before + 1);
  });

  it('refuses a socket without a session', async () => {
    const before = await connections('rejected', 'no_session');
    const next = vi.fn();

    requireSignedInUser(socket({} as IncomingMessage), next);

    expect(next).toHaveBeenCalledWith(new Error('unauthorized'));
    expect(await connections('rejected', 'no_session')).toBe(before + 1);
  });
});

describe('SessionIoAdapter', () => {
  const allowedOrigin = 'http://kini.test';
  let server: Server;
  let url: string;

  const fakeSession: RequestHandler = (req, _res, next) => {
    if ((req.headers.cookie ?? '').includes('sid=signed-in')) {
      (req as unknown as { session: unknown }).session = { passport: { user: 'user-1' } };
    }
    next();
  };

  const attempt = (headers: Record<string, string> = {}) =>
    new Promise<{ outcome: string; userId?: unknown }>((resolve) => {
      const socket = connect(url, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 5_000,
        extraHeaders: headers,
      });
      socket.on('hello', (userId: unknown) => {
        socket.close();
        resolve({ outcome: 'connected', userId });
      });
      socket.on('connect_error', (error: Error) => {
        socket.close();
        resolve({ outcome: error.message });
      });
    });

  beforeAll(async () => {
    const http = createServer();
    server = new SessionIoAdapter(http, fakeSession, [allowedOrigin]).createIOServer(0);
    server.on('connection', (socket) => socket.emit('hello', socket.data.userId));
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('refuses a connection that carries no session', async () => {
    expect(await attempt()).toEqual({ outcome: 'unauthorized' });
  });

  it('accepts a signed-in connection and hands the gateway the user id', async () => {
    expect(await attempt({ cookie: 'sid=signed-in' })).toEqual({
      outcome: 'connected',
      userId: 'user-1',
    });
  });

  it('accepts a signed-in browser on an allowed origin', async () => {
    expect(await attempt({ cookie: 'sid=signed-in', origin: allowedOrigin })).toEqual({
      outcome: 'connected',
      userId: 'user-1',
    });
  });

  it('refuses a browser on any other origin, session or not', async () => {
    const before = await connections('rejected', 'bad_origin');

    const result = await attempt({ cookie: 'sid=signed-in', origin: 'http://evil.test' });

    expect(result.outcome).not.toBe('connected');
    expect(await connections('rejected', 'bad_origin')).toBe(before + 1);
  });
});
