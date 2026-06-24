import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<GoogleAuthGuard>(GoogleAuthGuard);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should block when OAuth is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 503,
        code: 'AUTH.GOOGLE_UNAVAILABLE',
        message: 'Google OAuth is not configured',
      });
    });

    it('should throw when OAuth is not configured and no response', async () => {
      configService.get.mockReturnValue(undefined);

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(undefined),
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should allow when OAuth is configured', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'test-client-id';
        if (key === 'GOOGLE_CLIENT_SECRET') return 'test-secret';
        return undefined;
      });

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue({} as Response),
          getRequest: jest.fn().mockReturnValue({} as Request),
        }),
      } as unknown as ExecutionContext;

      // Mock parent canActivate
      jest
        .spyOn(Object.getPrototypeOf(GoogleAuthGuard.prototype), 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('getAuthenticateOptions', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'test-client-id';
        if (key === 'GOOGLE_CLIENT_SECRET') return 'test-secret';
        if (key === 'GOOGLE_CALLBACK_URL')
          return 'http://localhost:3012/auth/google/callback';
        return undefined;
      });
    });

    it('should extract redirect_uri from query', () => {
      const mockRequest = {
        query: { redirect_uri: 'https://app.example.com/success' },
        session: {},
        headers: { host: 'localhost:3012' },
      } as unknown as Request;

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      jest
        .spyOn(
          Object.getPrototypeOf(GoogleAuthGuard.prototype),
          'getAuthenticateOptions',
        )
        .mockReturnValue({});

      const options = guard.getAuthenticateOptions(context);

      expect(options.session).toBe(true);
      expect(options.state).toBeTruthy();
    });

    it('should handle failure_redirect param', () => {
      const mockRequest = {
        query: { failure_redirect: 'https://app.example.com/error' },
        session: {},
        headers: { host: 'localhost:3012' },
      } as unknown as Request;

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      jest
        .spyOn(
          Object.getPrototypeOf(GoogleAuthGuard.prototype),
          'getAuthenticateOptions',
        )
        .mockReturnValue({});

      const options = guard.getAuthenticateOptions(context);

      expect(options.state).toBeTruthy();
    });

    it('should handle prompt param', () => {
      const mockRequest = {
        query: { prompt: 'consent' },
        session: {},
        headers: { host: 'localhost:3012' },
      } as unknown as Request;

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      jest
        .spyOn(
          Object.getPrototypeOf(GoogleAuthGuard.prototype),
          'getAuthenticateOptions',
        )
        .mockReturnValue({});

      const options = guard.getAuthenticateOptions(context);

      expect(options.prompt).toBe('consent');
    });

    it('should resolve callback URL from host header', () => {
      const mockRequest = {
        query: {},
        session: {},
        headers: { host: 'app.example.com', 'x-forwarded-proto': 'https' },
      } as unknown as Request;

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      jest
        .spyOn(
          Object.getPrototypeOf(GoogleAuthGuard.prototype),
          'getAuthenticateOptions',
        )
        .mockReturnValue({});

      const options = guard.getAuthenticateOptions(context);

      expect(options.callbackURL).toBe(
        'https://app.example.com/auth/google/callback',
      );
    });

    it('should handle x-forwarded-proto header', () => {
      const mockRequest = {
        query: {},
        session: {},
        headers: { host: 'app.example.com', 'x-forwarded-proto': 'https' },
        protocol: 'http',
      } as unknown as Request;

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      jest
        .spyOn(
          Object.getPrototypeOf(GoogleAuthGuard.prototype),
          'getAuthenticateOptions',
        )
        .mockReturnValue({});

      const options = guard.getAuthenticateOptions(context);

      expect(options.callbackURL).toContain('https://');
    });
  });
});
