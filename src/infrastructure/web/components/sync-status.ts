import {css, html, LitElement} from "lit";
import {customElement, state} from "lit/decorators.js";
import {CDI} from "../../cdi/CDI.ts";
import {NotAuthenticatedError} from "../../../application/errors.ts";
import type {SyncStatus} from "../../../application/sync/SyncCoordinator.ts";
import {formatLastSync} from "./sync-status-format.ts";

/**
 * Shows synchronization status (idle / syncing / error + last-synced time) and
 * offers a manual "sync now" action. Local data is always usable; this only
 * reflects and triggers Pod synchronization.
 */
@customElement("sync-status")
class SyncStatusComponent extends LitElement {

    private readonly cdi = CDI.getInstance();
    private unsubscribe: (() => void) | null = null;

    @state()
    private status: SyncStatus = {state: "idle", lastSyncedAt: null, error: null};

    @state()
    private hint: string | null = null;

    static styles = css`
        :host { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 13px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--app-color-primary, #3A6B28); }
        .dot.syncing { background: #E0A526; animation: pulse 1s ease-in-out infinite; }
        .dot.error { background: #C0392B; }
        button { font: inherit; cursor: pointer; background: transparent; border: none; color: var(--app-color-primary, #3A6B28); }
        button:disabled { opacity: 0.5; cursor: default; }
        .hint { color: #C0392B; }
        @keyframes pulse { 50% { opacity: 0.3; } }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.unsubscribe = this.cdi.getSyncCoordinator().onStatusChange((status) => {
            this.status = status;
        });
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.unsubscribe?.();
        this.unsubscribe = null;
    }

    private async syncNow(): Promise<void> {
        this.hint = null;
        try {
            await this.cdi.getSyncCoordinator().requestSync("manual");
        } catch (error) {
            this.hint = error instanceof NotAuthenticatedError ? "Bitte anmelden zum Synchronisieren." : "Synchronisierung fehlgeschlagen.";
        }
    }

    private label(): string {
        switch (this.status.state) {
            case "syncing":
                return "Synchronisiert…";
            case "error":
                return "Fehler";
            default:
                return this.status.lastSyncedAt ? `last sync ${formatLastSync(this.status.lastSyncedAt)}` : "Nur lokal";
        }
    }

    render() {
        return html`
            <span class="dot ${this.status.state}"></span>
            <span>${this.label()}</span>
            <button ?disabled="${this.status.state === "syncing"}" @click="${this.syncNow}">Sync</button>
            ${this.hint ? html`<span class="hint">${this.hint}</span>` : ""}
        `;
    }
}

export {SyncStatusComponent};
