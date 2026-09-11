import type {
    OrderConversionService,
    OrderConversionAvailability,
    OrderConversionDetails,
} from "../../application/ports/OrderConversionService.ts";

/**
 * HTTP implementation of {@link OrderConversionService}.
 *
 * POSTs both bottle photos, base64-encoded, as JSON `{front, back}` (plus the
 * optional `place`/`price`/`priceCurrency`/`quantity` details when given) to the
 * configured endpoint and returns the response body as Turtle. The endpoint is
 * build-time configuration
 * (`VITE_ORDER_CONVERSION_URL`); when it is absent the feature reports itself
 * unavailable rather than attempting a request.
 */
export class HttpOrderConversionService implements OrderConversionService {

    constructor(private readonly endpoint: string | undefined) {
    }

    availability(): OrderConversionAvailability {
        if (!this.endpoint) {
            return {available: false, reason: "Konvertierungsdienst nicht konfiguriert."};
        }
        return {available: true};
    }

    async convert(front: Blob, back: Blob, details?: OrderConversionDetails): Promise<string> {
        const availability = this.availability();
        if (!availability.available) {
            throw new Error(availability.reason);
        }
        const [frontBase64, backBase64] = await Promise.all([toBase64(front), toBase64(back)]);
        // Only include details when provided, so the body stays {front, back}
        // when nothing was entered.
        const body: Record<string, string | number> = {front: frontBase64, back: backBase64};
        if (details?.place) {
            body.place = details.place;
        }
        if (typeof details?.price === "number") {
            body.price = details.price;
        }
        if (details?.priceCurrency) {
            body.priceCurrency = details.priceCurrency;
        }
        if (typeof details?.quantity === "number") {
            body.quantity = details.quantity;
        }
        const response = await fetch(this.endpoint as string, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`Konvertierung fehlgeschlagen: ${response.status} ${response.statusText}`.trim());
        }
        return await response.text();
    }
}

/** Base64-encode a Blob's bytes (without the data-URL prefix). */
async function toBase64(blob: Blob): Promise<string> {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    // Chunked so a multi-megabyte photo does not overflow the call stack of
    // String.fromCharCode(...bytes).
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}
