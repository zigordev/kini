// FIRST, above every other import. OpenTelemetry instruments by patching
// modules as they load, so anything required before this line goes untraced.
// Do not let a formatter or an import sorter move it.
import './observability/tracing';

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as connectPgSimple from 'connect-pg-simple';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import * as session from 'express-session';
import * as passport from 'passport';
import { Pool } from 'pg';

import { AppModule } from './app.module';
import { buildSessionPoolConfig, SESSION_TABLE_NAME } from './auth/session-store.config';
import { HttpErrorFilter } from './common/http-exception.filter';
import { httpMetricsMiddleware, JsonLogger } from './observability';

const SWAGGER_PATH = '/docs';

type TrustProxy = boolean | number | 'loopback' | 'linklocal' | 'uniquelocal';

function parseTrustProxy(input: string | undefined): TrustProxy {
  if (input === undefined || input === null || input.trim() === '') {
    return false;
  }

  const normalized = input.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  if (normalized === 'loopback' || normalized === 'linklocal' || normalized === 'uniquelocal') {
    return normalized;
  }
  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  throw new Error(
    'TRUST_PROXY must be one of: false, true, loopback, linklocal, uniquelocal, or a numeric hop count'
  );
}

async function bootstrap() {
  // `bufferLogs` holds the bootstrap lines until the logger is installed, so
  // startup logs come out as JSON with a traceId like everything else.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(JsonLogger));
  app.use(httpMetricsMiddleware);

  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp?.set === 'function') {
    expressApp.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
  }

  const configService = app.get(ConfigService);

  const apiSecurityHeaders = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
        'frame-ancestors': ["'none'"],
      },
    },
  });

  const swaggerSecurityHeaders = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
        'frame-ancestors': ["'none'"],
      },
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) =>
    req.path === SWAGGER_PATH || req.path.startsWith(`${SWAGGER_PATH}/`)
      ? swaggerSecurityHeaders(req, res, next)
      : apiSecurityHeaders(req, res, next)
  );

  app.use(cookieParser(configService.get<string>('SESSION_COOKIE_SECRET')));

  const PgSession = connectPgSimple(session);
  const sessionPool = new Pool(buildSessionPoolConfig(configService));

  app.use(
    session({
      store: new PgSession({
        pool: sessionPool,
        tableName: SESSION_TABLE_NAME,
        createTableIfMissing: true,
      }),
      secret: configService.get<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      name: configService.get<string>('SESSION_COOKIE_NAME'),
      cookie: {
        maxAge: Number(configService.get<string>('SESSION_COOKIE_MAX_AGE_MS')),
        sameSite: configService.get<string>('SESSION_COOKIE_SAME_SITE') as
          boolean | 'lax' | 'strict' | 'none',
        httpOnly: true,
        secure: configService.get<string>('SESSION_COOKIE_SECURE') === 'true',
        domain: configService.get<string>('SESSION_COOKIE_DOMAIN') ?? undefined,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    })
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpErrorFilter());

  const corsOrigins = configService
    .get<string>('AUTH_CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Kini API')
    .setDescription('API documentation for the Kini service')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH.slice(1), app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<string>('PORT');
  await app.listen(port);
}
bootstrap();
