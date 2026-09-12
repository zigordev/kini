import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  internalProblem,
  PROBLEM_CONTENT_TYPE,
  problemFromException,
} from './http/problem-details';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problem =
      exception instanceof HttpException
        ? problemFromException(exception, request.url)
        : internalProblem(request.url);

    if (problem.status >= 500) {
      // The response withholds the reason; the log must not. Without this a
      // 500 says only HTTP.INTERNAL_ERROR, in the body and in the log alike.
      const reason = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(
        `${request.method} ${request.url} - ${problem.status} - ${problem.code}: ${reason}`,
        exception instanceof Error ? exception.stack : undefined
      );
    }

    return response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }
}
