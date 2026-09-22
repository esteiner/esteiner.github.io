import { test, expect } from '../fixtures/auth';

/**
 * The profile page leads with "Kellermeister" — the user's own cellar data —
 * rather than with the Solid account details. Read-only: it asserts the order
 * and that each section kept its rows, without mutating the Pod.
 */
test.describe('Profile page section order', () => {
  test('leads with Kellermeister, then Solid Profil, Solid Apps, Debug', async ({
    authedPage: page,
  }) => {
    // Navigate in-app via the footer, which keeps the Solid session.
    await page.getByRole('button', { name: 'Kellerprofil', exact: true }).click();
    await page.waitForURL(/\/profile/);
    await expect(page.getByRole('heading', { name: 'Kellerprofil' })).toBeVisible();
    await expect(page.locator('.section-header p').first()).toBeVisible();

    await expect
      .poll(() => page.locator('.section-header p').allTextContents())
      .toEqual(['Kellermeister', 'Solid Profil', 'Solid Apps', 'Debug']);

    // The leading section still holds its own rows.
    const kellermeisterCard = page
      .locator('.section-header', { hasText: 'Kellermeister' })
      .locator('+ .card');
    expect(await kellermeisterCard.locator('label').allTextContents()).toEqual([
      'Version',
      'Flaschen',
      'Keller',
    ]);
    await expect(kellermeisterCard.locator('.cellar-list .cellar-name').first()).toBeVisible();

    // Reordering must not have changed how the sections are spaced: every card
    // sits the same distance below its header and carries the same margin.
    const spacing = await page.evaluate(() => {
      const root = document.querySelector('profile-page')!.shadowRoot!;
      const cards = [...root.querySelectorAll('.card')];
      const headers = [...root.querySelectorAll('.section-header')];
      return {
        gaps: headers.map((h, i) =>
          Math.round(cards[i].getBoundingClientRect().top - h.getBoundingClientRect().bottom),
        ),
        margins: cards.map((c) => getComputedStyle(c).marginBottom),
      };
    });
    expect(new Set(spacing.gaps).size).toBe(1);
    expect(new Set(spacing.margins).size).toBe(1);
  });
});
