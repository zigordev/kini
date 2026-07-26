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
      theme: user.theme,
      activeTeamId: user.activeTeamId,
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

    const url = this.createAllowedRedirectUrl(overrideUrl, fallbackRedirect);
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

    const url = this.createAllowedRedirectUrl(overrideUrl, fallbackRedirect);
    url.searchParams.set('error', errorCode);
    this.appendAdditionalParams(url, additionalParams);

    return url.toString();
  }

  private createAllowedRedirectUrl(
    overrideUrl: string | null | undefined,
    fallbackUrl: string,
  ): URL {
    const fallback = this.parseHttpUrl(fallbackUrl);
    if (!fallback) {
      throw new Error('Configured auth redirect URL must be a valid HTTP URL');
    }

    const candidate = this.parseRedirectOverride(overrideUrl, fallback);
    if (!candidate) {
      return fallback;
    }

    const allowedOrigins = this.configuredRedirectOrigins(fallback.origin);
    return allowedOrigins.has(candidate.origin) ? candidate : fallback;
  }

  private parseRedirectOverride(
    value: string | null | undefined,
    fallback: URL,
  ): URL | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const url =
        trimmed.startsWith('/') && !trimmed.startsWith('//')
          ? new URL(trimmed, fallback)
          : new URL(trimmed);

      return this.isSafeHttpUrl(url) ? url : null;
    } catch {
      return null;
    }
  }

  private configuredRedirectOrigins(fallbackOrigin: string): Set<string> {
    const origins = new Set<string>([fallbackOrigin]);
    const configuredValues = [
      this.configService.get<string>('AUTH_SUCCESS_REDIRECT_URL'),
      this.configService.get<string>('AUTH_FAILURE_REDIRECT_URL'),
      ...(this.configService.get<string>('AUTH_CORS_ORIGINS', '') ?? '').split(
        ',',
      ),
    ];

    for (const configuredValue of configuredValues) {
      const url = this.parseHttpUrl(configuredValue);
      if (url) {
        origins.add(url.origin);
      }
    }

    return origins;
  }

  private parseHttpUrl(value: string | null | undefined): URL | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const url = new URL(trimmed);
      return this.isSafeHttpUrl(url) ? url : null;
    } catch {
      return null;
    }
  }

  private isSafeHttpUrl(url: URL): boolean {
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.username.length === 0 &&
      url.password.length === 0
    );
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
