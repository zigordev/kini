import { ConfigService } from '@nestjs/config';
import { buildSessionPoolConfig } from './session-store.config';

function configFrom(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('buildSessionPoolConfig', () => {
  const base = {
    DATABASE_HOST: 'kini-postgres',
    DATABASE_PORT: '5432',
    DATABASE_USER: 'kini_admin',
    DATABASE_PASSWORD: 'secret',
    DATABASE_NAME: 'kini',
  };

  it('reads the same connection values the ORM uses', () => {
    expect(buildSessionPoolConfig(configFrom(base))).toMatchObject({
      host: 'kini-postgres',
      port: 5432,
      user: 'kini_admin',
      password: 'secret',
      database: 'kini',
    });
  });

  it('leaves TLS off when the database does not use it', () => {
    expect(buildSessionPoolConfig(configFrom(base)).ssl).toBeUndefined();
  });

  it('verifies the certificate by default once TLS is on', () => {
    const config = configFrom({ ...base, DATABASE_SSL: 'true' });

    expect(buildSessionPoolConfig(config).ssl).toEqual({
      rejectUnauthorized: true,
      ca: undefined,
    });
  });

  it('only skips verification when explicitly told to', () => {
    const config = configFrom({
      ...base,
      DATABASE_SSL: 'true',
      DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
      DATABASE_CA_CERT: 'a-ca-cert',
    });

    const ssl = buildSessionPoolConfig(config).ssl as {
      rejectUnauthorized: boolean;
      ca?: string;
    };

    expect(ssl.rejectUnauthorized).toBe(false);
    expect(ssl.ca).toBe('a-ca-cert');
  });

  it('caps the pool so it does not compete with the ORM for connections', () => {
    expect(buildSessionPoolConfig(configFrom(base)).max).toBe(4);
  });
});
