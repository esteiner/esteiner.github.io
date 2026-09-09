import {customElement, state} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import {css, html} from "lit";
import {Router} from "@vaadin/router";
import {router} from "../router.ts";
import {CDI} from "../../cdi/CDI.ts";
import {CELLAR_UPDATED_EVENT} from "../events.ts";

@customElement('kellermeister-footer')
class KellermeisterFooter extends BaseComponent {

    private cdi: CDI = CDI.getInstance();

    /**
     * Which photo the two-step capture is waiting for. `idle` = not capturing;
     * `front` = front requested, awaiting selection; `back` = front captured,
     * awaiting the back photo. Conversion only starts once both are held.
     */
    @state()
    private capturing: 'idle' | 'front' | 'back' = 'idle';

    /** True while converting + ingesting; guards against a second concurrent run. */
    @state()
    private busy: boolean = false;

    @state()
    private error: string | null = null;

    private frontImage: Blob | null = null;

    private handleOverviewClick() {
        Router.go(router.urlForName('landing-page'));
    }

    private handleAddClick() {
        if (this.busy) {
            // A conversion/ingestion is already running; ignore re-entry.
            return;
        }
        const availability = this.cdi.getOrderConversionService().availability();
        if (!availability.available) {
            this.error = availability.reason;
            return;
        }
        // Start fresh: forget any prior front image and begin with the front photo.
        this.error = null;
        this.frontImage = null;
        this.capturing = 'front';
        this.openCapture();
    }

    private handleBackClick() {
        // User-gesture entry point for the second photo (preserves activation).
        this.error = null;
        this.openCapture();
    }

    /** Open the hidden capture input for the current step. */
    private openCapture() {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>('.capture-input');
        if (input) {
            input.value = '';
            input.click();
        }
    }

    private async handleCaptureChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) {
            // Cancelled selection: abort quietly, keep the app as it was.
            return;
        }
        if (this.capturing === 'front') {
            // Hold the front photo and wait for the user to capture the back.
            this.frontImage = file;
            this.capturing = 'back';
            return;
        }
        if (this.capturing === 'back' && this.frontImage) {
            await this.convertAndIngest(this.frontImage, file);
        }
    }

    private async convertAndIngest(front: Blob, back: Blob) {
        this.busy = true;
        this.capturing = 'idle';
        this.error = null;
        try {
            const turtle = await this.cdi.getOrderConversionService().convert(front, back);
            await this.cdi.getKellermeisterService().ingestOrderFromTurtle(turtle);
            // Reset before navigating so a later add starts clean.
            this.frontImage = null;
            this.busy = false;
            // Tell an already-mounted cellarwork page to reload its bottles:
            // navigating to the route it is already on is a no-op in the router,
            // so it would otherwise show stale contents. When we navigate to it
            // fresh (from another page) this event is simply unheard.
            window.dispatchEvent(new CustomEvent(CELLAR_UPDATED_EVENT));
            const cellarworkId = this.cdi.getKellermeisterService().getCellarWorkId();
            Router.go(router.urlForName('cellarwork-page', {cellarId: `${cellarworkId}`}));
        } catch (error) {
            console.error("kellermeister-footer: photo order failed", error);
            this.error = error instanceof Error ? error.message : String(error);
            this.frontImage = null;
            this.busy = false;
        }
    }

    private handleOrderClick() {
        Router.go(router.urlForName('order-page'));
    }

    private handleProfileClick() {
        Router.go(router.urlForName('profile-page'));
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                kellermeister-button {
                    flex: 1;
                    padding: 0;
                    font-size: 11px;
                    font-weight: 400;
                    color: var(--app-primary-on-white-background);
                    cursor: pointer;
                    text-align: center;
                    max-width: 120px;
                }

                .capture-input {
                    display: none;
                }

                .capture-banner {
                    position: fixed;
                    left: 12px;
                    right: 12px;
                    bottom: 84px;
                    background-color: rgba(255, 255, 255, 0.95);
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.10);
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    font-size: 14px;
                    z-index: 1001;
                }

                .capture-banner.error {
                    color: #b00020;
                }
            `
        ];
    }

    private renderBanner() {
        if (this.busy) {
            return html`<div class="capture-banner">Bestellung wird erstellt…</div>`;
        }
        if (this.error) {
            return html`<div class="capture-banner error">${this.error}</div>`;
        }
        if (this.capturing === 'back') {
            return html`
                <div class="capture-banner">
                    <span>Vorderseite erfasst. Jetzt die Rückseite fotografieren.</span>
                    <kellermeister-button text="Rückseite" @click="${this.handleBackClick}" icon="umbuchen" size="small"></kellermeister-button>
                </div>
            `;
        }
        return '';
    }

    render() {
        return html`
            <input class="capture-input" type="file" accept="image/*" capture="environment" @change="${this.handleCaptureChange}" />
            ${this.renderBanner()}
            <kellermeister-button text="Übersicht" @click="${this.handleOverviewClick}" icon="house" size="small"></kellermeister-button>
            <kellermeister-button text="Hinzufügen" @click="${this.handleAddClick}" icon="umbuchen" size="small"></kellermeister-button>
            <kellermeister-button text="Einkäufe" @click="${this.handleOrderClick}" icon="shopping" size="small"></kellermeister-button>
            <kellermeister-button text="Profil" @click="${this.handleProfileClick}" icon="profile" size="small"></kellermeister-button>
        `;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'kellermeister-footer': KellermeisterFooter;
    }
}
