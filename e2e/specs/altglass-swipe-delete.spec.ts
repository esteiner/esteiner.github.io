import type { Page, Locator } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

/**
 * Swipe-left-to-delete on the Altglass cellar page: a swipe reveals "Löschen",
 * tapping it deletes all of the row's Altglass bottles. Other cellars have no
 * swipe. Rows and counts are read at run time, not assumed from the seed.
 */
const subtitleCount = async (page: Page): Promise<number> => {
  const text = (await page.locator('kellermeister-header span[slot="subtitle"]').textContent()) ?? '';
  return Number(text.trim().split(/\s+/)[0]);
};

async function openCellar(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name, exact: true }).click();
  await page.waitForURL(/\/cellar\//);
  await expect(page.locator('li .bottle-button').first()).toBeVisible({ timeout: 30_000 });
}

/** Drag horizontally across a row with the mouse (pointer events, like a touch swipe). */
async function swipe(page: Page, target: Locator, dx: number): Promise<void> {
  const box = (await target.boundingBox())!;
  const y = box.y + box.height / 2;
  const x = box.x + box.width * 0.8;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 10 });
  await page.mouse.up();
}

const offsetOf = (row: Locator) =>
  row.locator('swipe-row').evaluate((el) => (el.shadowRoot!.querySelector('.swipe-content') as HTMLElement).style.transform);

test.describe('Altglass swipe-to-delete', () => {
  test('swipe reveals Löschen, tapping it deletes the row; other cellars cannot swipe', async ({
    authedPage: page,
  }) => {
    // Another cellar first: no swipe rows, a swipe moves nothing.
    await openCellar(page, 'Hütte');
    await expect(page.locator('swipe-row')).toHaveCount(0);
    const huetteRow = page.locator('li').first();
    const xBefore = (await huetteRow.locator('bottle-component').boundingBox())!.x;
    await swipe(page, huetteRow, -150);
    expect((await huetteRow.locator('bottle-component').boundingBox())!.x).toBe(xBefore);
    await expect(page.getByRole('button', { name: 'Löschen' })).toHaveCount(0);

    await page.goto('/');
    await openCellar(page, 'Altglass');

    // Pick a row whose product name no other row shares.
    const rows = await page.locator('li').evaluateAll((lis) =>
      lis.map((li) => ({
        name: li.querySelector('bottle-component')?.shadowRoot?.querySelector('.product-name')?.textContent?.trim() ?? '',
        count: Number(li.querySelector('.bottle-button')?.textContent?.trim() ?? 0),
      })),
    );
    const pick = rows.find((r) => r.name && rows.filter((o) => o.name === r.name).length === 1)!;
    expect(pick).toBeDefined();
    console.log('deleting:', JSON.stringify(pick.name), '| bottles:', pick.count);
    const headerBefore = await subtitleCount(page);
    const row = page.locator('li').filter({ has: page.getByText(pick.name, { exact: true }) });
    await expect(row).toHaveCount(1);

    // A short swipe snaps back.
    await swipe(page, row, -20);
    await expect.poll(() => offsetOf(row)).toBe('translateX(0px)');

    // A full swipe opens the row without expanding it.
    await swipe(page, row, -150);
    await expect.poll(() => offsetOf(row)).toBe('translateX(-72px)');
    await expect(page.locator('product-component')).toHaveCount(0);

    // Tapping elsewhere closes it again, nothing deleted.
    await page.locator('kellermeister-header').click({ position: { x: 5, y: 5 } });
    await expect.poll(() => offsetOf(row)).toBe('translateX(0px)');
    await expect(row).toHaveCount(1);

    // Open again and delete.
    await swipe(page, row, -150);
    await row.getByRole('button', { name: 'Löschen' }).click();
    await expect(row).toHaveCount(0);
    await expect.poll(() => subtitleCount(page)).toBe(headerBefore - pick.count);

    // Persisted: still gone after a reload.
    await page.waitForTimeout(800);
    await page.reload();
    await openCellar(page, 'Altglass');
    await expect(page.locator('li').filter({ has: page.getByText(pick.name, { exact: true }) })).toHaveCount(0);
    expect(await subtitleCount(page)).toBe(headerBefore - pick.count);
  });
});
