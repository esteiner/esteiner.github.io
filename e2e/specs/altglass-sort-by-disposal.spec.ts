import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

/**
 * Altglass lists the most recently drunk wines first: disposing a bottle moves
 * its product's row to the top of Altglass, and the order survives a reload.
 * Rows are read at run time, not assumed from the seed.
 */
async function openCellar(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name, exact: true }).click();
  await page.waitForURL(/\/cellar\//);
  await expect(page.locator('li .bottle-button').first()).toBeVisible({ timeout: 30_000 });
}

async function rowNames(page: Page): Promise<string[]> {
  return page.locator('li').evaluateAll((lis) =>
    lis.map((li) => li.querySelector('bottle-component')?.shadowRoot?.querySelector('.product-name')?.textContent?.trim() ?? ''),
  );
}

test.describe('Altglass sorted by disposal date', () => {
  test('a freshly drunk bottle puts its product on top of Altglass', async ({ authedPage: page }) => {
    await openCellar(page, 'Altglass');
    const topBefore = (await rowNames(page))[0];

    // Pick a Hütte wine with a unique name that is not already on top of Altglass.
    await page.goto('/');
    await openCellar(page, 'Hütte');
    const names = await rowNames(page);
    const product = names.find((n) => n && n !== topBefore && names.filter((o) => o === n).length === 1);
    expect(product, 'a uniquely named Hütte wine not on top of Altglass').toBeDefined();
    console.log('drinking:', JSON.stringify(product), '| Altglass top before:', JSON.stringify(topBefore));

    const row = page.locator('li').filter({ has: page.getByText(product!, { exact: true }) });
    await row.locator('.bottle-button').click();
    await expect(page.locator('.rating-product')).toHaveText(product!);
    await page.locator('.rating-action.confirm').click();
    await expect(page.locator('.rating-product')).toHaveCount(0);

    await page.goto('/');
    await openCellar(page, 'Altglass');
    await expect.poll(async () => (await rowNames(page))[0]).toBe(product);

    // Persisted: still on top after a reload (the login redirect lands on "/").
    await page.reload();
    await openCellar(page, 'Altglass');
    await expect.poll(async () => (await rowNames(page))[0]).toBe(product);
  });
});
