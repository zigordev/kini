import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { vi } from 'vitest';
import { HttpErrorFilter } from './http-exception.filter';

describe('HttpErrorFilter', () => {
  let filter: HttpErrorFilter;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  const body = () => mockResponse.json.mock.calls[0][0];

  beforeEach(() => {
    filter = new HttpErrorFilter();
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue(mockResponse),
        getRequest: vi
          .fn()
          .mockReturnValue({ url: '/fut-pools/7f3a', method: 'GET' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('sends problem details with the content type the RFC defines', () => {
    filter.catch(
      new HttpException(
        {
          code: 'FUT_POOL.NOT_FOUND',
          message: 'Pool not found',
          params: { poolId: '7f3a' },
        },
        HttpStatus.NOT_FOUND,
      ),
      mockArgumentsHost,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.type).toHaveBeenCalledWith('application/problem+json');
    expect(body()).toEqual({
      type: 'https://zigordev.com/problems/fut-pool-not-found',
      title: 'Not found',
      status: 404,
      detail: 'Pool not found',
      instance: '/fut-pools/7f3a',
      code: 'FUT_POOL.NOT_FOUND',
      params: { poolId: '7f3a' },
    });
  });

  it('derives a code from the status when the throw carries none', () => {
    filter.catch(
      new HttpException('Nope', HttpStatus.FORBIDDEN),
      mockArgumentsHost,
    );

    expect(body()).toMatchObject({
      status: 403,
      code: 'HTTP.FORBIDDEN',
      detail: 'Nope',
    });
    expect(body().params).toBeUndefined();
  });

  it('turns anything that is not an HttpException into an opaque 500', () => {
    filter.catch(
      new Error('relation "fut_pool" does not exist'),
      mockArgumentsHost,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(body()).toEqual({
      type: 'https://zigordev.com/problems/http-internal-error',
      title: 'Internal server error',
      status: 500,
      instance: '/fut-pools/7f3a',
      code: 'HTTP.INTERNAL_ERROR',
    });
  });

  it('says nothing about why a thrown 5xx happened', () => {
    filter.catch(
      new HttpException(
        'connection terminated',
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
      mockArgumentsHost,
    );

    expect(body().status).toBe(503);
    expect(body().detail).toBeUndefined();
  });

  it('joins a validation array under one code', () => {
    filter.catch(
      new HttpException(
        {
          statusCode: 400,
          message: ['name must be a string', 'size must be a number'],
        },
        HttpStatus.BAD_REQUEST,
      ),
      mockArgumentsHost,
    );

    expect(body()).toMatchObject({
      status: 400,
      code: 'VALIDATION.FAILED',
      detail: 'name must be a string; size must be a number',
    });
  });
});
