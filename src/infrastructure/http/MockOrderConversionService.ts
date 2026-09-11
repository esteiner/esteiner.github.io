import type {
    OrderConversionService,
    OrderConversionAvailability,
    OrderConversionDetails,
} from "../../application/ports/OrderConversionService.ts";

/**
 * Sentinel value for `VITE_ORDER_CONVERSION_URL` that selects the mock service
 * instead of a real HTTP endpoint (see CDI). A demo/offline affordance: the
 * capture flow can be exercised end-to-end without a conversion backend.
 */
export const MOCKED_CONVERSION_ENDPOINT = "MOCKED";

/**
 * A conversion service that ignores the photos and returns a fixed built-in
 * order Turtle without any network request. Always available.
 */
export class MockOrderConversionService implements OrderConversionService {

    availability(): OrderConversionAvailability {
        return {available: true};
    }

    async convert(_front: Blob, _back: Blob, _details?: OrderConversionDetails): Promise<string> {
        return MOCK_ORDER_TTL;
    }
}

/** The order returned by the mock: one order for 6 units of a Dhondt-Grellet wine. */
const MOCK_ORDER_TTL = `PREFIX km:     <https://vocab.kellermeister.ch/wine/>
PREFIX schema: <https://schema.org/>
PREFIX xsd:    <http://www.w3.org/2001/XMLSchema#>

<https://schema.org/organization/sonja-steiner/contact>
        a             schema:ContactPoint;
        schema:email  "sonja.steiner@acons.ch";
        schema:name   "Sonja Steiner" .

<https://kellermeister.ch/orders/1004727/1>
        a                     schema:OrderItem;
        schema:orderQuantity  1;
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
