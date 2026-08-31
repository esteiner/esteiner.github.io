import { test, expect } from '../fixtures/auth';

/**
 * Regression test for the inbox-order CORS/fetch bug: an inbox order embeds all
 * its parts (order, item, product, seller, customer) in one Pod document under
 * synthetic foreign identifiers (https://kellermeister.ch/…). Ingestion must read
 * those from the document, never dereference them. Before the fix, opening the
 * cellarwork cellar tried to fetch https://kellermeister.ch/orders/1004727/1 and
 * failed with a CORS error, so nothing was ingested.
 *
 * The seeded inbox (community-solid-server/.volumes/data/edwin/inbox/kellermeister/
 * dhondt-grellet-les-terres-fines-2021.ttl) holds one order for 6 units of the
 * Dhondt-Grellet product. The cellarwork ("Kellerarbeit") cellar starts empty, so
 * after ingestion it must list exactly those 6 bottles.
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

    // Open the cellarwork ("Kellerarbeit") cellar — opening it ingests the inbox.
    await page.getByRole('button', { name: 'Kellerarbeit' }).click();
    await page.waitForURL(/\/cellarwork\//);

    // Ingestion runs on open (read inbox → create products/bottles → clear inbox);
    // give it room, then assert the 6 ordered units landed in cellarwork.
    await expect(page.getByText('6 Flaschen zum umbuchen')).toBeVisible({ timeout: 60_000 });

    // The ingested product is listed (once per unit).
    await expect(page.getByText(PRODUCT, { exact: true })).toHaveCount(6);

    // No request to the synthetic inbox identifiers was ever made.
    expect(forbiddenFetches).toEqual([]);
  });
});
