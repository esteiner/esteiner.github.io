import { test, expect } from '../fixtures/auth';

/**
 * Regression test for the inbox-order CORS/fetch bug: an inbox order embeds all
 * its parts (order, item, product, seller, customer) in one Pod document under
 * synthetic foreign identifiers (https://kellermeister.ch/…). Ingestion must read
 * those from the document, never dereference them. Before the fix, opening the
 * cellarwork cellar tried to fetch https://kellermeister.ch/orders/1004727/1 and
 * failed with a CORS error, so nothing was ingested.
 *
 * The inbox order fixture (e2e/fixtures/inbox/dhondt-grellet-les-terres-fines-2021.ttl,
 * copied into the throwaway Pod's inbox by e2e/helpers/pod.ts `prepareData`) holds
 * one order for 6 units of the Dhondt-Grellet product. The cellarwork
 * ("Kellerarbeit") cellar starts empty, so after ingestion its normal bottle view
 * must list that product with a count of 6.
 *
 * The cellarwork cellar now opens to its normal bottle view (like any cellar), and
 * that view ingests the inbox on open; the work display is a drill-in.
 */
const PRODUCT = 'Dhondt-Grellet Les Terres Fines 2021';

test.describe('Inbox order ingestion', () => {
  test('ingests the embedded inbox order into cellarwork without dereferencing its identifiers', async ({
    authedPage: page,
  }) => {
    // Fail loudly if the browser attempts the forbidden cross-origin fetch.
    const forbiddenFetches: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.url().startsWith('https://kellermeister.ch/')) {
        forbiddenFetches.push(req.url());
      }
    });

    // Open the cellarwork ("Kellerarbeit") cellar — its normal view ingests the inbox.
    await page.getByRole('button', { name: 'Kellerarbeit' }).click();
    await page.waitForURL(/\/cellar\//);
    expect(page.url()).not.toMatch(/\/cellarwork\//);

    // Ingestion runs on open (read inbox → create products/bottles → clear inbox);
    // give it room, then assert the product landed with a count badge of 6.
    await expect(page.getByText(PRODUCT, { exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('button.bottle-button')).toHaveText('6');

    // No request to the synthetic inbox identifiers was ever made.
    expect(forbiddenFetches).toEqual([]);
  });
});
