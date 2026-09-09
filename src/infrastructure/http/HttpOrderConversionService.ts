import type {
    OrderConversionService,
    OrderConversionAvailability,
} from "../../application/ports/OrderConversionService.ts";

/**
 * HTTP implementation of {@link OrderConversionService}.
 *
 * POSTs both bottle photos, base64-encoded, as JSON `{front, back}` to the
 * configured endpoint and returns the response body as Turtle. The endpoint is
 * build-time configuration (`VITE_ORDER_CONVERSION_URL`); when it is absent the
 * feature reports itself unavailable rather than attempting a request.
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

    async convert(front: Blob, back: Blob): Promise<string> {
        const availability = this.availability();
        if (!availability.available) {
            throw new Error(availability.reason);
        }
        const [frontBase64, backBase64] = await Promise.all([toBase64(front), toBase64(back)]);
        const response = await fetch(this.endpoint as string, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({front: frontBase64, back: backBase64}),
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
