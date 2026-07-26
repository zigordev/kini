import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Profile } from 'passport-google-oauth20';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-123',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: {
            validateGoogleProfile: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                GOOGLE_CLIENT_ID: 'test-client-id',
                GOOGLE_CLIENT_SECRET: 'test-client-secret',
                GOOGLE_CALLBACK_URL:
                  'http://localhost:3012/auth/google/callback',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should use a session-bound OAuth state store', async () => {
    const stateStore = (
      strategy as unknown as {
        _stateStore: {
          store: (
            request: Request,
            callback: (error: Error | null, state?: string) => void,
          ) => void;
          verify: (
            request: Request,
            state: string,
            callback: (
              error: Error | null,
              verified: boolean,
              info?: { message?: string },
            ) => void,
          ) => void;
        };
      }
    )._stateStore;
    const request = { session: {} } as Request;
    const state = await new Promise<string>((resolve, reject) => {
      stateStore.store(request, (error, storedState) => {
        if (error || !storedState) {
          reject(error ?? new Error('OAuth state was not generated'));
          return;
        }
        resolve(storedState);
      });
    });

    await expect(
      new Promise<boolean>((resolve, reject) => {
        stateStore.verify(request, `${state}-mismatch`, (error, verified) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(verified);
        });
      }),
    ).resolves.toBe(false);
  });

  describe('authenticate', () => {
    it('should fail when OAuth is not configured', () => {
      const mockRequest = {} as Request;
      const failSpy = jest.fn();
      (strategy as any).fail = failSpy;

      // Temporarily override isConfigured
      (strategy as any).isConfigured = false;

      strategy.authenticate(mockRequest);

      expect(failSpy).toHaveBeenCalledWith(
        'Google OAuth is not configured',
        500,
      );
    });
  });

  describe('validate', () => {
    const mockProfile: Profile = {
      id: 'google-123',
      displayName: 'Test User',
      emails: [{ value: 'test@example.com', verified: true }],
      provider: 'google',
    } as Profile;

    let mockRequest: Request;

    beforeEach(() => {
      mockRequest = {
        logIn: jest.fn((user, callback) => callback()),
      } as any;
    });

    it('should validate profile and login user', async () => {
      authService.validateGoogleProfile.mockResolvedValue(mockUser);

      const result = await strategy.validate(
        mockRequest,
        'access-token',
        'refresh-token',
        mockProfile,
      );

      expect(result).toEqual(mockUser);
      expect(authService.validateGoogleProfile).toHaveBeenCalledWith(
        mockProfile,
      );
      expect(mockRequest.logIn).toHaveBeenCalledWith(
        mockUser,
        expect.any(Function),
      );
    });

    it('should throw when not configured', async () => {
      // Temporarily override isConfigured
      (strategy as any).isConfigured = false;

      await expect(
        strategy.validate(
          mockRequest,
          'access-token',
          'refresh-token',
          mockProfile,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle logIn errors', async () => {
      authService.validateGoogleProfile.mockResolvedValue(mockUser);

      const loginError = new Error('Login failed');
      mockRequest.logIn = jest.fn((user: any, callback: any) => {
        if (typeof callback === 'function') {
          callback(loginError);
        }
      }) as any;

      await expect(
        strategy.validate(
          mockRequest,
          'access-token',
          'refresh-token',
          mockProfile,
        ),
      ).rejects.toThrow(loginError);
    });
  });
});
