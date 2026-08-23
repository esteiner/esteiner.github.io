import {getSourceUrl, saveFileInContainer} from "@inrupt/solid-client";
import type {AuthService} from "../../application/ports/AuthService.ts";
import type {InboxUploader, InboxUploadAvailability, InboxUploadOutcome} from "../../application/ports/InboxUploader.ts";

/**
 * Fallback content type for a file the browser reports no type for.
 *
 * Browsers derive `File.type` from the OS extension mapping, and `.ttl` is
 * typically unmapped — so a Turtle order arrives here as `""`. Posted without a
 * usable type it would be stored as an opaque binary, and inbox ingestion (which
 * reads RDF) would never see it: the upload would "succeed" invisibly.
 */
const DEFAULT_CONTENT_TYPE = "text/turtle";

/**
 * Uploads a file into the Pod inbox with `saveFileInContainer`, so the server
 * assigns a free name rather than overwriting a resource that is queued for
 * ingestion. Repeated uploads of the same test file are therefore additive.
 */
export class SolidInboxUploader implements InboxUploader {

    constructor(
        private readonly auth: AuthService,
        private readonly inboxContainer: () => string | null,
    ) {
    }

    availability(): InboxUploadAvailability {
        if (!this.auth.getSession().isLoggedIn) {
            return {available: false, reason: "Nicht angemeldet."};
        }
        if (!this.inboxContainer()) {
            return {available: false, reason: "Pod-Container noch nicht aufgelöst."};
        }
        return {available: true};
    }

    async upload(file: File): Promise<string> {
        const availability = this.availability();
        if (!availability.available) {
            throw new Error(availability.reason);
        }
        const container = this.inboxContainer() as string;
        const saved = await saveFileInContainer(container, file, {
            fetch: this.auth.getSession().fetch,
            contentType: contentTypeOf(file),
        });
        // The server names the resource, so ask the result where it landed.
        return getSourceUrl(saved) ?? container;
    }

    /**
     * Upload sequentially: every file posts into the same container on a real
     * Pod, and a debug tool gains nothing from saturating it. Each file is
     * caught on its own so one rejection neither aborts the rest nor hides the
     * files already uploaded.
     */
    async uploadAll(files: File[]): Promise<InboxUploadOutcome[]> {
        const availability = this.availability();
        if (!availability.available) {
            throw new Error(availability.reason);
        }
        const outcomes: InboxUploadOutcome[] = [];
        for (const file of files) {
            try {
                outcomes.push({file: file.name, ok: true, url: await this.upload(file)});
            } catch (error) {
                outcomes.push({file: file.name, ok: false, message: error instanceof Error ? error.message : String(error)});
            }
        }
        return outcomes;
    }
}

/** The browser's content type for a file, or the Turtle fallback. */
export function contentTypeOf(file: File): string {
    return file.type || DEFAULT_CONTENT_TYPE;
}
