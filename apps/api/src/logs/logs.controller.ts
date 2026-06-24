import { Body, Controller, Headers, Post } from '@nestjs/common';

type UiLog = {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  timestamp?: number;
};

@Controller('logs')
export class LogsController {
  @Post()
  async ingest(@Body() log: UiLog, @Headers('user-agent') ua?: string) {
    const entry = {
      level: log.level ?? 'info',
      message: 'ui_log',
      app: 'kini-ui',
      log: {
        message: log.message,
        context: log.context,
        userAgent: ua,
        timestamp: log.timestamp ?? Date.now(),
      },
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
    return undefined; // 204
  }
}
