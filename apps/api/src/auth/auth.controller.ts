import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import { GoogleAuthGuard } from './google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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
    if (!user) {
      const failureOverride = session?.oauthFailureRedirect ?? null;
      if (session) {
        delete session.oauthSuccessRedirect;
        delete session.oauthFailureRedirect;
      }
      res.redirect(
        this.authService.getFailureRedirectUrl('missing_user', failureOverride),
      );
      return;
    }

    const successOverride = session?.oauthSuccessRedirect ?? null;

    if (session) {
      delete session.oauthSuccessRedirect;
      delete session.oauthFailureRedirect;
    }
    const successUrl = this.authService.getSuccessRedirectUrl(
      user,
      successOverride,
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
}
