import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null) {
        const body = payload as Record<string, unknown>;
        const code =
          typeof body.code === 'string' ? (body.code as string) : undefined;
        const params =
          typeof body.params === 'object' && body.params !== null
            ? body.params
            : undefined;
        const message =
          typeof body.message === 'string'
            ? (body.message as string)
            : undefined;

        return response.status(status).json({
          status,
          code,
          params,
          message,
        });
      }

      // Payload is a string
      return response.status(status).json({
        status,
        message: String(payload),
      });
    }

    // Unknown error fallback
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    return response.status(status).json({
      status,
      code: 'GENERIC.UNKNOWN',
      message: (exception as any)?.message ?? 'Internal server error',
    });
  }
}
