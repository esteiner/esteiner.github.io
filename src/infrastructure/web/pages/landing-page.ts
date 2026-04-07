import {css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Task} from '@lit/task';
import {Router} from "@vaadin/router";
import {EVENTS, getDefaultSession, Session} from "@inrupt/solid-client-authn-browser";
import {router} from "../router.ts";
import {BasePage} from "../common/base-page.ts";
import {CDI} from "../../cdi/CDI.ts";
import type {WebIDProfile} from "../../../domain/Solid/WebIDProfile.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-header.ts';
import '../components/kellermeister-footer.ts';
import {getBuildVersion} from "../utils";
import {Cellar} from "../../../domain/Cellar/Cellar.ts";

@customElement('landing-page')
class LandingPage extends BasePage {

    @property()
    session: Session = getDefaultSession();

    @property()
    isLoggedIn: boolean = this.session.info.isLoggedIn;

    @state()
    private showWebIdDialog: boolean = false;

    @state()
    private webIdInput: string = '';

    @state()
    private webIdSelected: string = '__new__';

    @state()
    private webIdHistory: string[] = [];

    @state()
    private webIdError: string = '';

    @state()
    private webIdLoading: boolean = false;

    @state()
    private showImageLightbox: boolean = false;

    private _webIdResolve: ((profile: WebIDProfile | null) => void) | null = null;

    private static readonly WEBID_HISTORY_KEY = 'kellermeister_webid_history';

    private loadWebIdHistory(): string[] {
        try {
            const stored = localStorage.getItem(LandingPage.WEBID_HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private saveWebIdToHistory(webId: string) {
        const history = this.loadWebIdHistory().filter(id => id !== webId);
        history.unshift(webId);
        localStorage.setItem(LandingPage.WEBID_HISTORY_KEY, JSON.stringify(history));
    }

    private cdi: CDI = CDI.getInstance();

    private _cellarsTask = new Task(this, async () => {
        return await this.cdi.getKellermeisterService().getCellars();
    });

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        console.log("connectedCallback: logged in", this.isLoggedIn);

        this.session.events.on(EVENTS.LOGIN, () => {
            console.log("connectedCallback: on EVENTS.LOGIN");
            this.sessionChangedCallback(getDefaultSession());
        });
        this.session.events.on(EVENTS.SESSION_RESTORED, () => {
            console.log("connectedCallback: on EVENTS.SESSION_RESTORED");
            this.sessionChangedCallback(getDefaultSession());
        });
        this.session.events.on(EVENTS.LOGOUT, () => {
            console.log("connectedCallback: on EVENTS.LOGOUT");
            this.sessionChangedCallback(getDefaultSession());
        });
        this.loadCellars();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    async sessionChangedCallback(session: Session) {
        if (session.info.isLoggedIn && session.info.webId != null) {
            console.log("sessionChangedCallback: fetched user session with WebId:", session.info.webId);
            const webIDProfile: WebIDProfile | null = await this.cdi.getSolidService().getWebIDProfile(new URL(session.info.webId));
            if (webIDProfile) {
                if (webIDProfile.getStorageUrls().length === 1) {
                    this.session = session;
                    this.isLoggedIn = session.info.isLoggedIn;
                    this.cdi.setStorageUrl(webIDProfile.getStorageUrls()[0]);
                    await this.cdi.getSolidPodService().setupPodForKellermeister();
                    this.loadCellars();
                }
                else if (webIDProfile.getIssuerUrls().length === 0) {
                    alert("Das WebID Profil enthält keine Storage URL.");
                    this.cdi.getSolidService().logout();
                } else {
                    alert("Das WebID Profil enthält mehrere Storage URLs: " + webIDProfile.getStorageUrls());
                    this.cdi.getSolidService().logout();
                }
             } else {
                console.log("sessionChangedCallback: failed to find storage");
                alert("No storage found in Pod, you will not be able to store any data.");
                this.cdi.getSolidService().logout();
                Router.go(router.urlForName('landing-page'));
            }
        } else {
            this.isLoggedIn = false;
            console.log("sessionChangedCallback: logout");
            Router.go(router.urlForName('landing-page'));
        }
    }

    loadCellars() {
        if (this.isLoggedIn) {
            this._cellarsTask.run();
        }
    }

    render() {
        return html`
            ${this.showImageLightbox ? html`
                <div class="lightbox-overlay" @click="${() => this.showImageLightbox = false}">
                    <img class="lightbox-img" src="/Prozess_Foto.png" />
                </div>
            ` : ''}
            ${this.showWebIdDialog ? html`
                <div class="dialog-overlay" @click="${this.handleWebIdCancel}">
                    <div class="dialog" role="dialog" aria-modal="true" aria-label="WebID eingeben" @click="${(e: Event) => e.stopPropagation()}">
                        <h2>WebID eingeben</h2>
                        <p>Bitte gib deine WebID ein, um dich anzumelden.</p>
                        ${this.webIdHistory.length > 0 ? html`
                            <select
                                class="dialog-select"
                                .value="${this.webIdSelected}"
                                @change="${(e: Event) => this.webIdSelected = (e.target as HTMLSelectElement).value}"
                                ?disabled="${this.webIdLoading}"
                            >
                                ${this.webIdHistory.map(id => html`<option value="${id}">${id}</option>`)}
                                <option value="__new__">— Neue WebID eingeben —</option>
                            </select>
                        ` : ''}
                        ${this.webIdSelected === '__new__' ? html`
                            <input
                                class="dialog-input"
                                type="url"
                                .value="${this.webIdInput}"
                                @input="${(e: InputEvent) => this.webIdInput = (e.target as HTMLInputElement).value}"
                                @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this.handleWebIdOk()}"
                                placeholder="z.B. https://mypod.example/profile/card#me"
                                ?disabled="${this.webIdLoading}"
                                ?autofocus="${this.webIdHistory.length === 0}"
                            />
                        ` : ''}
                        ${this.webIdError ? html`<p class="dialog-error">${this.webIdError}</p>` : ''}
                        <div class="dialog-actions">
                            <button class="dialog-btn dialog-btn-cancel" @click="${this.handleWebIdCancel}" ?disabled="${this.webIdLoading}">Abbrechen</button>
                            <button class="dialog-btn dialog-btn-ok" @click="${this.handleWebIdOk}" ?disabled="${this.webIdLoading}">
                                ${this.webIdLoading ? 'Prüfe...' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${this.session.info.isLoggedIn ? html`
                <kellermeister-header>Kellermeister
                    <kellermeister-button icon="plus" ghost text="neuer Keller" @click="${this.handleNewCellarClick}" slot="actions" data-testid="new-cellar-button" size="small"></kellermeister-button>
                </kellermeister-header>
                <main>
                    <div class="cellar-grid">
                        ${this._cellarsTask.render({
                            pending: () => html`<div class="spinner"></div>`,
                            complete: (cellars) => html`${cellars.map(cellar => html`
                                <kellermeister-button text="${this.cellarName(cellar)}" @click="${() => this.handleCellarClick(cellar.id)}" ghost icon="${this.cellarIconName(cellar.id)}"></kellermeister-button>
                            `)}`,
                        })}
                    </div>
                </main>
                <kellermeister-footer></kellermeister-footer>
            `
            : html`
                <header>
                    <h1 data-testid="page-title">Willkommen beim Kellermeister</h1>
                </header>
                <main class="content">
                    <div class="login-cta">
                        <kellermeister-button ghost icon="cellars" text="Anmelden" @click="${this.handleLoginClick}" data-testid="cellars-button" size="large"></kellermeister-button>
                        <span class="login-cta-label">Deine Keller(t)räume betreten</span>
                    </div>
                    <section class="intro">
                        <p>Mit unserer Kellermeister App kannst du deine Weine in einem oder mehreren Kellern organisieren.
                            Hast du nur einen Kühlschrank? Kein Problem, auch dieser lässt sich organisieren und du kannst jederzeit auf <em>Altglas</em> nachschauen, welche Weine du im Laufe der Zeit getrunken hast.</p>

                        <details>
                            <summary>Wie funktioniert die Kellermeister App?</summary>
                            <p>Anhand deiner Weinrechnung oder eines Fotos der Weinetikette werden die für uns wichtigen Weindaten erfasst. Neue Weine findest du in <em>Kellerarbeit</em>, hier kannst du deine Weine einem Keller oder direkt deinem Kühlschrank zuweisen. Falls du sehr schnell beim Trinken warst oder den Wein verschenkt hast, kannst du ihn auch direkt in das <em>Altglas</em> umbuchen.</p>
                            <img class="gif-responsive" src="/Weine-einbuchen.gif"/>
                        </details>
                        <details>
                            <summary>Willst du ein neuer Kellermeister werden?</summary>
                            <p>Dann erstelle dir einen <a href="https://solidproject.org/for_users" target="_blank">Solid Pod</a>. Damit bekommst du eine WebID, mit welcher du dich anmelden kannst.
                                Anschliessend schreib an <a href="mailto:info@kellermeister.ch">info@kellermeister.ch</a> um deinen Weineingang zu konfigurieren.</p>
                        </details>
                        <details>
                            <summary>Wie kann ich die Weine aus einer Rechnung übernehmen?</summary>
                            <p>Leite dein Email mit deiner Weinrechnung an <a href="mailto:kellerknecht@kellermeister.ch">kellerknecht@kellermeister.ch</a>.
                                Unser Agent verarbeitet sie und reichert fehlende Informationen an.</p>
                        </details>
                        <details>
                            <summary>Wie kann ich einen Wein anhand eines Fotos übernehmen?</summary>
                            <p>Sende das Foto des Etiketts (mit Vorder- und falls vorhandener Rückseite) an <a href="mailto:kellerknecht@kellermeister.ch">kellerknecht@kellermeister.ch</a>.
                                Optional kannst du im Betreff Ort und Preis angeben, z. B. <em>Restaurant Maihöffli Luzern: 95.50 CHF</em>.</p>
                            <img class="process-img" src="/Prozess_Foto.png" @click="${() => this.showImageLightbox = true}" />
                        </details>
                        <details>
                            <summary>Lust deinen gesamten Weinkeller zu erfassen?</summary>
                            <p>Erstelle ein Email mit einer Tabelle: Hersteller, Weinname, Jahrgang, Weinart, Preis, Anzahl, Flaschengrösse — z. B. <em>Larmandier-Bernier, Vertus, 2012, Schaumwein, 99, 1, 750</em> und sende es an <a href="mailto:kellerknecht@kellermeister.ch">kellerknecht@kellermeister.ch</a>.</p>
                        </details>

                        <details>
                            <summary>Kann ich die Kellermeister App weitergeben?</summary>
                            <p>Ja, sehr gerne!<br>Hier ist der QR-Code für <a href="https://kellermeister.ch">https://kellermeister.ch</a></p>
                            <img src="/Kellermeister_QR-Code.png"/>
                        </details>

                        <p>Noch weitere Fragen? Melde dich bei <a href="mailto:info@kellermeister.ch">info@kellermeister.ch</a></p>
                    </section>
                </main>
                <div class="version-info">
                    <span class="version-label">Version</span>
                    <span class="version-number">${getBuildVersion()}</span>
                </div>
            `
            }
        `
    }

    private async handleLoginClick() {
        console.log("handleLoginClick: seesion info is logged in:", getDefaultSession().info.isLoggedIn);
        if (getDefaultSession().info.isLoggedIn) {
            this.session = getDefaultSession();
            return;
        }
        const webIDProfile: WebIDProfile | null = await this.getWebID();
        console.log("webIDProfile:", webIDProfile);
        if (webIDProfile) {
            this.cdi.getSolidService().login(webIDProfile.getIssuerUrls()[0]);
            //performLogin(webIDProfile.getIssuerUrls()[0].toString());
        }
    }

    private getWebID(): Promise<WebIDProfile | null> {
        this.webIdHistory = this.loadWebIdHistory();
        this.webIdSelected = this.webIdHistory.length > 0 ? this.webIdHistory[0] : '__new__';
        this.webIdInput = '';
        this.webIdError = '';
        this.webIdLoading = false;
        this.showWebIdDialog = true;
        return new Promise((resolve) => {
            this._webIdResolve = resolve;
        });
    }

    private async handleWebIdOk() {
        const input = (this.webIdSelected === '__new__' ? this.webIdInput : this.webIdSelected).trim();
        if (!input) {
            this.webIdError = 'Bitte gib deine WebID ein.';
            return;
        }
        this.webIdLoading = true;
        this.webIdError = '';
        try {
            const webID = new URL(input);
            const profile = await this.cdi.getSolidService().getWebIDProfile(webID);
            if (profile) {
                this.saveWebIdToHistory(input);
                this.showWebIdDialog = false;
                this._webIdResolve?.(profile);
                this._webIdResolve = null;
            } else {
                this.webIdError = `Kein WebID Profil Dokument gefunden. Ist "${input}" wirklich deine WebID?`;
            }
        } catch (e) {
            if (e instanceof TypeError) {
                this.webIdError = 'Ungültige URL. Bitte gib eine gültige WebID ein.';
            } else {
                this.webIdError = `Fehler beim Laden des WebID Profils.`;
            }
            console.log("handleWebIdOk: failed with error:", e);
        } finally {
            this.webIdLoading = false;
        }
    }

    private cellarIconName(cellarId: string): string {
        if (cellarId === this.cdi?.getKellermeisterService().getCellarWorkId()) {
            return "work";
        } else if (cellarId === this.cdi?.getKellermeisterService().getAltglassId()) {
            return "trash";
        } else {
            return "cellar";
        }
    }

    private cellarName(cellar: Cellar): string {
        if (cellar.id === this.cdi?.getKellermeisterService().getCellarWorkId()) {
            return "Kellerarbeit";
        } else {
            return cellar.name as string;
        }
    }

    private handleWebIdCancel() {
        this.showWebIdDialog = false;
        this._webIdResolve?.(null);
        this._webIdResolve = null;
    }

    private async handleCellarClick(cellarId: string) {
        if (cellarId.endsWith("cellarWork#it")) {
            Router.go(router.urlForName('cellarwork-page', {cellarId: `${this.cdi?.getKellermeisterService().getCellarWorkId()}`}));
        } else {
            Router.go(router.urlForName('cellar-page', {cellarId: cellarId}));
        }
    }

    private async handleNewCellarClick() {
        const name: string | null = prompt("Name des neuen Kellers", "Keller" + ((this._cellarsTask.value?.length ?? 0) - 1));
        if (name) {
            await this.cdi.getKellermeisterService().createCellar(name);
            this.loadCellars();
        }
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                header {
                    display: contents;
                }

                h1 {
                    position: fixed;
                    top: 10px;
                    left: 12px;
                    right: 12px;
                    height: 64px;
                    background-color: var(--km-bg);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: var(--app-color-primary, #3A6B28);
                    font-family: var(--app-font-family-display);
                    font-style: italic;
                    font-size: 30px;
                    font-weight: 500;
                    z-index: 1000;
                }

                /* Spinner */
                .spinner {
                    width: 28px;
                    height: 28px;
                    border: 3px solid var(--km-border, #E4DFD7);
                    border-top-color: var(--app-color-primary, #3A6B28);
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Cellar grid layout (logged in) */
                .cellar-grid {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    padding: 24px 20px;
                }

                /* Login CTA section */
                .login-cta {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 32px 20px 20px;
                    gap: 8px;
                }

                .login-cta-label {
                    font-size: 13px;
                    font-weight: 500;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: var(--km-text-muted, #8A8278);
                }

                /* Intro section */
                .intro {
                    padding: 8px 20px 24px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .intro p {
                    font-size: 15px;
                    line-height: 1.75;
                    color: var(--app-primary-on-white-background, #8A8278);
                    margin-bottom: 20px;
                }

                .intro em {
                    font-style: italic;
                    color: var(--app-color-primary, #3A6B28);
                }

                .intro a {
                    color: var(--app-color-primary, #3A6B28);
                    font-weight: bold;
                    text-decoration: none;
                    border-bottom: 1px solid var(--km-border, #E4DFD7);
                }

                details {
                    border-top: 1px solid var(--km-border, #E4DFD7);
                    padding: 0;
                }

                details:last-of-type {
                    border-bottom: 1px solid var(--km-border, #E4DFD7);
                    margin-bottom: 20px;
                }

                summary {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--app-primary-on-white-background, #1A1917);
                    padding: 14px 4px;
                    cursor: pointer;
                    list-style: none;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    letter-spacing: 0.01em;
                }

                summary::after {
                    content: '+';
                    font-size: 18px;
                    font-weight: 300;
                    color: var(--km-text-muted, #8A8278);
                    transition: transform 0.2s ease;
                }

                details[open] summary::after {
                    transform: rotate(45deg);
                }

                details p {
                    padding: 0 4px 16px;
                    font-size: 14px;
                    line-height: 1.75;
                    color: var(--km-text-muted, #8A8278);
                }

                /* Dialog */
                .dialog-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(26, 25, 23, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(4px);
                }

                .dialog {
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

                .dialog h2 {
                    font-family: var(--app-font-family-display, Georgia, serif);
                    font-size: 22px;
                    font-weight: 500;
                    font-style: italic;
                    color: var(--app-color-primary, #3A6B28);
                    margin: 0;
                    letter-spacing: 0.01em;
                }

                .dialog p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--km-text-muted, #8A8278);
                    line-height: 1.6;
                }

                .dialog-select,
                .dialog-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 11px 14px;
                    border-radius: 8px;
                    border: 1.5px solid var(--km-border, #E4DFD7);
                    background: var(--km-bg, #F7F5F1);
                    color: var(--km-text, #1A1917);
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s ease;
                }

                .dialog-select:focus,
                .dialog-input:focus {
                    border-color: var(--app-color-primary, #3A6B28);
                }

                .dialog-select:disabled,
                .dialog-input:disabled {
                    opacity: 0.5;
                }

                .dialog-error {
                    margin: 0;
                    font-size: 13px;
                    color: #b91c1c;
                }

                .dialog-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 4px;
                }

                .dialog-btn {
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

                .dialog-btn:active {
                    transform: scale(0.97);
                }

                .dialog-btn:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }

                .dialog-btn-cancel {
                    background: var(--km-bg, #F7F5F1);
                    color: var(--km-text-muted, #8A8278);
                    border: 1px solid var(--km-border, #E4DFD7);
                }

                .dialog-btn-ok {
                    background: var(--app-color-primary, #3A6B28);
                    color: #fff;
                }

                .dialog-btn-ok:hover:not(:disabled) {
                    opacity: 0.85;
                }

                /* Version info */
                .version-info {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 20px;
                    color: var(--km-text-muted, #8A8278);
                }

                .version-label {
                    font-size: 11px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .version-number {
                    font-family: var(--app-font-family-monospace);
                    font-size: 11px;
                    opacity: 0.7;
                }

                /* Process image thumbnail */
                .process-img {
                    display: block;
                    max-width: 100%;
                    width: 100%;
                    border-radius: 8px;
                    margin-top: 10px;
                    cursor: zoom-in;
                    transition: opacity 0.15s ease;
                }

                .process-img:hover {
                    opacity: 0.85;
                }

                /* Lightbox overlay */
                .lightbox-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(26, 25, 23, 0.88);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: zoom-out;
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                }

                .lightbox-img {
                    max-width: 95vw;
                    max-height: 95vh;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
                }

                .gif-responsive {
                    width: 100%;
                    max-width: 430px;
                    height: auto;
                }
            `
        ];
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'landing-page': LandingPage;
    }
}