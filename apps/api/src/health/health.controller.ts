import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/** Matches `OTEL_SERVICE_NAME`, so health, metrics, traces and logs all name
 *  this service identically. */
const SERVICE = 'kini-api';

/**
 * Liveness answers "is the process running" and must not touch a dependency —
 * a liveness probe that fails on a database blip gets the container killed,
 * turning a brief outage into a crash loop. Readiness answers "can this serve
 * traffic", and is the one worth alerting on.
 *
 * Readiness sets the status code directly instead of throwing. Throwing routes
 * the response through the global exception filter, which replaces the body
 * with its own error shape — so the 503 arrived saying nothing about *which*
 * dependency was down, which is the only useful part.
 *
 * Shape and paths follow the observability contract in platform-ops.
 */
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('liveness')
  liveness() {
    return { status: 'ok', service: SERVICE };
  }

  @Get('readiness')
  async readiness(@Res({ passthrough: true }) res: Response) {
    let db = false;
    try {
      await this.dataSource.query('SELECT 1');
      db = true;
    } catch {
      db = false;
    }

    if (!db) res.status(503);

    return {
      status: db ? 'ok' : 'error',
      service: SERVICE,
      components: { db: { status: db ? 'up' : 'down' } },
    };
  }

  /** Bare `/health` is readiness: it is what the compose healthcheck calls. */
  @Get()
  check(@Res({ passthrough: true }) res: Response) {
    return this.readiness(res);
  }
}
