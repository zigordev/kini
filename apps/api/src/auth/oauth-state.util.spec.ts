import {
  deserializeOAuthState,
  OAuthStatePayload,
  serializeOAuthState,
} from './oauth-state.util';

describe('OAuth State Utilities', () => {
  describe('serializeOAuthState', () => {
    it('should encode state payload', () => {
      const payload: OAuthStatePayload = {
        redirectUri: 'https://example.com/callback',
        failureRedirect: 'https://example.com/error',
      };

      const encoded = serializeOAuthState(payload);

      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should create URL-safe encoding', () => {
      const payload: OAuthStatePayload = {
        redirectUri: 'https://example.com/callback?param=value',
      };

      const encoded = serializeOAuthState(payload);

      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });

    it('should handle empty payload', () => {
      const payload: OAuthStatePayload = {};

      const encoded = serializeOAuthState(payload);

      expect(encoded).toBeTruthy();
    });

    it('should handle partial payload', () => {
      const payload1: OAuthStatePayload = {
        redirectUri: 'https://example.com',
      };
      const payload2: OAuthStatePayload = {
        failureRedirect: 'https://example.com/error',
      };

      const encoded1 = serializeOAuthState(payload1);
      const encoded2 = serializeOAuthState(payload2);

      expect(encoded1).toBeTruthy();
      expect(encoded2).toBeTruthy();
      expect(encoded1).not.toEqual(encoded2);
    });
  });

  describe('deserializeOAuthState', () => {
    it('should decode valid state', () => {
      const original: OAuthStatePayload = {
        redirectUri: 'https://example.com/callback',
        failureRedirect: 'https://example.com/error',
      };

      const encoded = serializeOAuthState(original);
      const decoded = deserializeOAuthState(encoded);

      expect(decoded).toEqual(original);
    });

    it('should return null for invalid input types', () => {
      expect(deserializeOAuthState(null)).toBeNull();
      expect(deserializeOAuthState(undefined)).toBeNull();
      expect(deserializeOAuthState(123 as any)).toBeNull();
      expect(deserializeOAuthState({} as any)).toBeNull();
      expect(deserializeOAuthState([] as any)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(deserializeOAuthState('')).toBeNull();
      expect(deserializeOAuthState('   ')).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      const malformed = Buffer.from('not-json', 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      expect(deserializeOAuthState(malformed)).toBeNull();
    });

    it('should return null for non-object JSON', () => {
      const arrayEncoded = Buffer.from('[]', 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const stringEncoded = Buffer.from('"string"', 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      expect(deserializeOAuthState(arrayEncoded)).toBeNull();
      expect(deserializeOAuthState(stringEncoded)).toBeNull();
    });

    it('should filter out empty strings in payload', () => {
      const payloadWithEmpty = {
        redirectUri: '  ',
        failureRedirect: '',
      };

      const encoded = Buffer.from(JSON.stringify(payloadWithEmpty), 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const decoded = deserializeOAuthState(encoded);

      expect(decoded).toBeNull(); // All fields filtered out
    });

    it('should trim whitespace from values', () => {
      const payloadWithWhitespace = {
        redirectUri: '  https://example.com  ',
        failureRedirect: '  https://error.com  ',
      };

      const encoded = Buffer.from(JSON.stringify(payloadWithWhitespace), 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const decoded = deserializeOAuthState(encoded);

      expect(decoded).toEqual({
        redirectUri: 'https://example.com',
        failureRedirect: 'https://error.com',
      });
    });

    it('should handle partial payloads', () => {
      const payload1: OAuthStatePayload = {
        redirectUri: 'https://example.com',
      };
      const encoded1 = serializeOAuthState(payload1);
      const decoded1 = deserializeOAuthState(encoded1);

      expect(decoded1).toEqual({ redirectUri: 'https://example.com' });

      const payload2: OAuthStatePayload = {
        failureRedirect: 'https://error.com',
      };
      const encoded2 = serializeOAuthState(payload2);
      const decoded2 = deserializeOAuthState(encoded2);

      expect(decoded2).toEqual({ failureRedirect: 'https://error.com' });
    });

    it('should handle base64url padding correctly', () => {
      // Test different padding scenarios
      const payloads = [
        { redirectUri: 'a' }, // Requires == padding
        { redirectUri: 'ab' }, // Requires = padding
        { redirectUri: 'abc' }, // Requires no padding
        { redirectUri: 'abcd' }, // Requires no padding
      ];

      payloads.forEach((payload) => {
        const encoded = serializeOAuthState(payload);
        const decoded = deserializeOAuthState(encoded);
        expect(decoded).toEqual(payload);
      });
    });
  });

  describe('round-trip encoding', () => {
    it('should maintain data integrity through encode/decode cycle', () => {
      const testCases: OAuthStatePayload[] = [
        { redirectUri: 'https://example.com/callback' },
        { failureRedirect: 'https://example.com/error' },
        {
          redirectUri: 'https://example.com/callback',
          failureRedirect: 'https://example.com/error',
        },
        {
          redirectUri:
            'https://example.com/callback?param1=value1&param2=value2',
        },
      ];

      testCases.forEach((payload) => {
        const encoded = serializeOAuthState(payload);
        const decoded = deserializeOAuthState(encoded);
        expect(decoded).toEqual(payload);
      });
    });
  });
});
