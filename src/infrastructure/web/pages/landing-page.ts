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

    private async getWebID(): Promise<WebIDProfile | null> {
        const input: string | null = prompt('Enter your WebID to login', 'http://localhost:3000/edwin/profile/card#me');

        if (input) {
            try {
                const webID: URL = new URL(input);
                const webIDProfile: WebIDProfile | null = await this.cdi.getSolidService().getWebIDProfile(webID);
                if (webIDProfile) {
                    return webIDProfile;
                } else {
                    alert(`Kein WebID Profil Dokument gefunden. Ist ${webID} wirklich die WebID?`);
                }
            } catch (e) {
                console.log("getWebID: failed with error:", e);
            }
        }
        return null;
    }

    private async handleNewCellarClick() {
        const name: string | null = prompt("Name des neuen Kellers", "Keller"+(this.cellars.length+1));
        if (name) {
            const newCellar = await this.cdi.getKellermeisterService().createCellar(name);
            this.cellars.push(newCellar);
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
            `
        ];
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'landing-page': LandingPage;
    }
}