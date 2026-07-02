import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Profile } from 'passport-google-oauth20';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-123',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    givenName: 'Test',
    familyName: 'User',
    textColor: '#000000',
    backgroundColor: '#FFFFFF',
    notificationsEnabled: true,
    language: 'en',
    theme: 'light',
    activeTeamId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOrCreateGoogleUser: jest.fn(),
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

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateGoogleProfile', () => {
    it('should validate and create user from Google profile', async () => {
      const profile: Profile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com', verified: true }],
        photos: [{ value: 'https://example.com/avatar.jpg' }],
        name: { givenName: 'Test', familyName: 'User' },
        provider: 'google',
      } as Profile;

      usersService.findOrCreateGoogleUser.mockResolvedValue(mockUser);

      const result = await service.validateGoogleProfile(profile);

      expect(result).toEqual(mockUser);
      expect(usersService.findOrCreateGoogleUser).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        givenName: 'Test',
        familyName: 'User',
      });
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      const profile: Profile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [],
        provider: 'google',
      } as Profile;

      await expect(service.validateGoogleProfile(profile)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateGoogleProfile(profile)).rejects.toThrow(
        'Google account does not expose email',
      );
    });

    it('should handle profile with missing optional fields', async () => {
      const profile: Profile = {
        id: 'google-123',
        displayName: null,
        emails: [{ value: 'test@example.com', verified: true }],
        provider: 'google',
      } as Profile;

      usersService.findOrCreateGoogleUser.mockResolvedValue(mockUser);

      await service.validateGoogleProfile(profile);

      expect(usersService.findOrCreateGoogleUser).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'test@example.com',
        displayName: 'test@example.com',
        avatarUrl: undefined,
        givenName: undefined,
        familyName: undefined,
      });
    });
  });

  describe('sanitizeUser', () => {
    it('should properly sanitize user data', () => {
      const result = service.sanitizeUser(mockUser);

      expect(result).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        givenName: 'Test',
        familyName: 'User',
        textColor: '#000000',
        backgroundColor: '#FFFFFF',
        language: 'en',
        theme: 'light',
        activeTeamId: null,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should convert null values properly', () => {
      const userWithNulls = {
        ...mockUser,
        avatarUrl: null,
        givenName: null,
        familyName: null,
      };
      const result = service.sanitizeUser(userWithNulls);

      expect(result.avatarUrl).toBeNull();
      expect(result.givenName).toBeNull();
      expect(result.familyName).toBeNull();
    });
  });

  describe('getSuccessRedirectUrl', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('https://default.example.com/success');
    });

    it('should build success redirect URL with user ID', () => {
      const result = service.getSuccessRedirectUrl(mockUser);

      expect(result).toContain('https://default.example.com/success');
      expect(result).toContain('userId=user-123');
    });

    it('should handle override URL', () => {
      const result = service.getSuccessRedirectUrl(
        mockUser,
        'https://custom.example.com/auth',
      );

      expect(result).toContain('https://custom.example.com/auth');
      expect(result).toContain('userId=user-123');
    });

    it('should append additional params', () => {
      const result = service.getSuccessRedirectUrl(mockUser, null, {
        mobile_token: 'token-123',
        session_id: 'session-456',
      });

      expect(result).toContain('userId=user-123');
      expect(result).toContain('mobile_token=token-123');
      expect(result).toContain('session_id=session-456');
    });

    it('should skip empty additional params', () => {
      const result = service.getSuccessRedirectUrl(mockUser, null, {
        valid: 'value',
        empty: '',
        whitespace: '  ',
        undefined: undefined,
      });

      expect(result).toContain('valid=value');
      expect(result).not.toContain('empty=');
      expect(result).not.toContain('whitespace=');
      expect(result).not.toContain('undefined=');
    });

    it('should fallback to default URL on invalid override', () => {
      const result = service.getSuccessRedirectUrl(mockUser, 'not-a-valid-url');

      expect(result).toContain('https://default.example.com/success');
      expect(result).toContain('userId=user-123');
    });
  });

  describe('getFailureRedirectUrl', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('https://default.example.com/failure');
    });

    it('should build failure redirect URL with error code', () => {
      const result = service.getFailureRedirectUrl('auth_failed');

      expect(result).toContain('https://default.example.com/failure');
      expect(result).toContain('error=auth_failed');
    });

    it('should handle override URL', () => {
      const result = service.getFailureRedirectUrl(
        'custom_error',
        'https://custom.example.com/error',
      );

      expect(result).toContain('https://custom.example.com/error');
      expect(result).toContain('error=custom_error');
    });

    it('should append additional params', () => {
      const result = service.getFailureRedirectUrl('auth_failed', null, {
        reason: 'invalid_credentials',
      });

      expect(result).toContain('error=auth_failed');
      expect(result).toContain('reason=invalid_credentials');
    });

    it('should use default error code when not provided', () => {
      const result = service.getFailureRedirectUrl();

      expect(result).toContain('error=auth_failed');
    });

    it('should fallback to default URL on invalid override', () => {
      const result = service.getFailureRedirectUrl('error', 'invalid-url');

      expect(result).toContain('https://default.example.com/failure');
      expect(result).toContain('error=error');
    });
  });
});
