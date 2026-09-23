import { expect, test } from '@playwright/test';
import { io } from 'socket.io-client';

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3012';

const connect = (extraHeaders: Record<string, string> = {}) =>
  new Promise<string>((resolve) => {
    const socket = io(apiBaseUrl, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 10_000,
      extraHeaders,
    });
    socket.on('connect', () => {
      socket.close();
      resolve('connected');
    });
    socket.on('connect_error', (error: Error) => {
      socket.close();
      resolve(error.message);
    });
  });

test.describe('live-update socket, signed out', () => {
  test('is refused without a session', async () => {
    expect(await connect()).toBe('unauthorized');
  });

  test('is refused from a foreign origin', async () => {
    expect(await connect({ origin: 'https://evil.example' })).not.toBe('connected');
  });
});
