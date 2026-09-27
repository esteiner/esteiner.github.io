import { test, expect } from '../fixtures/auth';

/**
 * The "Flaschen" row shows the number of bottles outside the Altglass cellar.
 * Read-only: does not mutate the Pod.
 */
test.describe('Profile page bottle count', () => {
  test('shows the bottle count without Altglass', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: 'Kellerprofil', exact: true }).click();
    await page.waitForURL(/\/profile/);

    const value = page
      .locator('.section-header', { hasText: 'Kellermeister' })
      .locator('+ .card .group')
      .filter({ hasText: 'Flaschen' })
      .locator('.value');
    await expect(value).toHaveText(/^\d+$/);
    console.log('Flaschen:', (await value.textContent())?.trim());
  });
});
