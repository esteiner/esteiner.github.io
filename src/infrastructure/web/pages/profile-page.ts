import { html, css } from 'lit';
import {customElement, state} from 'lit/decorators.js';
import { BasePage } from "../common/base-page.ts";
import '../components/kellermeister-header.ts';
import '../components/kellermeister-button.ts';
import '../components/kellermeister-footer.ts';
import {getDefaultSession, type Session} from "@inrupt/solid-client-authn-browser";
import {fetchLoginUserProfile, type SolidUserProfile} from "@noeldemartin/solid-utils";
import {CDI} from "../../cdi/CDI";
import {getBuildVersion} from "../utils";

@customElement('profile-page')
class ProfilePage extends BasePage {

    @state()
    session: Session = getDefaultSession();

    @state()
    solidUserProfile: SolidUserProfile | null | undefined;

    private cdi: CDI = CDI.getInstance();

    connectedCallback() {
        super.connectedCallback();
        this.fetchUserProfile();
    }

    async fetchUserProfile() {
        console.log("fetchUserProfile: session", this.session);
        if (this.session.info.webId != null) {
            this.solidUserProfile = await fetchLoginUserProfile(this.session.info.webId);
            console.log("fetchUserProfile: fetched login user profile", this.solidUserProfile);
        }
    }

    render() {
        return html`
          <kellermeister-header>Profil
              <kellermeister-button text="Logout" @click="${this.handleLogoutClick}" slot="actions" icon="logout" size="small"></kellermeister-button>
          </kellermeister-header>
          <main>
              <div class="section-header"><p>Solid Profil</p></div>
              <div class="card">
                  <div class="group">
                      <label>Name</label>
                      <span class="value">${this.solidUserProfile?.name}</span>
                  </div>
                  <div class="group">
                      <label>WebID</label>
                      <span class="value url">${this.session.info.webId}</span>
                  </div>
                  <div class="group">
                      <label>Storage</label>
                      <span class="value url">${this.solidUserProfile?.storageUrls}</span>
                  </div>
                  <div class="group">
                      <label>OIDC Issuer</label>
                      <span class="value url">${this.solidUserProfile?.oidcIssuerUrl}</span>
                  </div>
                  <div class="group">
                      <label>Public Index</label>
                      <span class="value url">${this.solidUserProfile?.publicTypeIndexUrl}</span>
                  </div>
                  <div class="group">
                      <label>Private Index</label>
                      <span class="value url">${this.solidUserProfile?.privateTypeIndexUrl}</span>
                  </div>
                  <div class="group">
                      <label>Session</label>
                      <span class="value url">${this.session.info.sessionId}</span>
                  </div>
              </div>
              <div class="section-header"><p>Kellermeister</p></div>
              <div class="card">
                  <div class="group">
                      <label>Version</label>
                      <span class="value">${getBuildVersion()}</span>
                  </div>
              </div>
              <div class="section-header"><p>Solid Apps</p></div>
              <div class="card">
                  <div class="group">
                      <label>Solid File Manager</label>
                      <div class="value"><a class="link" target="_blank" href="https://solid-file-manager.theodi.org/">https://solid-file-manager.theodi.org/</a></div>
                  </div>
                  <div class="group">
                      <label>SolidOS Databrowser</label>
                      <div class="value"><a class="link" target="_blank" href="https://solidos.github.io/mashlib/dist/browse.html">https://solidos.github.io/mashlib/dist/browse.html?</a></div>
                  </div>
              </div>
          </main>
          <footer>
              <kellermeister-footer></kellermeister-footer>
          </footer>
        `;
    }

    private handleLogoutClick() {
        console.log("handleLogoutClick");
        this.cdi.getSolidService().logout();
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                    background: var(--km-bg, #F7F5F1);
                }

                main {
                    padding: 16px;
                }

                .card {
                    background: var(--km-surface, #fff);
                    border-radius: 12px;
                    border: 1px solid var(--km-border, #E4DFD7);
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .group {
                    display: grid;
                    grid-template-columns: 110px 1fr;
                    gap: 4px;
                    padding: 10px 16px;
                    align-items: baseline;
                }

                .group:not(:last-child) {
                    border-bottom: 1px solid var(--km-border, #E4DFD7);
                }

                label {
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: var(--km-text-muted, #8A8278);
                }

                .value {
                    font-family: var(--app-font-family-monospace);
                    font-size: 11px;
                    word-break: break-all;
                    color: var(--km-text, #1A1917);
                }

                .link {
                    display: inline-block;
                    font-size: 11px;
                    color: var(--km-text, #1A1917);
                    text-decoration: none;
                    padding: 4px 0;
                }

                .link:hover {
                    text-decoration: underline;
                }
            `
        ];
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'profile-page': ProfilePage;
    }
}