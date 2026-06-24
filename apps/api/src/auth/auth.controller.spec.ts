import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Session, SessionData, Store } from 'express-session';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MobileAuthTokenStore } from './mobile-auth-token.store';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;
  let mobileAuthTokenStore: jest.Mocked<MobileAuthTokenStore>;

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
        {
          provide: MobileAuthTokenStore,
          useValue: {
            createToken: jest.fn(),
            consumeToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    mobileAuthTokenStore = module.get(
      MobileAuthTokenStore,
    ) as jest.Mocked<MobileAuthTokenStore>;
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
          GOOGLE_MOBILE_REDIRECT_URI: 'https://mobile.example.com/callback',
        };
        return config[key];
      });

      const result = controller.googleConfig();

      expect(result).toEqual({
        clientId: 'test-client-id',
        scopes: ['profile', 'email'],
        mobileRedirectUri: 'https://mobile.example.com/callback',
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
      mobileAuthTokenStore.createToken.mockReturnValue('mobile-token-123');

      await controller.googleCallback(mockRequest, mockResponse);

      expect(authService.getSuccessRedirectUrl).toHaveBeenCalledWith(
        mockUser,
        null,
        { mobile_token: 'mobile-token-123' },
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

    it('should handle mobile token creation', async () => {
      mobileAuthTokenStore.createToken.mockReturnValue('mobile-token-123');
      authService.getSuccessRedirectUrl.mockReturnValue(
        'https://example.com/success',
      );

      await controller.googleCallback(mockRequest, mockResponse);

      expect(mobileAuthTokenStore.createToken).toHaveBeenCalledWith(
        'session-123',
        'user-123',
      );
      expect(authService.getSuccessRedirectUrl).toHaveBeenCalledWith(
        mockUser,
        null,
        { mobile_token: 'mobile-token-123' },
      );
    });

    it('should clean up session redirects', async () => {
      mockSession.oauthSuccessRedirect = 'https://custom.com/success';
      mockSession.oauthFailureRedirect = 'https://custom.com/error';
      authService.getSuccessRedirectUrl.mockReturnValue(
        'https://example.com/success',
      );
      mobileAuthTokenStore.createToken.mockReturnValue(null);

      await controller.googleCallback(mockRequest, mockResponse);

      expect(mockSession.oauthSuccessRedirect).toBeUndefined();
      expect(mockSession.oauthFailureRedirect).toBeUndefined();
    });

    it('should use OAuth state redirect', async () => {
      mockRequest.query = {
        state: Buffer.from(
          JSON.stringify({ redirectUri: 'https://state-redirect.com' }),
        ).toString('base64url'),
      };
      authService.getSuccessRedirectUrl.mockReturnValue(
        'https://state-redirect.com/success',
      );
      mobileAuthTokenStore.createToken.mockReturnValue(null);

      await controller.googleCallback(mockRequest, mockResponse);

      expect(authService.getSuccessRedirectUrl).toHaveBeenCalledWith(
        mockUser,
        expect.any(String),
        undefined,
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

  describe('exchangeMobileSession', () => {
    let mockRequest: Request & { sessionStore?: Store };
    let mockResponse: Response;
    let mockSessionStore: jest.Mocked<Store>;

    beforeEach(() => {
      mockSessionStore = {
        get: jest.fn(),
        touch: jest.fn(),
        set: jest.fn(),
      } as any;

      mockRequest = {
        sessionStore: mockSessionStore,
      } as any;

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
        send: jest.fn(),
      } as any;
    });

    it('should exchange token for session cookie', async () => {
      const body = { token: 'mobile-token-123' };
      const tokenRecord = {
        sessionId: 'session-123',
        userId: 'user-123',
        expiresAt: Date.now() + 10000,
      };
      const sessionData = {
        passport: { user: 'user-123' },
        cookie: {
          httpOnly: true,
          path: '/',
          maxAge: 3600000,
          sameSite: 'lax' as const,
          secure: false,
        },
      } as any;

      mobileAuthTokenStore.consumeToken.mockReturnValue(tokenRecord);
      mockSessionStore.get.mockImplementation((sid, cb) =>
        cb(null, sessionData),
      );
      mockSessionStore.touch.mockImplementation((sid, session, cb) => cb());
      configService.get.mockImplementation((key) => {
        if (key === 'SESSION_COOKIE_NAME') return 'kini.sid';
        if (key === 'SESSION_SECRET') return 'test-secret';
        return undefined;
      });

      await controller.exchangeMobileSession(body, mockRequest, mockResponse);

      expect(mobileAuthTokenStore.consumeToken).toHaveBeenCalledWith(
        'mobile-token-123',
      );
      expect(mockSessionStore.get).toHaveBeenCalledWith(
        'session-123',
        expect.any(Function),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'kini.sid',
        expect.stringContaining('s:'),
        expect.any(Object),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it('should reject invalid token', async () => {
      const body = { token: 'invalid-token' };

      mobileAuthTokenStore.consumeToken.mockReturnValue(null);

      await controller.exchangeMobileSession(body, mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token',
      });
    });

    it('should reject when session not found', async () => {
      const body = { token: 'mobile-token-123' };
      const tokenRecord = {
        sessionId: 'session-123',
        userId: 'user-123',
        expiresAt: Date.now() + 10000,
      };

      mobileAuthTokenStore.consumeToken.mockReturnValue(tokenRecord);
      mockSessionStore.get.mockImplementation((sid, cb) => cb(null, null));

      await controller.exchangeMobileSession(body, mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Session not found',
      });
    });

    it('should reject session mismatch', async () => {
      const body = { token: 'mobile-token-123' };
      const tokenRecord = {
        sessionId: 'session-123',
        userId: 'user-123',
        expiresAt: Date.now() + 10000,
      };
      const sessionData = {
        passport: { user: 'different-user' },
        cookie: {},
      } as any;

      mobileAuthTokenStore.consumeToken.mockReturnValue(tokenRecord);
      mockSessionStore.get.mockImplementation((sid, cb) =>
        cb(null, sessionData),
      );

      await controller.exchangeMobileSession(body, mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Session mismatch',
      });
    });
  });
});
