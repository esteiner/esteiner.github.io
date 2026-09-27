import { test, expect } from '../fixtures/auth';
import type { Page } from '@playwright/test';

/**
 * Drives the real UI end-to-end for the bottle-rating fix: a rating chosen when
 * disposing a bottle must appear on the product's rating list. Works only
 * because SoukaiBottleRepository.fetchBottles joins product→bottles in memory so
 * product.getRatings() aggregates the ratings stored on bottles.
 *
 * The wine is picked at run time — any Hütte row with at least two bottles (so a
 * sibling of the same product resource remains after we dispose one) and a name
 * no other row shares — so the test doesn't depend on the seed's exact contents.
 */
async function pickRowWithSiblings(page: Page): Promise<{ name: string; count: number }> {
  await expect(page.locator('li .bottle-button').first()).toBeVisible({ timeout: 30_000 });
  const rows = await page.locator('li').evaluateAll((lis) =>
    lis.map((li) => ({
      name: li.querySelector('bottle-component')?.shadowRoot?.querySelector('.product-name')?.textContent?.trim() ?? '',
      count: Number(li.querySelector('.bottle-button')?.textContent?.trim() ?? 0),
    })),
  );
  const unique = (name: string) => rows.filter((r) => r.name === name).length === 1;
  const pick = rows.find((r) => r.name && r.count >= 2 && unique(r.name));
  expect(pick, 'a Hütte row with at least two bottles and a unique name').toBeDefined();
  return pick!;
}

/** Number of "3" rating chips shown for the expanded product. */
async function threeChips(page: Page): Promise<number> {
  const texts = await page.locator('.rating-chip').allTextContents();
  return texts.filter((t) => /^\s*3\b/.test(t)).length;
}

test.describe('Rating on bottle (dispose to Altglass)', () => {
  test('a rating chosen at disposal shows on the remaining sibling in the cellar', async ({
    authedPage: page,
  }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('[browser error]', msg.text());
    });

    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);
    const { name: PRODUCT, count } = await pickRowWithSiblings(page);
    console.log('rating product:', JSON.stringify(PRODUCT), '| bottles:', count);
    const row = page.locator('li').filter({ has: page.getByText(PRODUCT, { exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row.locator('.bottle-button')).toHaveText(String(count));

    // Ratings of 3 the product already has (expand, count, collapse again).
    const name = page.getByText(PRODUCT, { exact: true });
    await name.click();
    await expect(page.locator('product-component')).toBeVisible();
    const threesBefore = await threeChips(page);
    await name.click();
    await expect(page.locator('product-component')).toHaveCount(0);

    // Rate one bottle 3 and dispose it to Altglass.
    await row.locator('.bottle-button').click();
    await expect(page.locator('.rating-product')).toHaveText(PRODUCT);
    await page.locator('.rating-button').filter({ hasText: /^3$/ }).click();
    await page.locator('.rating-action.confirm').click();

    // One bottle fewer; a sibling of the same product remains in Hütte.
    await expect(row.locator('.bottle-button')).toHaveText(String(count - 1));

    // Expand the remaining bottle: its product detail should list one more 3.
    await name.click();
    await expect(page.getByText('Bewertungen')).toBeVisible({ timeout: 5000 });
    expect(await threeChips(page)).toBe(threesBefore + 1);
  });
});
