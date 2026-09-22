import { expect, test, type Page } from '@playwright/test';

type Violation = { directive: string; blocked: string };

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: { directive: string; blocked: string }[] = [];
    Object.assign(window, { __violations: seen });
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
    });
  });
}

const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __violations: Violation[] }).__violations);

test('the pools page opens its socket to the API within its own policy', async ({ page }) => {
  await recordViolations(page);
  const socket = page.waitForEvent('websocket');
  await page.goto('/pools');
  expect(new URL((await socket).url()).pathname).toBe('/socket.io/');
  await page.waitForLoadState('networkidle');
  expect(await violations(page)).toEqual([]);
});

for (const path of ['/available-pools', '/create-pool', '/teams', '/stats', '/profile']) {
  test(`${path} breaks none of its own content security policy`, async ({ page }) => {
    await recordViolations(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await violations(page)).toEqual([]);
  });
}
