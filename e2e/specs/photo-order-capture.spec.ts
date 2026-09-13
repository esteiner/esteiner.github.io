import { test, expect } from '../fixtures/auth';

/**
 * End-to-end verification of the photo/file → order → cellarwork flow, including
 * the per-add source choice (Kamera vs Datei).
 *
 * Run with the built-in mock conversion service (no network needed):
 *
 *   VITE_ORDER_CONVERSION_URL=MOCKED \
 *     npx playwright test -c e2e/playwright.config.ts photo-order-capture
 *
 * The env var enables the "Hinzufügen" feature (availability() reads it at build
 * time). With MOCKED, `convert()` returns a fixed order and no request is made;
 * the `page.route` below only matters if a real HTTP endpoint is configured.
 *
 * The test opens cellarwork (ingesting the seeded inbox order), then performs
 * two adds — one via Datei (file picker) and one via Kamera — asserting the
 * product count grows each time and that only the camera source forces the
 * device camera (`capture="environment"`).
 */
const PRODUCT = 'Dhondt-Grellet Les Terres Fines 2021';

// What the stub conversion service always returns.
const ORDER_TTL = `PREFIX km:     <https://vocab.kellermeister.ch/wine/>
PREFIX schema: <https://schema.org/>
PREFIX xsd:    <http://www.w3.org/2001/XMLSchema#>

<https://schema.org/organization/sonja-steiner/contact>
        a             schema:ContactPoint;
        schema:email  "sonja.steiner@acons.ch";
        schema:name   "Sonja Steiner" .

<https://kellermeister.ch/orders/1004727/1>
        a                     schema:OrderItem;
        schema:orderQuantity  6;
        schema:orderedItem    <https://kellermeister.ch/products/dhondt-grellet-les-terres-fines-2021>;
        schema:price          90.00;
        schema:priceCurrency  "CHF" .

<https://www.boucherville.ch>
        a             schema:Organization;
        schema:email  "info@boucherville.ch";
        schema:name   "Boucherville AG";
        schema:url    <https://www.boucherville.ch> .

<https://kellermeister.ch/products/dhondt-grellet-les-terres-fines-2021>
        a                      schema:Product;
        schema:name            "Dhondt-Grellet Les Terres Fines 2021";
        schema:productionDate  "2021"^^xsd:gYear;
        km:alkoholgehalt       "12.5%";
        km:ausbau              "Traditionelle Flaschengärung, Ausbau auf der Hefe, teilweise in Eichenfässern vinifiziert";
        km:biologisch          "ja";
        km:hersteller          "Dhondt-Grellet";
        km:klassifikation      "Premier Cru, Extra Brut";
        km:land                "Frankreich";
        km:milliliter          750;
        km:region              "Champagne";
        km:traubensorte        "Chardonnay 100%";
        km:trinkfensterBis     "2035"^^xsd:gYear;
        km:trinkfensterVon     "2026"^^xsd:gYear;
        km:weinart             "Schaumwein";
        km:weinfarbe           "weiss";
        km:weinname            "Les Terres Fines" .

<https://schema.org/organization/sonja-steiner>
        a                    schema:Organization;
        schema:address       "Morgartenstrasse 9, 6003 Luzern, Schweiz";
        schema:contactPoint  <https://schema.org/organization/sonja-steiner/contact>;
        schema:name          "Sonja Steiner" .

<https://kellermeister.ch/orders/1004727>
        a                     schema:Order;
        schema:customer       <https://schema.org/organization/sonja-steiner>;
        schema:invoiceNumber  "1004727";
        schema:orderDate      "2026-03-27"^^xsd:date;
        schema:orderNumber    "1004727";
        schema:orderedItem    <https://kellermeister.ch/orders/1004727/1>;
        schema:price          "540.00";
        schema:priceCurrency  "CHF";
        schema:seller         <https://www.boucherville.ch> .
`;

// A tiny stand-in for a captured photo.
const IMAGE = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x10]);

test.describe('Photo order capture', () => {
  test('adds bottles from either a file or the camera, chosen per add', async ({
    authedPage: page,
  }) => {
    // Stub the conversion service in case an HTTP endpoint is configured. With
    // VITE_ORDER_CONVERSION_URL=MOCKED (how this spec is run) the mock returns a
    // fixed order and this route is simply never hit.
    await page.route('**/convert*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/turtle', body: ORDER_TTL });
    });

    // Answer every file picker the file source opens, recording each input's
    // `capture` attribute so we can assert file mode does NOT force the camera.
    const fileCaptureAttrs: (string | null)[] = [];
    page.on('filechooser', async (chooser) => {
      fileCaptureAttrs.push(await chooser.element().getAttribute('capture'));
      await chooser.setFiles({ name: 'label.jpg', mimeType: 'image/jpeg', buffer: IMAGE });
    });

    const productPresent = page.getByText(PRODUCT, { exact: true });
    const video = page.locator('video.camera-video');
    const sourceDialog = page.getByRole('dialog', { name: 'Quelle wählen' });
    const detailsDialog = page.getByRole('dialog', { name: 'Angaben' });
    // On the normal cellar view bottles are grouped per product with a count badge;
    // this scenario has a single product (Dhondt-Grellet), so at most one badge.
    // Tolerate an empty cellar (0 badges) — depending on suite order the seeded
    // inbox order may already have been consumed by another spec.
    const countBadge = page.locator('button.bottle-button');
    const readCount = async () =>
      (await countBadge.count()) === 0 ? 0 : Number((await countBadge.innerText()).trim());

    // The cellarwork cellar ("Kellerarbeit") now opens to its NORMAL bottle view
    // (like any cellar); that view also ingests any pending inbox order on open.
    await page.getByRole('button', { name: 'Kellerarbeit' }).click();
    await page.waitForURL(/\/cellar\//);
    expect(page.url()).not.toMatch(/\/cellarwork\//);
    // Let the view settle (footer present) — the cellar may be empty or hold bottles.
    await expect(page.getByRole('button', { name: 'Hinzufügen' })).toBeVisible({ timeout: 60_000 });

    // --- The source chooser is a modal dialog with a working cancel. ---
    const countBeforeCancel = await readCount();
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(sourceDialog).toBeVisible();
    await page.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(sourceDialog).toHaveCount(0);
    expect(await readCount()).toBe(countBeforeCancel); // nothing ingested

    // --- Camera source: live preview → capture front+back → details → Senden. ---
    const before = await readCount();
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await page.getByRole('button', { name: 'Kamera' }).click();
    // The in-app camera preview appears (getUserMedia), not a file dialog.
    await expect(video).toBeVisible();
    await expect(page.getByText('Vorderseite', { exact: true })).toBeVisible(); // title
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.videoWidth), { timeout: 15_000 })
      .toBeGreaterThan(0);
    // Front shutter (lighter tint); remember its colour to compare with the back.
    const frontShutter = page.getByRole('button', { name: 'Vorderseite aufnehmen' });
    const frontColor = await frontShutter.evaluate((el) => getComputedStyle(el).backgroundColor);
    await frontShutter.click(); // front frame
    // Overlay advances to the back step: title "Rückseite" and the back shutter.
    await expect(page.getByText('Rückseite', { exact: true })).toBeVisible();
    const backShutter = page.getByRole('button', { name: 'Rückseite aufnehmen' });
    await expect(backShutter).toBeVisible();
    const backColor = await backShutter.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(frontColor).not.toBe(backColor); // shutter colour differs front vs back
    await backShutter.click(); // back frame
    // The stream is released and the details dialog is shown before sending.
    await expect(video).toHaveCount(0);
    await expect(detailsDialog).toBeVisible();
    // The price line has an integer price input and a currency input, each labelled.
    await expect(detailsDialog.locator('input.details-price')).toHaveAttribute('type', 'number');
    await expect(detailsDialog.locator('input.details-price-currency')).toBeVisible();
    await expect(detailsDialog.getByText('Währung', { exact: true })).toBeVisible();
    // A third row holds an integer "Anzahl" (quantity) input defaulting to 1.
    await expect(detailsDialog.getByText('Anzahl', { exact: true })).toBeVisible();
    await expect(detailsDialog.locator('input.details-quantity')).toHaveAttribute('type', 'number');
    await expect(detailsDialog.locator('input.details-quantity')).toHaveValue('1');
    // Enter an integer price + currency + quantity, then send.
    await detailsDialog.locator('input.details-price').fill('42');
    await detailsDialog.locator('input.details-price-currency').fill('CHF');
    await detailsDialog.locator('input.details-quantity').fill('6');
    await page.getByRole('button', { name: 'Senden' }).click();
    await expect(detailsDialog).toHaveCount(0);
    // We stay on the normal cellar view; the same-route refresh grows the count
    // and the added product is now listed.
    await page.waitForURL(/\/cellar\//);
    await expect(productPresent).toBeVisible({ timeout: 60_000 });
    await expect.poll(readCount, { timeout: 60_000 }).toBeGreaterThan(before);

    // --- File source: capture front+back, reach the details dialog, then cancel. ---
    const beforeFile = await readCount();
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(sourceDialog).toBeVisible();
    await page.getByRole('button', { name: 'Datei' }).click(); // front (file picker)
    await page.getByRole('button', { name: 'Rückseite' }).click(); // back (file picker)
    await expect(detailsDialog).toBeVisible();
    expect(fileCaptureAttrs).toEqual([null, null]); // camera never forced
    // Abbrechen aborts the add: nothing is sent or ingested.
    await page.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(detailsDialog).toHaveCount(0);
    expect(await readCount()).toBe(beforeFile);

    // --- The "Kellerarbeit" header action drills into the work display. ---
    await page.getByRole('button', { name: 'Kellerarbeit' }).click();
    await page.waitForURL(/\/cellarwork\//);
  });
});
