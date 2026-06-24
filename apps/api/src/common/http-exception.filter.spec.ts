import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpErrorFilter } from './http-exception.filter';

describe('HttpErrorFilter', () => {
  let filter: HttpErrorFilter;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpErrorFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HttpException with object payload', () => {
    it('should format with code, params, and message', () => {
      const exception = new HttpException(
        {
          code: 'CUSTOM.ERROR',
          params: { field: 'email' },
          message: 'Invalid email format',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 400,
        code: 'CUSTOM.ERROR',
        params: { field: 'email' },
        message: 'Invalid email format',
      });
    });

    it('should handle payload without code', () => {
      const exception = new HttpException(
        {
          message: 'Something went wrong',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 500,
        code: undefined,
        params: undefined,
        message: 'Something went wrong',
      });
    });

    it('should handle payload without params', () => {
      const exception = new HttpException(
        {
          code: 'AUTH.FAILED',
          message: 'Authentication failed',
        },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 401,
        code: 'AUTH.FAILED',
        params: undefined,
        message: 'Authentication failed',
      });
    });
  });

  describe('HttpException with string payload', () => {
    it('should format string message', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 404,
        message: 'Not found',
      });
    });
  });

  describe('Unknown errors', () => {
    it('should handle unknown errors with 500 status', () => {
      const error = new Error('Unexpected error');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 500,
        code: 'GENERIC.UNKNOWN',
        message: 'Unexpected error',
      });
    });

    it('should handle errors without message', () => {
      const error = { something: 'weird' };

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 500,
        code: 'GENERIC.UNKNOWN',
        message: 'Internal server error',
      });
    });

    it('should handle null errors', () => {
      filter.catch(null, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 500,
        code: 'GENERIC.UNKNOWN',
        message: 'Internal server error',
      });
    });
  });

  describe('Different HTTP status codes', () => {
    it('should handle 400 Bad Request', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle 401 Unauthorized', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle 403 Forbidden', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle 404 Not Found', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});
