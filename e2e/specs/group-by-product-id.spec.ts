import { test, expect } from '../fixtures/auth';

/**
 * The seed's Altglass cellar holds wines bought across different orders as
 * distinct products that share an identical name. The names are found at run
 * time (any name shown on more than one row), so the test doesn't depend on
 * which wines the seed currently contains.
 */
test.describe('Cellar bottles grouped by product id', () => {
  test('same-named products from different orders render as separate rows', async ({
    authedPage: page,
  }) => {
    await page.getByRole('button', { name: 'Altglass' }).click();
    await page.waitForURL(/\/cellar\//);
    await expect(page.locator('li .bottle-button').first()).toBeVisible({ timeout: 30_000 });

    const rows = await page.locator('li').evaluateAll((lis) =>
      lis.map((li) => ({
        name: li.querySelector('bottle-component')?.shadowRoot?.querySelector('.product-name')?.textContent?.trim() ?? '',
        count: Number(li.querySelector('.bottle-button')?.textContent?.trim() ?? 0),
      })),
    );
    const names = rows.map((r) => r.name);
    const duplicated = [...new Set(names)].filter((n) => n && names.filter((m) => m === n).length > 1);
    for (const name of duplicated) {
      console.log(`${name}: ${names.filter((m) => m === name).length} rows, counts ${JSON.stringify(rows.filter((r) => r.name === name).map((r) => r.count))}`);
    }

    // Grouping by id: some name yields MORE THAN ONE row (impossible under
    // name-grouping, where the map key was the name).
    expect(duplicated.length, 'at least one product name shown on several Altglass rows').toBeGreaterThan(0);

    for (const name of duplicated) {
      const indexes = names.flatMap((n, i) => (n === name ? [i] : []));
      // Same-id bottles still merge: every row carries a positive count.
      for (const i of indexes) expect(rows[i].count).toBeGreaterThan(0);
      // Identically-named rows are adjacent (name ordering preserved).
      expect(indexes[indexes.length - 1] - indexes[0], `rows of "${name}" are contiguous`).toBe(indexes.length - 1);
    }
  });
});
