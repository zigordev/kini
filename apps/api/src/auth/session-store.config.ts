import { ConfigService } from '@nestjs/config';
import { PoolConfig } from 'pg';

export const SESSION_TABLE_NAME = 'user_sessions';

export function buildSessionPoolConfig(config: ConfigService): PoolConfig {
  const sslEnabled = config.get<string>('DATABASE_SSL') === 'true';

  return {
    host: config.get<string>('DATABASE_HOST'),
    port: Number(config.get<string>('DATABASE_PORT')),
    user: config.get<string>('DATABASE_USER'),
    password: config.get<string>('DATABASE_PASSWORD'),
    database: config.get<string>('DATABASE_NAME'),
    max: 4,
    ssl: sslEnabled
      ? {
          rejectUnauthorized:
            config.get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED') !== 'false',
          ca: config.get<string>('DATABASE_CA_CERT') || undefined,
        }
      : undefined,
  };
}
