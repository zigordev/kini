import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';

import { OAuthStatePayload, serializeOAuthState } from './oauth-state.util';

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
    const callbackURL = this.resolveCallbackUrl(request);

    const statePayload: OAuthStatePayload = {};

    if (redirectUri && request.session) {
      (
        request.session as Session &
          SessionData & { oauthSuccessRedirect?: string }
      ).oauthSuccessRedirect = redirectUri;
      statePayload.redirectUri = redirectUri;
    }

    if (failureRedirect && request.session) {
      (
        request.session as Session &
          SessionData & { oauthFailureRedirect?: string }
      ).oauthFailureRedirect = failureRedirect;
      statePayload.failureRedirect = failureRedirect;
    }

    const state =
      Object.keys(statePayload).length > 0
        ? serializeOAuthState(statePayload)
        : undefined;

    return {
      ...options,
      prompt,
      session: true,
      ...(callbackURL ? { callbackURL } : null),
      ...(state ? { state } : null),
    };
  }

  private extractStringParam(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : undefined;
  }

  private resolveCallbackUrl(request: Request): string | undefined {
    const callbackUr = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    const hostHeader = this.extractStringParam(request.headers?.host);
    if (!hostHeader) {
      return callbackUr;
    }

    let callbackPath = '/auth/google/callback';
    try {
      callbackPath = new URL(callbackUr).pathname || callbackPath;
    } catch {
      callbackPath = '/auth/google/callback';
    }

    const protocol = this.resolveRequestProtocol(request) ?? 'http';

    return `${protocol}://${hostHeader}${callbackPath}`;
  }

  private resolveRequestProtocol(request: Request): string | undefined {
    const forwardedHeader = request.headers?.['x-forwarded-proto'];

    if (
      typeof forwardedHeader === 'string' &&
      forwardedHeader.trim().length > 0
    ) {
      return forwardedHeader.split(',')[0]?.trim();
    }

    if (Array.isArray(forwardedHeader)) {
      const first = forwardedHeader.find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      );
      if (first) {
        return first.trim();
      }
    }

    if (typeof request.protocol === 'string' && request.protocol.length > 0) {
      return request.protocol;
    }

    if (typeof request.secure === 'boolean') {
      return request.secure ? 'https' : 'http';
    }

    return undefined;
  }

  private hasOAuthCredentials(): boolean {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    return Boolean(clientId && clientSecret);
  }
}
