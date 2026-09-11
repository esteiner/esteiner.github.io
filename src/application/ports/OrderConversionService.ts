/**
 * Converts photos of a wine bottle into an order, expressed as Turtle.
 *
 * A port so the UI never talks to the conversion HTTP endpoint directly, and so
 * the rules that are invisible in the UI — the request/response contract and the
 * endpoint precondition — live somewhere testable. The returned Turtle is
 * ingested directly into the cellarwork cellar (it does not transit the Pod
 * inbox), mirroring how {@link InboxUploader} keeps the inbox write behind a port.
 */
export interface OrderConversionService {

    /** Whether a conversion can be attempted (endpoint configured), and if not, why. */
    availability(): OrderConversionAvailability;

    /**
     * Convert the front and back photos of a bottle into an order as Turtle,
     * optionally with user-entered details (place bought/drunk, price) that the
     * service may fold into the order. Resolves with the `text/turtle` body the
     * service returned. Rejects when the precondition is unmet (no endpoint) or
     * the request fails (transport error or non-success status).
     */
    convert(front: Blob, back: Blob, details?: OrderConversionDetails): Promise<string>;
}

/** Optional, user-entered context for a converted order; blank fields are omitted. */
export type OrderConversionDetails = {
    /** Where the bottle was bought or drunk (sent as `place`). */
    place?: string;
    /** Integer price (sent as `price`, a JSON number). */
    price?: number;
    /** Free-text price unit, e.g. "CHF" (sent as `priceCurrency`). */
    priceCurrency?: string;
    /** Integer quantity of bottles (sent as `quantity`, a JSON number). */
    quantity?: number;
};

export type OrderConversionAvailability =
    | {available: true}
    | {available: false; reason: string};
