import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('signed-out visitor', () => {
  test('is shown the sign-in card rather than a blank document or a loading spinner', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('button').first()).toBeVisible();
  });

  test('sees no WCAG A or AA violations on the sign-in card', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)).toEqual([]);
  });

  test('gets the sign-in card on a protected route too, never the page behind it', async ({ page }) => {
    await page.goto('/pools');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('button').first()).toBeVisible();
    await expect(page.getByRole('searchbox').or(page.getByRole('table'))).toHaveCount(0);
  });
});
