import { test, expect } from '../fixtures/auth';

// A wine with two bottles in Hütte (so a sibling of the same product resource
// remains after we dispose one).
const PRODUCT = 'Alois Lageder Chardonnay 2020';

/**
 * Drives the real UI end-to-end for the bottle-rating fix: a rating chosen when
 * disposing a bottle must appear on the product's rating list. Works only
 * because SoukaiBottleRepository.fetchBottles joins product→bottles in memory so
 * product.getRatings() aggregates the ratings stored on bottles.
 */
test.describe('Rating on bottle (dispose to Altglass)', () => {
  test('a rating chosen at disposal shows on the remaining sibling in the cellar', async ({
    authedPage: page,
  }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('[browser error]', msg.text());
    });

    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);
    const row = page.locator('li').filter({ has: page.getByText(PRODUCT, { exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row.locator('.bottle-button')).toHaveText('2');

    // Rate one bottle 3 and dispose it to Altglass.
    await row.locator('.bottle-button').click();
    await expect(page.locator('.rating-product')).toHaveText(PRODUCT);
    await page.locator('.rating-button').filter({ hasText: /^3$/ }).click();
    await page.locator('.rating-action.confirm').click();

    // One sibling of the same product remains in Hütte.
    await expect(row.locator('.bottle-button')).toHaveText('1');

    // Expand the remaining bottle: its product detail should list the rating.
    await page.getByText(PRODUCT, { exact: true }).click();
    await expect(page.getByText('Bewertungen')).toBeVisible({ timeout: 5000 });
    const chipTexts = await page.locator('.rating-chip').allTextContents();
    expect(chipTexts.some((t) => /^\s*3\b/.test(t))).toBe(true);
  });
});
