import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import * as signature from 'cookie-signature';
import type { CookieOptions } from 'express';
import { Request, Response } from 'express';
import { Session, SessionData, Store } from 'express-session';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import { MobileSessionDto } from './dto/mobile-session.dto';
import { GoogleAuthGuard } from './google-auth.guard';
import { MobileAuthTokenStore } from './mobile-auth-token.store';
import { deserializeOAuthState } from './oauth-state.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly mobileAuthTokenStore: MobileAuthTokenStore,
  ) {}

  @Get('google/config')
  @ApiOkResponse({
    description: 'Returns public Google OAuth configuration',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        scopes: {
          type: 'array',
          items: { type: 'string' },
        },
        mobileRedirectUri: { type: 'string' },
        enabled: { type: 'boolean' },
      },
    },
  })
  googleConfig() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    return {
      clientId,
      scopes: ['profile', 'email'],
      mobileRedirectUri: this.configService.get<string>(
        'GOOGLE_MOBILE_REDIRECT_URI',
      ),
      enabled: Boolean(clientId && clientSecret),
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin(): Promise<void> {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user as User | undefined;
    const session = req.session as
      | (Session &
          SessionData & {
            oauthSuccessRedirect?: string;
            oauthFailureRedirect?: string;
          })
      | null;
    const oauthState = deserializeOAuthState(
      this.extractQueryParam(req.query?.state),
    );

    if (!user) {
      const failureOverride =
        oauthState?.failureRedirect ?? session?.oauthFailureRedirect ?? null;
      if (session) {
        delete session.oauthSuccessRedirect;
        delete session.oauthFailureRedirect;
      }
      res.redirect(
        this.authService.getFailureRedirectUrl('missing_user', failureOverride),
      );
      return;
    }

    const successOverride =
      oauthState?.redirectUri ?? session?.oauthSuccessRedirect ?? null;
    const mobileToken = this.mobileAuthTokenStore.createToken(
      req.sessionID,
      user.id,
    );

    if (session) {
      delete session.oauthSuccessRedirect;
      delete session.oauthFailureRedirect;
    }
    const successUrl = this.authService.getSuccessRedirectUrl(
      user,
      successOverride,
      mobileToken ? { mobile_token: mobileToken } : undefined,
    );

    res.redirect(successUrl);
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({
    description: 'Returns session user',
    type: UserResponseDto,
  })
  me(@Req() req: Request): UserResponseDto {
    return this.authService.sanitizeUser(req.user as User);
  }

  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const cookieName = this.configService.get<string>(
      'SESSION_COOKIE_NAME',
      'kini.sid',
    );

    await new Promise<void>((resolve, reject) =>
      (
        req as Request & {
          logout: (callback: (error?: Error | null) => void) => void;
        }
      ).logout((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }),
    );

    req.session?.destroy(() => undefined);
    res.clearCookie(cookieName, { path: '/' });
    res.status(204).send();
  }

  @Post('mobile/session')
  async exchangeMobileSession(
    @Body() body: MobileSessionDto,
    @Req()
    req: Request & {
      sessionStore?: Store;
    },
    @Res() res: Response,
  ): Promise<void> {
    const record = this.mobileAuthTokenStore.consumeToken(body.token);

    if (!record) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    const sessionStore = (req.sessionStore ??
      (req.session as Session & { store?: Store })?.store) as Store | undefined;

    if (!sessionStore) {
      res.status(500).json({ message: 'Session store unavailable' });
      return;
    }

    const sessionData = await this.getSessionData(
      sessionStore,
      record.sessionId,
    );

    if (!sessionData) {
      res.status(400).json({ message: 'Session not found' });
      return;
    }

    const passportUserId = (
      sessionData as Session & SessionData & { passport?: { user?: string } }
    ).passport?.user;
    if (passportUserId !== record.userId) {
      res.status(400).json({ message: 'Session mismatch' });
      return;
    }

    await this.touchSession(sessionStore, record.sessionId, sessionData);

    const cookieName = this.configService.get<string>(
      'SESSION_COOKIE_NAME',
      'kini.sid',
    );
    const cookieOptions = this.buildSessionCookieOptions(sessionData);
    const cookieValue = this.signSessionId(record.sessionId);

    if (!cookieValue) {
      res.status(500).json({ message: 'Unable to sign session cookie' });
      return;
    }

    res.cookie(cookieName, cookieValue, cookieOptions);

    res.status(204).send();
  }

  private extractQueryParam(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    if (Array.isArray(value)) {
      const first = value.find(
        (item) => typeof item === 'string' && item.trim().length > 0,
      );
      return typeof first === 'string' ? first.trim() : undefined;
    }

    return undefined;
  }

  private async getSessionData(
    store: Store,
    sessionId: string,
  ): Promise<(Session & SessionData) | null> {
    return new Promise((resolve, reject) => {
      store.get(sessionId, (error, session) => {
        if (error) {
          reject(error);
          return;
        }

        resolve((session as Session & SessionData) ?? null);
      });
    });
  }

  private async touchSession(
    store: Store,
    sessionId: string,
    sessionData: Session & SessionData,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (typeof store.touch === 'function') {
        store.touch(sessionId, sessionData, (error?: unknown) => {
          if (error) {
            reject(error as Error);
          } else {
            resolve();
          }
        });
        return;
      }

      store.set(sessionId, sessionData, (error?: unknown) => {
        if (error) {
          reject(error as Error);
        } else {
          resolve();
        }
      });
    });
  }

  private buildSessionCookieOptions(
    sessionData: Session & SessionData,
  ): CookieOptions {
    const baseCookie = sessionData.cookie;

    return {
      httpOnly: baseCookie.httpOnly,
      path: baseCookie.path,
      maxAge: baseCookie.maxAge ?? undefined,
      sameSite: this.normalizeSameSite(baseCookie.sameSite),
      secure: this.normalizeSecure(baseCookie.secure),
      domain: baseCookie.domain,
    };
  }

  private signSessionId(sessionId: string | undefined): string | null {
    if (!sessionId) {
      return null;
    }

    const cookieSecret = this.normalizeSecret(
      this.configService.get<string>('SESSION_COOKIE_SECRET'),
    );
    const sessionSecret = this.normalizeSecret(
      this.configService.get<string>('SESSION_SECRET'),
    );

    const secret = cookieSecret ?? sessionSecret;

    if (!secret) {
      return null;
    }

    return `s:${signature.sign(sessionId, secret)}`;
  }

  private normalizeSecret(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeSecure(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value === 'true';
    }

    return false;
  }

  private normalizeSameSite(value: unknown): CookieOptions['sameSite'] {
    if (typeof value === 'string') {
      if (value === 'strict' || value === 'lax' || value === 'none') {
        return value;
      }
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return 'lax';
  }
}
