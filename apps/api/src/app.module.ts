import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { FutPoolMatchModule } from './fut-pool-match/fut-pool-match.module';
import { FutPoolModule } from './fut-pool/fut-pool.module';
import { LogsModule } from './logs/logs.module';
import { NotificationModule } from './notifications/notification.module';
import { RumModule } from './rum/rum.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
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
          ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
        };
      },
    }),
    FutPoolModule,
    FutPoolMatchModule,
    UsersModule,
    AuthModule,
    EventsModule,
    NotificationModule,
    RumModule,
    LogsModule,
  ],
})
export class AppModule {}
