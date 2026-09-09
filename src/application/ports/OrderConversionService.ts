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
     * Convert the front and back photos of a bottle into an order as Turtle.
     * Resolves with the `text/turtle` body the service returned. Rejects when the
     * precondition is unmet (no endpoint) or the request fails (transport error
     * or non-success status).
     */
    convert(front: Blob, back: Blob): Promise<string>;
}

export type OrderConversionAvailability =
    | {available: true}
    | {available: false; reason: string};
