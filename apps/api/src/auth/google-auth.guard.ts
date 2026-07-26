import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.hasOAuthCredentials()) {
      const response = context
        .switchToHttp()
        .getResponse<Response | undefined>();

      if (response) {
        response.status(503).json({
          status: 503,
          code: 'AUTH.GOOGLE_UNAVAILABLE',
          message: 'Google OAuth is not configured',
        });
        return false;
      }

      throw new ServiceUnavailableException({
        code: 'AUTH.GOOGLE_UNAVAILABLE',
        message: 'Google OAuth is not configured',
      });
    }

    return (await super.canActivate(context)) as boolean;
  }

  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<
      Request & {
        session?: Record<string, unknown>;
      }
    >();

    const options =
      (super.getAuthenticateOptions(context) as Record<string, unknown>) ?? {};

    const redirectUri = this.extractStringParam(request.query?.redirect_uri);
    const failureRedirect = this.extractStringParam(
      request.query?.failure_redirect,
    );
    const prompt = this.extractStringParam(request.query?.prompt);
    const callbackURL =
      this.configService.get<string>('GOOGLE_CALLBACK_URL') ?? undefined;

    if (redirectUri && request.session) {
      (
        request.session as Session &
          SessionData & { oauthSuccessRedirect?: string }
      ).oauthSuccessRedirect = redirectUri;
    }

    if (failureRedirect && request.session) {
      (
        request.session as Session &
          SessionData & { oauthFailureRedirect?: string }
      ).oauthFailureRedirect = failureRedirect;
    }

    return {
      ...options,
      prompt,
      session: true,
      ...(callbackURL ? { callbackURL } : null),
    };
  }

  override handleRequest<TUser = unknown>(
    error: unknown,
    user: TUser | false | null,
  ): TUser | undefined {
    if (error) {
      throw error;
    }

    // OAuth denials and invalid/expired state arrive without a user. Let the
    // callback controller turn them into the configured frontend redirect
    // instead of exposing Nest's default JSON 401 response in the browser.
    return user || undefined;
  }

  private extractStringParam(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : undefined;
  }

  private hasOAuthCredentials(): boolean {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    return Boolean(clientId && clientSecret);
  }
}
