import {css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Router} from "@vaadin/router";
import {EVENTS, getDefaultSession, Session} from "@inrupt/solid-client-authn-browser";
import {router} from "../router.ts";
import {BasePage} from "../common/base-page.ts";
import {Cellar} from "../../../domain/Cellar/Cellar.ts";
import {Order} from "../../../domain/Order/Order.ts";
import {CDI} from "../../cdi/CDI.ts";
import type {WebIDProfile} from "../../../domain/Solid/WebIDProfile.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-header.ts';
import '../components/kellermeister-footer.ts';

@customElement('landing-page')
class LandingPage extends BasePage {

    @property()
    session: Session = getDefaultSession();

    @property()
    isLoggedIn: boolean = this.session.info.isLoggedIn;

    @state()
    cellars: Cellar[];

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

    constructor() {
        super();
        this.cellars = new Array<Order>;
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

    async loadCellars() {
        if (this.isLoggedIn) {
            this.cellars = await this.cdi.getKellermeisterService().getAllCellars();
        }
    }

    render() {
        return html`
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
                    <kellermeister-button @click="${this.handleLogoutClick}" slot="actions" text="Logout" icon="logout" class="header-btn" size="small"></kellermeister-button>
                </kellermeister-header>
                <main class="content">
                    <div>
                        ${this.cellars.map(
                                cellar =>
                                        html`
                                            <a href="${router.urlForName('cellar-page', {cellarId: `${cellar.id}`})}">
                                                <kellermeister-button ghost icon="wine-shelf" text="${cellar.name}"></kellermeister-button>
                                            </a>
                                        `
                        )}
                        <kellermeister-button ghost icon="plus" text="neuer Keller" @click="${this.handleNewCellarClick}" data-testid="new-cellar-button"></kellermeister-button>
                        <kellermeister-button ghost icon="work" text="Kellerarbeit" @click="${this.handleCellarWorkClick}"></kellermeister-button>
                        <a href="${router.urlForName('cellar-page', {cellarId: `${this.cdi?.getKellermeisterService().getAltglassId()}`})}">
                            <kellermeister-button ghost icon="trash" text="Altglass"></kellermeister-button>
                        </a>
                    </div>
                </main>
                <kellermeister-footer></kellermeister-footer>
            `
            : html`
                <main>
                    <h1 data-testid="page-title">Willkommen beim Kellermeister</h1>
                    <div>
                        <kellermeister-button ghost icon="house" text="Deine Kellerräume betreten" @click="${this.handleLoginClick}" data-testid="cellars-button"></kellermeister-button>
                    </div>
                    <div>
                        <p>Mit unserer Kellermeister App kannst du deine Weine in einem oder mehreren Kellern organisieren.
                            Hast du nur einen Kühlschrank? Kein Problem, auch dieser lässt sich organisieren und du kannst jederzeit auf Altglas nachschauen, welche Weine du im Laufe der Zeit ausgetrunken hast.</p>
                    </div>
                    <div>
                        <p>Anhand deiner Weinrechnung werden die für uns wichtigen Weindaten angereichert. Neue Weine findest du in Kellerarbeit, hier kannst du deine Weine einem Keller oder direkt deinem Kühlschrank zuweisen. Falls du sehr schnell beim Trinken warst oder den Wein verschenkt hast, kannst du ihn auch direkt in das Altglas buchen.
                            Altglas hat den Vorteil, dass du eine Übersicht über alle deine von dir gekauften Weine hast.
                        </p>
                    </div>
                    <div>
                        <p>Willst du ein neuer Kellermeister werden? Dann erstelle dir einen SOLID Pod. Bei der Neuregistrierung der App kannst du den Link deines Pods eingeben.
                        </p>
                    </div>
                </main>
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

    private handleWebIdCancel() {
        this.showWebIdDialog = false;
        this._webIdResolve?.(null);
        this._webIdResolve = null;
    }

    private async handleNewCellarClick() {
        const name: string | null = prompt("Name des neuen Kellers", "Keller"+(this.cellars.length+1));
        if (name) {
            await this.cdi.getKellermeisterService().createCellar(name);
            this.loadCellars();
        }
    }

    private async handleCellarWorkClick() {
        Router.go(router.urlForName('cellarwork-page', {cellarId: `${this.cdi?.getKellermeisterService().getCellarWorkId()}`}));
    }

    private handleLogoutClick() {
        console.log("handleLogoutClick");
        this.cdi.getSolidService().logout();
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                kellermeister-button {
                    flex: 1;
                    margin: 0 5px;
                    padding: 12px 16px;
                    background-color: transparent;
                    backdrop-filter: blur(10px);
                    color: yellow;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .dialog-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .dialog {
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
                    padding: 28px 24px 20px;
                    width: min(480px, 90vw);
                    color: #222;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .dialog h2 {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                }

                .dialog p {
                    margin: 0;
                    font-size: 14px;
                    color: #666;
                }

                .dialog-select,
                .dialog-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                    background: #f9f9f9;
                    color: #222;
                    font-size: 14px;
                    outline: none;
                }

                .dialog-select:focus,
                .dialog-input:focus {
                    border-color: #007aff;
                }

                .dialog-select:disabled,
                .dialog-input:disabled {
                    opacity: 0.5;
                }

                .dialog-error {
                    margin: 0;
                    font-size: 13px;
                    color: #d0021b;
                }

                .dialog-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 4px;
                }

                .dialog-btn {
                    padding: 8px 20px;
                    border-radius: 8px;
                    border: none;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .dialog-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .dialog-btn-cancel {
                    background: #e9e9e9;
                    color: #555;
                }

                .dialog-btn-ok {
                    background: #007aff;
                    color: #fff;
                }

                .dialog-btn-ok:hover:not(:disabled) {
                    opacity: 0.85;
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