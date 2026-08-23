/**
 * Writes a file into the Pod inbox container (`{storageRoot}inbox/kellermeister/`),
 * the drop location that order ingestion consumes.
 *
 * A port so the UI never talks to the Solid client directly, and so the rules
 * that are invisible in the UI — the content type an upload is stored with, and
 * the session/container precondition — live somewhere testable.
 */
export interface InboxUploader {

    /** Whether an upload can be attempted, and if not, why. */
    availability(): InboxUploadAvailability;

    /**
     * Upload `file` into the inbox. Resolves with the URL of the resource the
     * server created — which is NOT derivable from the file name, because the
     * server assigns it. Rejects when the precondition is unmet or the write
     * fails. The contents of the file are not inspected.
     */
    upload(file: File): Promise<string>;

    /**
     * Upload several files, one outcome per file in the order given.
     *
     * Resolves even when individual files fail — rejecting would discard the
     * outcomes of the files already uploaded, which is exactly the information
     * a partial failure needs to convey. Still rejects when the precondition is
     * unmet, since then nothing can be attempted at all.
     */
    uploadAll(files: File[]): Promise<InboxUploadOutcome[]>;
}

/** What became of one file in a batch upload. */
export type InboxUploadOutcome =
    | {file: string; ok: true; url: string}
    | {file: string; ok: false; message: string};

export type InboxUploadAvailability =
    | {available: true}
    | {available: false; reason: string};
