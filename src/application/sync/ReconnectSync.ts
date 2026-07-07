import type {SyncCoordinator} from "./SyncCoordinator.ts";

export interface ReconnectSyncOptions {
    maxRetries: number;
    baseDelayMs: number;
    /** Injectable delay (overridable in tests). */
    delay?: (ms: number) => Promise<void>;
}

/**
 * Drives the on-reconnect sync path with exponential backoff. Because the
 * coordinator captures failures into its status (rather than throwing on the
 * reconnect path), we retry while the status remains `error`.
 */
export class ReconnectSync {
    private readonly delay: (ms: number) => Promise<void>;

    constructor(
        private readonly coordinator: SyncCoordinator,
        private readonly options: ReconnectSyncOptions,
    ) {
        this.delay =
            options.delay ??
            ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    }

    async run(): Promise<void> {
        for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
            await this.coordinator.requestSync("reconnect");
            if (this.coordinator.getStatus().state !== "error") {
                return; // success or skipped (no session)
            }
            if (attempt < this.options.maxRetries) {
                await this.delay(this.options.baseDelayMs * 2 ** attempt);
            }
        }
    }
}
