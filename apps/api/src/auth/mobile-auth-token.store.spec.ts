import { MobileAuthTokenStore } from './mobile-auth-token.store';

describe('MobileAuthTokenStore', () => {
  let store: MobileAuthTokenStore;

  beforeEach(() => {
    store = new MobileAuthTokenStore();
  });

  it('should be defined', () => {
    expect(store).toBeDefined();
  });

  describe('createToken', () => {
    it('should create token with expiry', () => {
      const token = store.createToken('session-123', 'user-456');

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should return null for undefined sessionId', () => {
      const token = store.createToken(undefined, 'user-456');

      expect(token).toBeNull();
    });

    it('should return null for undefined userId', () => {
      const token = store.createToken('session-123', undefined);

      expect(token).toBeNull();
    });

    it('should return null for empty sessionId', () => {
      const token = store.createToken('', 'user-456');

      expect(token).toBeNull();
    });

    it('should return null for empty userId', () => {
      const token = store.createToken('session-123', '');

      expect(token).toBeNull();
    });

    it('should generate unique tokens', () => {
      const token1 = store.createToken('session-123', 'user-456');
      const token2 = store.createToken('session-123', 'user-456');

      expect(token1).not.toEqual(token2);
    });

    it('should create URL-safe tokens', () => {
      const token = store.createToken('session-123', 'user-456');

      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    });
  });

  describe('consumeToken', () => {
    it('should consume valid token once', () => {
      const token = store.createToken('session-123', 'user-456');

      const record = store.consumeToken(token!);

      expect(record).toBeTruthy();
      expect(record?.sessionId).toBe('session-123');
      expect(record?.userId).toBe('user-456');

      // Second consumption should fail
      const secondRecord = store.consumeToken(token!);
      expect(secondRecord).toBeNull();
    });

    it('should return null for invalid token', () => {
      const record = store.consumeToken('invalid-token');

      expect(record).toBeNull();
    });

    it('should return null for empty token', () => {
      const record = store.consumeToken('');

      expect(record).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Create a token with very short TTL
      const token = store.createToken('session-123', 'user-456');

      // Wait for token to expire (5 minutes + buffer)
      jest.useFakeTimers();
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

      const record = store.consumeToken(token!);

      expect(record).toBeNull();

      jest.useRealTimers();
    });

    it('should purge expired tokens on consume', () => {
      jest.useFakeTimers();

      const token1 = store.createToken('session-1', 'user-1');

      // Advance time to expire first token
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

      const token2 = store.createToken('session-2', 'user-2');

      // Consuming token2 should purge token1
      const record2 = store.consumeToken(token2!);
      expect(record2).toBeTruthy();

      // token1 should be purged
      const record1 = store.consumeToken(token1!);
      expect(record1).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('token expiry', () => {
    it('should store token with correct expiry time', () => {
      jest.useFakeTimers();

      const token = store.createToken('session-123', 'user-456');

      // Token should be valid before expiry
      jest.advanceTimersByTime(4 * 60 * 1000); // 4 minutes
      const record1 = store.consumeToken(token!);
      expect(record1).toBeTruthy();

      // Create new token
      const token2 = store.createToken('session-123', 'user-456');

      // Token should be invalid after expiry
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 more minutes (10 total)
      const record2 = store.consumeToken(token2!);
      expect(record2).toBeNull();

      jest.useRealTimers();
    });
  });
});
