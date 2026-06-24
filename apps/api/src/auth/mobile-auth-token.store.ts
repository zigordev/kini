import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface TokenRecord {
  sessionId: string;
  userId: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60_000;

@Injectable()
export class MobileAuthTokenStore {
  private readonly tokens = new Map<string, TokenRecord>();
  private readonly ttlMs: number;
  private readonly logger = new Logger(MobileAuthTokenStore.name);

  constructor() {
    this.ttlMs = DEFAULT_TTL_MS;
  }

  createToken(
    sessionId: string | undefined,
    userId: string | undefined,
  ): string | null {
    if (!sessionId || !userId) {
      return null;
    }

    this.purgeExpired();
    const token = this.generateToken();
    this.tokens.set(token, {
      sessionId,
      userId,
      expiresAt: Date.now() + this.ttlMs,
    });

    return token;
  }

  consumeToken(token: string): TokenRecord | null {
    if (!token) {
      return null;
    }

    this.purgeExpired();

    const record = this.tokens.get(token);
    if (!record) {
      return null;
    }

    this.tokens.delete(token);

    if (record.expiresAt < Date.now()) {
      return null;
    }

    return record;
  }

  private purgeExpired(): void {
    const now = Date.now();

    for (const [token, record] of this.tokens.entries()) {
      if (record.expiresAt < now) {
        this.tokens.delete(token);
      }
    }
  }

  private generateToken(): string {
    return randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
