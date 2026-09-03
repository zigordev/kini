import { vi } from 'vitest';
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
      isAuthenticated: vi.fn().mockReturnValue(true),
    };

    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(mockRequest.isAuthenticated).toHaveBeenCalled();
  });

  it('should block unauthenticated requests', () => {
    const mockRequest = {
      isAuthenticated: vi.fn().mockReturnValue(false),
    };

    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException with proper error code', () => {
    const mockRequest = {
      isAuthenticated: vi.fn().mockReturnValue(false),
    };

    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    try {
      guard.canActivate(context);
      // `fail()` was a Jest global; Vitest's equivalent is expect.fail().
      expect.fail('Should have thrown');
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
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
