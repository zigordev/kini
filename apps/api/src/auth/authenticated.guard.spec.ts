import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedGuard } from './authenticated.guard';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;

  beforeEach(() => {
    guard = new AuthenticatedGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow authenticated requests', () => {
    const mockRequest = {
      isAuthenticated: jest.fn().mockReturnValue(true),
    };

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(mockRequest.isAuthenticated).toHaveBeenCalled();
  });

  it('should block unauthenticated requests', () => {
    const mockRequest = {
      isAuthenticated: jest.fn().mockReturnValue(false),
    };

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException with proper error code', () => {
    const mockRequest = {
      isAuthenticated: jest.fn().mockReturnValue(false),
    };

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    try {
      guard.canActivate(context);
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toEqual({
        code: 'AUTH.NOT_AUTHENTICATED',
        message: 'User session required',
      });
    }
  });

  it('should handle missing isAuthenticated method', () => {
    const mockRequest = {};

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
