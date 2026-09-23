function apiOrigins(): string[] {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!base) return [];
  try {
    const { origin } = new URL(base);
    return [origin, origin.replace(/^http/, 'ws')];
  } catch {
    return [];
  }
}

export function contentSecurityPolicy(nonce: string): string {
  const connect = ["'self'", ...apiOrigins()].join(' ');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data:",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}'`,
    `connect-src ${connect}`,
    'report-uri /rum/csp',
  ].join('; ');
}
