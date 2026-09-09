import { test, expect } from '../fixtures/auth';

/**
 * End-to-end verification of the photo → order → cellarwork flow.
 *
 * Run with the conversion service stubbed at a configured endpoint:
 *
 *   VITE_ORDER_CONVERSION_URL=http://localhost:9977/convert \
 *     npx playwright test -c e2e/playwright.config.ts photo-order-capture
 *
 * The env var enables the "Hinzufügen" feature (availability() reads it at
 * build time); `page.route` below answers every request to that endpoint with a
 * fixed order Turtle, so no real conversion server is needed.
 *
 * The seeded inbox holds the SAME order (6 units of the Dhondt-Grellet product),
 * so the flow is: open cellarwork → inbox ingests 6 → photo capture converts and
 * DIRECTLY ingests the same order → 6 more → 12 bottles total. Seeing the count
 * go 6 → 12 proves the photo path added its bottles without the inbox.
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
  test('captures front+back, converts to an order, and ingests it directly into cellarwork', async ({
    authedPage: page,
  }) => {
    // Stub the conversion service (endpoint set via VITE_ORDER_CONVERSION_URL).
    await page.route('**/convert*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/turtle', body: ORDER_TTL });
    });

    // Open cellarwork ("Kellerarbeit") FIRST — it ingests the seeded inbox order
    // (6 bottles) and, importantly, leaves us ON the cellarwork page. Adding a
    // photo order from here exercises the same-route refresh: the footer's
    // navigation to the route we're already on is a no-op, so the page must
    // reload via the cellar-updated event to reflect the new bottles.
    await page.getByRole('button', { name: 'Kellerarbeit' }).click();
    await page.waitForURL(/\/cellarwork\//);
    await expect(page.getByText(PRODUCT, { exact: true })).toHaveCount(6, { timeout: 60_000 });

    // Answer the two capture steps: the footer opens one hidden file input per
    // step (front, then back). A queued filechooser handler feeds each in turn.
    const files = [
      { name: 'front.jpg', mimeType: 'image/jpeg', buffer: IMAGE },
      { name: 'back.jpg', mimeType: 'image/jpeg', buffer: IMAGE },
    ];
    page.on('filechooser', async (chooser) => {
      const next = files.shift();
      if (next) {
        await chooser.setFiles(next);
      }
    });

    // Step 1: front photo.
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    // Step 2: back photo (a fresh user gesture, as on a real device).
    await page.getByRole('button', { name: 'Rückseite' }).click();

    // Conversion → direct ingestion of the photo order (6 bottles). We stay on
    // cellarwork, so the count goes 6 → 12 only if the same-route refresh works.
    await expect(page.getByText(PRODUCT, { exact: true })).toHaveCount(12, { timeout: 60_000 });
  });
});
