import { test, expect } from '../fixtures/auth';

test.describe('Inline product editing in the cellar', () => {
  test('pencil toggles inputs; an edit persists across a reload; derived fields stay read-only', async ({
    authedPage: page,
  }) => {
    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);

    const firstName = page.locator('bottle-component .product-name').first();
    const name = ((await firstName.textContent()) ?? '').trim();
    console.log('editing product:', JSON.stringify(name));

    // Probe: no pencil while every row is collapsed.
    expect(await page.locator('bottle-component .edit-button').count()).toBe(0);

    // Expand the first product row → pencil appears; fields are read-only labels.
    await firstName.click();
    const pencil = page.locator('bottle-component .edit-button');
    await expect(pencil).toBeVisible();
    const regionGroup = page.locator('product-component .group').filter({ hasText: 'Region' });
    await expect(regionGroup.locator('input')).toHaveCount(0);

    // Click pencil → fields become inputs.
    await pencil.click();
    const regionInput = regionGroup.locator('input');
    await expect(regionInput).toBeVisible();

    // Probe: derived fields (Quelle, Bewertungen) stay read-only in edit mode.
    const quelleInputs = await page.locator('product-component .group').filter({ hasText: 'Quelle' }).locator('input').count();
    const bewertungenInputs = await page.locator('product-component .group').filter({ hasText: 'Bewertungen' }).locator('input').count();
    console.log('inputs in Quelle group:', quelleInputs, '| in Bewertungen group:', bewertungenInputs);
    expect(quelleInputs).toBe(0);
    expect(bewertungenInputs).toBe(0);

    // Edit Region and commit (blur fires change → persist).
    const NEW = 'VERIFY-Toskana';
    await regionInput.fill(NEW);
    await regionInput.blur();
    await page.waitForTimeout(800); // let the async IndexedDB save settle

    // Persistence: full reload → fresh app instance reads IndexedDB.
    await page.reload();
    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);
    await page.getByText(name, { exact: true }).first().click();

    const regionAfter = page.locator('product-component .group').filter({ hasText: 'Region' });
    await expect(regionAfter.getByText(NEW)).toBeVisible();
    // Probe: re-expanded row starts read-only (label, not input) until pencil.
    await expect(regionAfter.locator('input')).toHaveCount(0);

  });

  test('Hersteller/Weinname are editable below the price and the name is derived into the header', async ({
    authedPage: page,
  }) => {
    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);

    const PRODUCT = 'Alois Lageder Chardonnay 2020';
    await page.locator('bottle-component .product-name').filter({ hasText: PRODUCT }).first().click();
    const pencil = page.locator('bottle-component .edit-button');
    await expect(pencil).toBeVisible();
    await pencil.click();

    // Hersteller and Weinname are shown as inputs, directly below Preis.
    const labels = await page.locator('product-component .group label').allTextContents();
    console.log('field order:', JSON.stringify(labels.slice(0, 4)));
    expect(labels.slice(0, 3)).toEqual(['Preis / Flasche', 'Hersteller', 'Weinname']);
    const weinnameInput = page.locator('product-component .group').filter({ hasText: 'Weinname' }).locator('input');
    await expect(weinnameInput).toBeVisible();

    // Editing Weinname derives the header name live (producer + weinname + year).
    await weinnameInput.fill('Löwengang Chardonnay');
    await expect(
      page.locator('bottle-component .product-name').filter({ hasText: 'Löwengang Chardonnay' }),
    ).toBeVisible();
    await weinnameInput.blur();
    await page.waitForTimeout(800);

    // Persist across a full reload.
    await page.reload();
    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);
    await expect(
      page.locator('bottle-component .product-name').filter({ hasText: 'Löwengang Chardonnay' }).first(),
    ).toBeVisible();
  });

  test('price and currency are edited on one line and shown read-only after leaving edit mode', async ({
    authedPage: page,
  }) => {
    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);

    // Any product works; take the first row's name at run time (the seed drifts).
    const firstName = page.locator('bottle-component .product-name').first();
    const PRODUCT = ((await firstName.textContent()) ?? '').trim();
    console.log('editing price of:', JSON.stringify(PRODUCT));
    const header = page.locator('bottle-component .product-name').filter({ hasText: PRODUCT }).first();
    await header.click();
    const pencil = page.locator('bottle-component .edit-button');
    await pencil.click();

    // Two inputs on the "Preis / Flasche" line: price (number) and currency (text).
    const priceInput = page.getByLabel('Preis', { exact: true });
    const currencyInput = page.getByLabel('Währung', { exact: true });
    await expect(priceInput).toHaveAttribute('type', 'number');
    await expect(currencyInput).toHaveAttribute('type', 'text');
    const priceBox = (await priceInput.boundingBox())!;
    const currencyBox = (await currencyInput.boundingBox())!;
    expect(Math.abs(priceBox.y - currencyBox.y)).toBeLessThan(2);
    expect(currencyBox.x).toBeGreaterThan(priceBox.x);

    const NEW_PRICE = '987';
    const NEW_CURRENCY = 'EUR';
    await priceInput.fill(NEW_PRICE);
    await priceInput.blur();
    await currencyInput.fill(NEW_CURRENCY);
    await currencyInput.blur();
    await page.waitForTimeout(800); // let the async IndexedDB save settle

    // Leave edit mode → the read-only price (slotted into product-component) shows both.
    await pencil.click();
    await expect(priceInput).toHaveCount(0);
    const product = page.locator('bottle-component product-component').first();
    await expect(product).toContainText(`${NEW_PRICE} ${NEW_CURRENCY}`);

    // Collapse and re-expand → still the new values.
    await header.click();
    await header.click();
    await expect(page.locator('bottle-component product-component').first()).toContainText(`${NEW_PRICE} ${NEW_CURRENCY}`);

    // Persisted across a full reload.
    await page.reload();
    await page.getByRole('button', { name: 'Hütte' }).click();
    await page.waitForURL(/\/cellar\//);
    await page.locator('bottle-component .product-name').filter({ hasText: PRODUCT }).first().click();
    await expect(page.locator('bottle-component product-component').first()).toContainText(`${NEW_PRICE} ${NEW_CURRENCY}`);
  });
});
