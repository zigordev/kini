export interface OAuthStatePayload {
  redirectUri?: string;
  failureRedirect?: string;
}

export const serializeOAuthState = (payload: OAuthStatePayload): string => {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const deserializeOAuthState = (
  encoded: unknown,
): OAuthStatePayload | null => {
  if (typeof encoded !== 'string' || encoded.trim().length === 0) {
    return null;
  }

  try {
    const normalized = padBase64Url(encoded.trim())
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const json = Buffer.from(normalized, 'base64').toString('utf8');
    const payload = JSON.parse(json) as OAuthStatePayload;

    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const result: OAuthStatePayload = {};

    if (
      typeof payload.redirectUri === 'string' &&
      payload.redirectUri.trim().length > 0
    ) {
      result.redirectUri = payload.redirectUri.trim();
    }

    if (
      typeof payload.failureRedirect === 'string' &&
      payload.failureRedirect.trim().length > 0
    ) {
      result.failureRedirect = payload.failureRedirect.trim();
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
};

const padBase64Url = (value: string): string => {
  const mod = value.length % 4;

  if (mod === 2) {
    return `${value}==`;
  }
  if (mod === 3) {
    return `${value}=`;
  }
  if (mod === 0) {
    return value;
  }

  return `${value}===`;
};
