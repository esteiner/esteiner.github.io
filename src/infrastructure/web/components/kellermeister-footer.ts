import {customElement, state} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import {css, html, render, type TemplateResult} from "lit";
import {Router} from "@vaadin/router";
import {router} from "../router.ts";
import {CDI} from "../../cdi/CDI.ts";
import {CELLAR_UPDATED_EVENT} from "../events.ts";
import type {OrderConversionDetails} from "../../../application/ports/OrderConversionService.ts";

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

    /**
     * Where the two images come from, chosen once per add and applied to both.
     * `null` while the source chooser (Kamera / Datei) is shown.
     */
    @state()
    private source: 'camera' | 'file' | null = null;

    /** True while the in-app camera preview is shown (camera source only). */
    @state()
    private cameraActive: boolean = false;

    /** True while the details dialog (Ort/Preis) is shown, after both photos. */
    @state()
    private detailsOpen: boolean = false;

    private frontImage: Blob | null = null;

    /** Both captured photos, held while the details dialog is open. */
    private pendingFront: Blob | null = null;
    private pendingBack: Blob | null = null;

    /** Live camera stream, held while `cameraActive`; released by stopCamera(). */
    private stream: MediaStream | null = null;

    /**
     * Host for the source-chooser modal, portaled to <body>. The footer host has
     * a backdrop-filter, which would trap a position:fixed overlay inside the
     * footer's box; rendering into <body> lets the modal cover the viewport and
     * be centered, matching the cellar-delete dialog.
     */
    private dialogPortal: HTMLDivElement | null = null;

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
        // Start fresh: forget any prior image/source and show the source chooser.
        // No capture opens yet — the user first picks Kamera or Datei.
        this.error = null;
        this.frontImage = null;
        this.source = null;
        this.capturing = 'front';
    }

    private handleSourceClick(source: 'camera' | 'file') {
        // User-gesture entry point for the front image: pick the source, then
        // start capturing immediately (preserves transient activation).
        this.error = null;
        this.source = source;
        if (source === 'camera') {
            this.startCamera();
        } else {
            this.openCapture();
        }
    }

    private handleBackClick() {
        // User-gesture entry point for the second image from a file (preserves activation).
        this.error = null;
        this.openCapture();
    }

    private handleAddCancel() {
        // Dismiss the source chooser and abort the add.
        this.resetCapture();
    }

    /** Open the hidden file picker (file source only). */
    private openCapture() {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>('.capture-input-file');
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
            // Hold the front image and wait for the user to provide the back.
            this.frontImage = file;
            this.capturing = 'back';
            return;
        }
        if (this.capturing === 'back' && this.frontImage) {
            this.openDetails(this.frontImage, file);
        }
    }

    // --- Camera source: activate the device camera and capture real photos ---

    private async startCamera() {
        try {
            // Activate the real device camera (prefer the rear one). This takes
            // an actual photo from the stream on shutter — unlike an <input
            // capture>, which only opens the OS camera on some mobile browsers.
            this.stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
            this.cameraActive = true;
        } catch (error) {
            this.error = `Kamera nicht verfügbar: ${error instanceof Error ? error.message : String(error)}`;
            this.stopCamera();
            this.resetCapture();
        }
    }

    /** Bind the live stream to the video element and sync the portaled dialog. */
    updated() {
        const video = this.shadowRoot?.querySelector<HTMLVideoElement>('.camera-video');
        if (video && this.stream && video.srcObject !== this.stream) {
            video.srcObject = this.stream;
        }
        this.updatePortal();
    }

    /** Show/hide the portaled modals (source chooser, then details) in <body>. */
    private updatePortal() {
        const showChooser = this.capturing === 'front' && this.source === null && !this.busy && !this.error;
        const showDetails = this.detailsOpen && !this.busy && !this.error;
        const dialog = showChooser
            ? this.renderSourceDialog()
            : showDetails
                ? this.renderDetailsDialog()
                : null;
        if (dialog) {
            if (!this.dialogPortal) {
                this.dialogPortal = document.createElement('div');
                document.body.appendChild(this.dialogPortal);
            }
            // `host: this` binds event listeners' `this` to the component (the
            // standalone render() sets no host by default).
            render(dialog, this.dialogPortal, {host: this});
        } else {
            this.removePortal();
        }
    }

    private removePortal() {
        if (this.dialogPortal) {
            render(null, this.dialogPortal);
            this.dialogPortal.remove();
            this.dialogPortal = null;
        }
    }

    private async handleShutter() {
        const blob = await this.captureFrame();
        if (!blob) {
            this.error = 'Aufnahme fehlgeschlagen.';
            return;
        }
        if (this.capturing === 'front') {
            // Hold the front photo; keep the camera running for the back.
            this.frontImage = blob;
            this.capturing = 'back';
            return;
        }
        if (this.capturing === 'back' && this.frontImage) {
            this.stopCamera();
            this.openDetails(this.frontImage, blob);
        }
    }

    private handleCameraCancel() {
        // Abort quietly: release the camera and return to the idle state.
        this.stopCamera();
        this.resetCapture();
    }

    /** Grab the current video frame as a JPEG blob. */
    private async captureFrame(): Promise<Blob | null> {
        const video = this.shadowRoot?.querySelector<HTMLVideoElement>('.camera-video');
        if (!video || !video.videoWidth || !video.videoHeight) {
            return null;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    }

    /** Stop and release the camera stream (no track left running). */
    private stopCamera() {
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.cameraActive = false;
    }

    private resetCapture() {
        this.capturing = 'idle';
        this.source = null;
        this.frontImage = null;
        this.detailsOpen = false;
        this.pendingFront = null;
        this.pendingBack = null;
    }

    // --- Details step: collect optional Ort/Preis before sending to the API ---

    /** Both photos are captured; hold them and ask for optional details. */
    private openDetails(front: Blob, back: Blob) {
        this.pendingFront = front;
        this.pendingBack = back;
        this.capturing = 'idle';
        this.detailsOpen = true;
    }

    private async handleDetailsSend() {
        const front = this.pendingFront;
        const back = this.pendingBack;
        if (!front || !back) {
            return;
        }
        const read = (selector: string) =>
            this.dialogPortal?.querySelector<HTMLInputElement>(selector)?.value.trim() || undefined;
        const readInteger = (selector: string) => {
            const value = this.dialogPortal?.querySelector<HTMLInputElement>(selector)?.valueAsNumber;
            return value !== undefined && Number.isInteger(value) ? value : undefined;
        };
        const details = {
            place: read('.details-place'),
            price: readInteger('.details-price'),
            priceCurrency: read('.details-price-currency'),
            quantity: readInteger('.details-quantity'),
        };
        // Close the dialog and clear the stash before converting.
        this.detailsOpen = false;
        this.pendingFront = null;
        this.pendingBack = null;
        await this.convertAndIngest(front, back, details);
    }

    private handleDetailsCancel() {
        // Abort the add without sending anything.
        this.resetCapture();
    }

    disconnectedCallback() {
        this.stopCamera();
        this.removePortal();
        super.disconnectedCallback();
    }

    /**
     * The source chooser as a modal dialog styled like the cellar-delete dialog
     * (see profile-page). Rendered into a <body> portal (light DOM), so the
     * styles are inlined and scoped under `.km-source-dialog` to avoid leaking.
     */
    private renderSourceDialog(): TemplateResult {
        return html`
            ${this.dialogStyles()}
            <div class="km-source-dialog">
                <div class="dialog-overlay" @click="${this.handleAddCancel}">
                    <div class="dialog" role="dialog" aria-modal="true" aria-label="Quelle wählen" @click="${(e: Event) => e.stopPropagation()}">
                        <h2>Quelle wählen</h2>
                        <p>Wie möchtest du das Foto der Flasche hinzufügen?</p>
                        <div class="dialog-actions">
                            <button class="dialog-btn dialog-btn-cancel" @click="${this.handleAddCancel}">Abbrechen</button>
                            <button class="dialog-btn dialog-btn-ok" @click="${() => this.handleSourceClick('file')}">Datei</button>
                            <button class="dialog-btn dialog-btn-ok" @click="${() => this.handleSourceClick('camera')}">Kamera</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * The details dialog (optional Ort/Preis), shown after both photos and before
     * the conversion request. Same look as the source dialog; inputs are read
     * from the DOM on Senden (no value binding), so re-renders never clobber them.
     */
    private renderDetailsDialog(): TemplateResult {
        return html`
            ${this.dialogStyles()}
            <div class="km-source-dialog">
                <div class="dialog-overlay" @click="${this.handleDetailsCancel}">
                    <div class="dialog" role="dialog" aria-modal="true" aria-label="Angaben" @click="${(e: Event) => e.stopPropagation()}">
                        <h2>Flasche hinzufügen</h2>
                        <p>Optionale Angaben zur Flasche.</p>
                        <label class="dialog-field">
                            <span>Ort (gekauft/getrunken)</span>
                            <input class="dialog-input details-place" type="text" />
                        </label>
                        <div class="dialog-field-inline">
                            <label class="dialog-field details-price-field">
                                <span>Preis</span>
                                <input class="dialog-input details-price" type="number" inputmode="numeric" min="0" step="1" />
                            </label>
                            <label class="dialog-field details-currency-field">
                                <span>Währung</span>
                                <input class="dialog-input details-price-currency" type="text" />
                            </label>
                        </div>
                        <div class="dialog-field-inline">
                            <label class="dialog-field details-price-field">
                                <span>Anzahl</span>
                                <input class="dialog-input details-quantity" type="number" inputmode="numeric" min="0" step="1" value="1" />
                            </label>
                            <span class="details-currency-field" aria-hidden="true"></span>
                        </div>
                        <div class="dialog-actions">
                            <button class="dialog-btn dialog-btn-cancel" @click="${this.handleDetailsCancel}">Abbrechen</button>
                            <button class="dialog-btn dialog-btn-ok" @click="${this.handleDetailsSend}">Senden</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /** Shared styles for the portaled dialogs (source chooser and details). */
    private dialogStyles(): TemplateResult {
        return html`
            <style>
                .km-source-dialog .dialog-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(26, 25, 23, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(4px);
                }
                .km-source-dialog .dialog {
                    background: var(--km-surface, #fff);
                    border-radius: 16px;
                    border: 1px solid var(--km-border, #E4DFD7);
                    box-shadow: 0 20px 60px rgba(26, 25, 23, 0.15);
                    padding: 32px 28px 24px;
                    width: min(440px, 92vw);
                    color: var(--km-text, #1A1917);
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .km-source-dialog .dialog h2 {
                    font-family: var(--app-font-family-display, Georgia, serif);
                    font-size: 22px;
                    font-weight: 500;
                    font-style: italic;
                    color: var(--app-color-primary, #3A6B28);
                    margin: 0;
                    letter-spacing: 0.01em;
                }
                .km-source-dialog .dialog p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--km-text-muted, #8A8278);
                    line-height: 1.6;
                }
                .km-source-dialog .dialog-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 13px;
                    color: var(--km-text-muted, #8A8278);
                }
                .km-source-dialog .dialog-input {
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--km-border, #E4DFD7);
                    background: var(--km-bg, #F7F5F1);
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 15px;
                    color: var(--km-text, #1A1917);
                    min-width: 0;
                }
                /* Price + currency share one row (each its own labelled column):
                   price grows, currency is narrower. */
                .km-source-dialog .dialog-field-inline {
                    display: flex;
                    gap: 10px;
                }
                .km-source-dialog .dialog-field-inline .details-price-field {
                    flex: 1 1 auto;
                }
                .km-source-dialog .dialog-field-inline .details-currency-field {
                    flex: 0 0 110px;
                }
                .km-source-dialog .dialog-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 4px;
                }
                .km-source-dialog .dialog-btn {
                    padding: 10px 22px;
                    border-radius: 8px;
                    border: none;
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: opacity 0.2s ease, transform 0.1s ease;
                    letter-spacing: 0.02em;
                }
                .km-source-dialog .dialog-btn:active {
                    transform: scale(0.97);
                }
                .km-source-dialog .dialog-btn-cancel {
                    background: var(--km-bg, #F7F5F1);
                    color: var(--km-text-muted, #8A8278);
                    border: 1px solid var(--km-border, #E4DFD7);
                }
                .km-source-dialog .dialog-btn-ok {
                    background: var(--app-color-primary, #3A6B28);
                    color: #fff;
                }
                .km-source-dialog .dialog-btn-ok:hover {
                    opacity: 0.85;
                }
            </style>
        `;
    }

    private async convertAndIngest(front: Blob, back: Blob, details?: OrderConversionDetails) {
        this.busy = true;
        this.capturing = 'idle';
        this.source = null;
        this.error = null;
        try {
            const turtle = await this.cdi.getOrderConversionService().convert(front, back, details);
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

                .capture-input-file {
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

                /*
                 * Anchored above the footer (not inset:0) on purpose: the footer
                 * host has a backdrop-filter, which makes it the containing block
                 * for position:fixed descendants — a full-screen inset:0 overlay
                 * would be clipped to the footer's box. Bottom-anchoring keeps the
                 * preview and its controls on screen and reachable.
                 */
                .camera-overlay {
                    position: fixed;
                    left: 12px;
                    right: 12px;
                    bottom: 84px;
                    background: rgba(0, 0, 0, 0.9);
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    max-height: 70vh;
                }

                .camera-video {
                    width: 100%;
                    max-height: 50vh;
                    border-radius: 12px;
                    background: #000;
                    object-fit: contain;
                }

                .camera-label {
                    color: white;
                    font-size: 15px;
                }

                .camera-controls {
                    display: flex;
                    gap: 16px;
                    width: 100%;
                    justify-content: center;
                    padding-bottom: 4px;
                }

                .camera-btn {
                    flex: 1 1 0;
                    max-width: 220px;
                    min-height: 48px;
                    padding: 14px 24px;
                    border-radius: 10px;
                    border: none;
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s ease, transform 0.1s ease;
                    letter-spacing: 0.02em;
                }

                .camera-btn:active {
                    transform: scale(0.97);
                }

                .camera-btn-primary {
                    background: var(--app-color-primary, #3A6B28);
                    color: #fff;
                }

                .camera-btn-primary:hover {
                    opacity: 0.85;
                }

                /* Pale tint for the front photo (the back uses the standard green).
                   Text colour matches the secondary/Abbrechen button. */
                .camera-btn-primary-light {
                    background: #f9f9e8;
                    color: var(--km-text, #1A1917);
                }

                .camera-btn-primary-light:hover {
                    opacity: 0.85;
                }

                .camera-btn-secondary {
                    background: var(--km-surface, #fff);
                    color: var(--km-text, #1A1917);
                    border: 1px solid var(--km-border, #E4DFD7);
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
        // The source chooser (front && no source yet) is a modal dialog portaled
        // to <body> — see updatePortal() — not a banner, so it is not rendered here.
        if (this.capturing === 'back' && this.source === 'file') {
            return html`
                <div class="capture-banner">
                    <span>Vorderseite erfasst. Jetzt die Rückseite auswählen.</span>
                    <kellermeister-button text="Rückseite" @click="${this.handleBackClick}" icon="umbuchen" size="small"></kellermeister-button>
                </div>
            `;
        }
        return '';
    }

    private renderCamera() {
        if (!this.cameraActive) {
            return '';
        }
        const label = this.capturing === 'back' ? 'Rückseite' : 'Vorderseite';
        // The shutter names the step it captures and is lighter green for the
        // front photo, then the standard green for the back photo.
        const shutterLabel = this.capturing === 'back' ? 'Rückseite aufnehmen' : 'Vorderseite aufnehmen';
        const shutterClass = this.capturing === 'back' ? 'camera-btn-primary' : 'camera-btn-primary-light';
        return html`
            <div class="camera-overlay">
                <span class="camera-label">${label}</span>
                <video class="camera-video" autoplay playsinline muted></video>
                <div class="camera-controls">
                    <button class="camera-btn camera-btn-secondary" @click="${this.handleCameraCancel}">Abbrechen</button>
                    <button class="camera-btn ${shutterClass}" @click="${this.handleShutter}">${shutterLabel}</button>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <input class="capture-input-file" type="file" accept="image/*" @change="${this.handleCaptureChange}" />
            ${this.renderBanner()}
            ${this.renderCamera()}
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
