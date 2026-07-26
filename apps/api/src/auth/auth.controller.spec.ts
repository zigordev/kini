import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            sanitizeUser: jest.fn(),
            getSuccessRedirectUrl: jest.fn(),
            getFailureRedirectUrl: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleConfig', () => {
    it('should return Google OAuth configuration', () => {
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-secret',
        };
        return config[key];
      });

      const result = controller.googleConfig();

      expect(result).toEqual({
        clientId: 'test-client-id',
        scopes: ['profile', 'email'],
        enabled: true,
      });
    });

    it('should return disabled when credentials missing', () => {
      configService.get.mockReturnValue(undefined);

      const result = controller.googleConfig();

      expect(result.enabled).toBe(false);
    });
  });

  describe('googleCallback', () => {
    let mockRequest: Request;
    let mockResponse: Response;
    let mockSession: Session &
      SessionData & {
        oauthSuccessRedirect?: string;
        oauthFailureRedirect?: string;
      };

    beforeEach(() => {
      mockSession = {
        oauthSuccessRedirect: undefined,
        oauthFailureRedirect: undefined,
      } as any;

      mockRequest = {
        user: mockUser,
        sessionID: 'session-123',
        session: mockSession,
        query: {},
      } as any;

      mockResponse = {
        redirect: jest.fn(),
      } as any;
    });

    it('should redirect to success URL on successful auth', async () => {
      authService.getSuccessRedirectUrl.mockReturnValue(
        'https://example.com/success?userId=user-123',
      );

      await controller.googleCallback(mockRequest, mockResponse);

      expect(authService.getSuccessRedirectUrl).toHaveBeenCalledWith(
        mockUser,
        null,
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://example.com/success?userId=user-123',
      );
    });

    it('should redirect to failure URL when user is missing', async () => {
      mockRequest.user = undefined;
      authService.getFailureRedirectUrl.mockReturnValue(
        'https://example.com/error?error=missing_user',
      );

      await controller.googleCallback(mockRequest, mockResponse);

      expect(authService.getFailureRedirectUrl).toHaveBeenCalledWith(
        'missing_user',
        null,
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://example.com/error?error=missing_user',
      );
    });

    it('should clean up session redirects', async () => {
      mockSession.oauthSuccessRedirect = 'https://custom.com/success';
      mockSession.oauthFailureRedirect = 'https://custom.com/error';
      authService.getSuccessRedirectUrl.mockReturnValue(
        'https://example.com/success',
      );

      await controller.googleCallback(mockRequest, mockResponse);

      expect(mockSession.oauthSuccessRedirect).toBeUndefined();
      expect(mockSession.oauthFailureRedirect).toBeUndefined();
    });

    it('should ignore query state and use only the session redirect', async () => {
      mockRequest.query = {
        state: Buffer.from(
          JSON.stringify({ redirectUri: 'https://attacker.example' }),
        ).toString('base64url'),
      };
      mockSession.oauthSuccessRedirect =
        'https://app.example.com/auth/callback';
      authService.getSuccessRedirectUrl.mockReturnValue(
        'https://app.example.com/auth/callback?userId=user-123',
      );

      await controller.googleCallback(mockRequest, mockResponse);

      expect(authService.getSuccessRedirectUrl).toHaveBeenCalledWith(
        mockUser,
        'https://app.example.com/auth/callback',
      );
    });

    it('should ignore malformed OAuth state and use the session redirect', async () => {
      mockRequest.query = { state: 'tampered-not-base64-json' };
      mockSession.oauthSuccessRedirect =
        'https://app.example.com/auth/callback';
      authService.getSuccessRedirectUrl.mockReturnValue(
        'https://app.example.com/auth/callback?userId=user-123',
      );

      await controller.googleCallback(mockRequest, mockResponse);

      expect(authService.getSuccessRedirectUrl).toHaveBeenCalledWith(
        mockUser,
        'https://app.example.com/auth/callback',
      );
    });
  });

  describe('me', () => {
    it('should return sanitized user data', () => {
      const mockRequest = { user: mockUser } as any;
      const sanitizedUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: null,
        givenName: null,
        familyName: null,
        textColor: '#000',
        backgroundColor: '#FFF',
        language: 'en',
        theme: 'light',
        activeTeamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authService.sanitizeUser.mockReturnValue(sanitizedUser);

      const result = controller.me(mockRequest);

      expect(result).toEqual(sanitizedUser);
      expect(authService.sanitizeUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('logout', () => {
    it('should destroy session and clear cookie', async () => {
      const mockRequest = {
        logout: jest.fn((cb) => cb()),
        session: {
          destroy: jest.fn((cb) => cb()),
        },
      } as any;

      const mockResponse = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      configService.get.mockReturnValue('kini.sid');

      await controller.logout(mockRequest, mockResponse);

      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockRequest.session.destroy).toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('kini.sid', {
        path: '/',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });
  });
});
