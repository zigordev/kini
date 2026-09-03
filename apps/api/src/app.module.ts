import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AvailablePoolsModule } from './available-pools/available-pools.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { FutPoolMatchModule } from './fut-pool-match/fut-pool-match.module';
import { FutPoolModule } from './fut-pool/fut-pool.module';
import { HealthModule } from './health/health.module';
import { LogsModule } from './logs/logs.module';
import { NotificationModule } from './notifications/notification.module';
import { RumModule } from './rum/rum.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';
import { ObservabilityModule } from './observability';

@Module({
  imports: [
    // Brings `/metrics`, the shared prom-client registry, and the JSON logger.
    ObservabilityModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const sslEnabled = config.get<string>('DATABASE_SSL') === 'true';
        const synchronizeEnv = config.get<string>('DATABASE_SYNCHRONIZE');
        const isProd = config.get<string>('NODE_ENV') === 'production';
        const synchronize =
          synchronizeEnv !== undefined ? synchronizeEnv === 'true' : !isProd;
        const host = config.get<string>('DATABASE_HOST');
        const port = Number(config.get<number>('DATABASE_PORT'));
        const username = config.get<string>('DATABASE_USER');
        const password = config.get<string>('DATABASE_PASSWORD');
        const database = config.get<string>('DATABASE_NAME');

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize,
          // TLS *with* certificate verification.
          //
          // This was `{ rejectUnauthorized: false }`, which is encryption
          // without authentication: it stops someone reading the traffic but
          // not someone sitting in the middle of it presenting their own
          // certificate, which is the attack TLS exists to prevent. Turning
          // verification off is the usual shortcut when a managed database
          // presents a CA the container does not trust — the fix for that is
          // to supply the CA, not to stop checking.
          //
          // Verification is on by default and the opt-out is explicit, so
          // disabling it is now a deliberate act with a name attached.
          ssl: sslEnabled
            ? {
                rejectUnauthorized:
                  config.get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED') !==
                  'false',
                ca: config.get<string>('DATABASE_CA_CERT') || undefined,
              }
            : undefined,
        };
      },
    }),
    FutPoolModule,
    HealthModule,
    FutPoolMatchModule,
    UsersModule,
    AuthModule,
    EventsModule,
    TeamsModule,
    NotificationModule,
    RumModule,
    LogsModule,
    AvailablePoolsModule,
  ],
})
export class AppModule {}
