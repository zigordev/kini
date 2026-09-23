import type { Server as HttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { RequestHandler } from 'express';
import type { Server, ServerOptions, Socket } from 'socket.io';
import { countWebsocketAccepted, countWebsocketRejected } from '../metrics/domain-metrics';

type EngineMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void
) => void;

type HandshakeRequest = IncomingMessage & {
  _query?: Record<string, string | undefined>;
  session?: { passport?: { user?: unknown } };
};

const logger = new Logger('WebSocket');

export function isOriginAllowed(origin: string | undefined, allowed: readonly string[]): boolean {
  return origin === undefined || allowed.includes(origin);
}

export function sessionUserId(request: IncomingMessage): string | undefined {
  const user = (request as HandshakeRequest).session?.passport?.user;
  return typeof user === 'string' && user.length > 0 ? user : undefined;
}

export function onlyOnHandshake(middleware: EngineMiddleware): EngineMiddleware {
  return (req, res, next) => {
    if ((req as HandshakeRequest)._query?.sid === undefined) {
      middleware(req, res, next);
      return;
    }
    next();
  };
}

export function requireSignedInUser(socket: Socket, next: (err?: Error) => void): void {
  const userId = sessionUserId(socket.request);
  if (!userId) {
    countWebsocketRejected('no_session');
    logger.log({ event: 'ws.connection_rejected', reason: 'no_session' });
    next(new Error('unauthorized'));
    return;
  }
  socket.data.userId = userId;
  countWebsocketAccepted();
  next();
}

export class SessionIoAdapter extends IoAdapter {
  constructor(
    appOrHttpServer: INestApplicationContext | HttpServer,
    private readonly sessionMiddleware: RequestHandler,
    private readonly allowedOrigins: readonly string[]
  ) {
    super(appOrHttpServer);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: [...this.allowedOrigins], credentials: true },
      allowRequest: (request, callback) => {
        const origin = request.headers.origin;
        if (isOriginAllowed(origin, this.allowedOrigins)) {
          callback(null, true);
          return;
        }
        countWebsocketRejected('bad_origin');
        logger.warn({
          event: 'ws.connection_rejected',
          reason: 'bad_origin',
          origin: origin?.slice(0, 200),
        });
        callback('origin not allowed', false);
      },
    }) as Server;
    server.engine.use(onlyOnHandshake(this.sessionMiddleware as unknown as EngineMiddleware));
    server.use(requireSignedInUser);
    return server;
  }
}
