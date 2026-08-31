import { test, expect } from '../fixtures/auth';

const PRODUCT = 'Aagne Pinot noir spätlese 2021 (1.5l)';

test.describe('Cellar Hütte', () => {
  test('lists exactly one bottle of Aagne Pinot noir spätlese 2021 (1.5l)', async ({
    authedPage: page,
  }) => {
    // Open the Hütte cellar from the authenticated landing page.
    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);

    await expect(page.getByRole('heading', { name: /Keller\s+Hütte/ })).toBeVisible();

    // The product is listed exactly once.
    const product = page.getByText(PRODUCT, { exact: true });
    await expect(product).toHaveCount(1);

    // Its bottle count reads exactly 1. The count button is a light-DOM child
    // of the <li>; the product name lives in the bottle-component's shadow DOM,
    // so we match the row via `has` (locators pierce shadow roots).
    const row = page.locator('li').filter({ has: product });
    await expect(row).toHaveCount(1);
    await expect(row.locator('.bottle-button')).toHaveText('1');
  });
});
