import { Body, Controller, Headers, Post } from '@nestjs/common';

type RumEvent = {
  type: 'view' | 'error' | 'action';
  name?: string;
  path?: string;
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  timestamp?: number;
};

@Controller('rum')
export class RumController {
  @Post('event')
  async ingest(@Body() event: RumEvent, @Headers('user-agent') ua?: string) {
    // Emit single-line JSON logs for Promtail/Loki
    const normalized = {
      level: 'info',
      message: 'rum_event',
      event: {
        ...event,
        userAgent: event.userAgent ?? ua,
        timestamp: event.timestamp ?? Date.now(),
      },
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(normalized));

    return undefined; // 204 No Content
  }
}
