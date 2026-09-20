import { test, expect } from '../fixtures/auth';

// These wines exist in the seed's Altglass cellar as several distinct products
// (bought across different orders) that share an identical name.
const DUP_NAME_A = 'Agrapart 7 Crus';
const DUP_NAME_B = 'Decugnano dei Barbi Dosaggio Zero 2021';

const rowsFor = (page: import('@playwright/test').Page, name: string) =>
  page.locator('li').filter({ has: page.getByText(name, { exact: true }) });

test.describe('Cellar bottles grouped by product id', () => {
  test('same-named products from different orders render as separate rows', async ({
    authedPage: page,
  }) => {
    await page.getByRole('button', { name: 'Altglass' }).click();
    await page.waitForURL(/\/cellar\//);
    await expect(rowsFor(page, DUP_NAME_A).first()).toBeVisible();

    const aRows = await rowsFor(page, DUP_NAME_A).count();
    const aCounts = await rowsFor(page, DUP_NAME_A).locator('.bottle-button').allTextContents();
    const bRows = await rowsFor(page, DUP_NAME_B).count();
    const bCounts = await rowsFor(page, DUP_NAME_B).locator('.bottle-button').allTextContents();
    console.log(`${DUP_NAME_A}: ${aRows} rows, counts ${JSON.stringify(aCounts)}`);
    console.log(`${DUP_NAME_B}: ${bRows} rows, counts ${JSON.stringify(bCounts)}`);

    // Grouping by id: a single name yields MORE THAN ONE row (impossible under
    // name-grouping, where the map key was the name).
    expect(aRows).toBeGreaterThan(1);
    expect(bRows).toBeGreaterThan(1);
    // Same-id bottles still merge: every row carries a positive count.
    for (const c of [...aCounts, ...bCounts]) expect(Number(c)).toBeGreaterThan(0);

    // Probe: identically-named rows are adjacent (name ordering preserved).
    const allNames = await page.locator('bottle-component .product-name').allTextContents();
    const firstA = allNames.indexOf(DUP_NAME_A);
    const lastA = allNames.lastIndexOf(DUP_NAME_A);
    expect(lastA - firstA).toBe(aRows - 1); // contiguous block, no other name interleaved
  });
});
