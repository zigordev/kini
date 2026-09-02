import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * kini had no health endpoint at all, so its compose healthcheck and any
 * `up{job="kini-api"}` alert had nothing to point at.
 *
 * The split matters. Liveness answers "is the process running" and must not
 * touch a dependency — a liveness probe that fails on a database blip gets the
 * container killed and restarted, turning a brief outage into a crash loop.
 * Readiness answers "can this actually serve traffic", and is the one worth
 * alerting on.
 */
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('liveness')
  liveness() {
    return { status: 'ok', service: 'api' };
  }

  @Get('readiness')
  async readiness() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', service: 'api', db: 'up' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'api',
        db: 'down',
      });
    }
  }

  /** Bare `/health` is readiness: it is what the compose healthcheck calls. */
  @Get()
  check() {
    return this.readiness();
  }
}
