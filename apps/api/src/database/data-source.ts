import 'dotenv/config';
import { DataSource } from 'typeorm';

const sslEnabled = process.env.DATABASE_SSL === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [`${__dirname}/../**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
  synchronize: false,
  ssl: sslEnabled
    ? {
        rejectUnauthorized:
          process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
        ca: process.env.DATABASE_CA_CERT || undefined,
      }
    : undefined,
});
