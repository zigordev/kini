import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
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
      this.logger.error(
        `${request.method} ${request.url} - ${problem.status} - ${problem.code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    return response
      .status(problem.status)
      .type(PROBLEM_CONTENT_TYPE)
      .json(problem);
  }
}
