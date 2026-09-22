import { afterEach, describe, expect, it } from 'vitest';

import { contentSecurityPolicy } from './csp';

describe('contentSecurityPolicy', () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = base;
  });

  it('vouches for scripts carrying the nonce and reports everything else', () => {
    const policy = contentSecurityPolicy('bm9uY2U=');

    expect(policy).toContain("script-src 'self' 'nonce-bm9uY2U='");
    expect(policy).toContain('report-uri /rum/csp');
  });

  it('lets the page call the API and open its socket on the API origin', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://kini-api.zigordev.com/';

    expect(contentSecurityPolicy('n')).toContain(
      "connect-src 'self' https://kini-api.zigordev.com wss://kini-api.zigordev.com"
    );
  });

  it('uses the plain socket scheme for a plain API address', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3012';

    expect(contentSecurityPolicy('n')).toContain(
      "connect-src 'self' http://localhost:3012 ws://localhost:3012"
    );
  });

  it('allows only its own origin when the API address is missing or unreadable', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'not a url';

    expect(contentSecurityPolicy('n')).toContain("connect-src 'self';");
  });
});
