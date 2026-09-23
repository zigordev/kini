import { expect, test } from '@playwright/test';

test.describe('live-update socket, signed in', () => {
  test('the pools page connects with the session the browser carries', async ({ page }) => {
    const apiHost = new URL(process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3012').host;
    const replies: string[] = [];
    page.on('websocket', (socket) => {
      if (!socket.url().includes(apiHost)) return;
      socket.on('framereceived', (frame) => replies.push(String(frame.payload)));
    });

    await page.goto('/pools');

    await expect
      .poll(() => replies.find((reply) => reply.startsWith('40') || reply.startsWith('44')), {
        timeout: 15_000,
      })
      .toMatch(/^40/);
  });
});
