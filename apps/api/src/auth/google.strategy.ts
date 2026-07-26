import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly isConfigured: boolean;
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    const configured = Boolean(clientID && clientSecret);

    super({
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
      passReqToCallback: true,
      state: true,
    });

    this.isConfigured = configured;
  }

  authenticate(req: Request, options?: Record<string, unknown>): void {
    if (!this.isConfigured) {
      this.fail('Google OAuth is not configured', 500);
      return;
    }

    super.authenticate(req, options);
  }

  async validate(
    request: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    if (!this.isConfigured) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    const user = await this.authService.validateGoogleProfile(profile);

    await new Promise<void>((resolve, reject) =>
      request.logIn(user, (error) => {
        if (error) {
          this.logger.error('[GoogleStrategy] request.logIn failed', error);
          reject(error);
        } else {
          resolve();
        }
      }),
    );

    return user;
  }
}
