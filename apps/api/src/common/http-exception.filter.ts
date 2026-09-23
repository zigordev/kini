import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  internalProblem,
  PROBLEM_CONTENT_TYPE,
  problemFromException,
} from './http/problem-details';
import { logRequestFailed } from '../observability/standard-events';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
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
      logRequestFailed({
        method: request.method,
        route: (request.route?.path as string | undefined) ?? 'unmatched',
        status: problem.status,
        error: exception,
      });
    }

    return response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }
}
