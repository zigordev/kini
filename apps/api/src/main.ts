import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import * as session from 'express-session';
import * as passport from 'passport';

import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security headers. CSP is off: this is a JSON API, where a content policy
  // buys nothing, and both gpool and kini serve Swagger UI, which needs the
  // inline scripts a default helmet CSP would block. The headers that matter
  // here — HSTS, nosniff, frame-options, referrer-policy — are all still set.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(cookieParser(configService.get<string>('SESSION_COOKIE_SECRET')));

  app.use(
    session({
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
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
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
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<string>('PORT');
  await app.listen(port);
}
bootstrap();
