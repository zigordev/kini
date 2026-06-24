import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile } from 'passport-google-oauth20';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async validateGoogleProfile(profile: Profile): Promise<User> {
    const primaryEmail = profile.emails?.[0]?.value;

    if (!primaryEmail) {
      throw new UnauthorizedException('Google account does not expose email');
    }

    return this.usersService.findOrCreateGoogleUser({
      googleId: profile.id,
      email: primaryEmail,
      displayName: profile.displayName ?? primaryEmail,
      avatarUrl: profile.photos?.[0]?.value,
      givenName: profile.name?.givenName,
      familyName: profile.name?.familyName,
    });
  }

  sanitizeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      givenName: user.givenName ?? null,
      familyName: user.familyName ?? null,
      textColor: user.textColor,
      backgroundColor: user.backgroundColor,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  getSuccessRedirectUrl(
    user: User,
    overrideUrl?: string | null,
    additionalParams?: Record<string, string | undefined>,
  ): string {
    const fallbackRedirect = this.configService.get<string>(
      'AUTH_SUCCESS_REDIRECT_URL',
    );

    const redirectTarget = overrideUrl ?? fallbackRedirect;
    const url = this.safeCreateUrl(redirectTarget, fallbackRedirect);
    url.searchParams.set('userId', user.id);
    this.appendAdditionalParams(url, additionalParams);

    return url.toString();
  }

  getFailureRedirectUrl(
    errorCode = 'auth_failed',
    overrideUrl?: string | null,
    additionalParams?: Record<string, string | undefined>,
  ): string {
    const fallbackRedirect = this.configService.get<string>(
      'AUTH_FAILURE_REDIRECT_URL',
    );

    const redirectTarget = overrideUrl ?? fallbackRedirect;
    const url = this.safeCreateUrl(redirectTarget, fallbackRedirect);
    url.searchParams.set('error', errorCode);
    this.appendAdditionalParams(url, additionalParams);

    return url.toString();
  }

  private safeCreateUrl(targetUrl: string, fallbackUrl: string): URL {
    try {
      return new URL(targetUrl);
    } catch {
      return new URL(fallbackUrl);
    }
  }

  private appendAdditionalParams(
    url: URL,
    params?: Record<string, string | undefined>,
  ): void {
    if (!params) {
      return;
    }

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        url.searchParams.set(key, value.trim());
      }
    }
  }
}
