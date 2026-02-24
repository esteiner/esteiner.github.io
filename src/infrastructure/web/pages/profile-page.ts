import { html } from 'lit';
import {customElement, state} from 'lit/decorators.js';
import { BasePage } from "../common/base-page.ts";
import '../components/kellermeister-header.ts';
import '../components/kellermeister-button.ts';
import '../components/kellermeister-footer.ts';
import {getDefaultSession, type Session} from "@inrupt/solid-client-authn-browser";
import {fetchLoginUserProfile, type SolidUserProfile} from "@noeldemartin/solid-utils";

@customElement('profile-page')
class ProfilePage extends BasePage {

    @state()
    session: Session = getDefaultSession();

    @state()
    solidUserProfile: SolidUserProfile | null | undefined;

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
          <kellermeister-header>Kellermeister Profil</kellermeister-header>
          <main>
              <div>
                  WebId: ${this.session.info.webId}
              </div>
              <div>
                  Name: ${this.solidUserProfile?.name}
              </div>
              <div>
                  StorageUrls: ${this.solidUserProfile?.storageUrls}
              </div>
              <div>
                  WritableProfileUrl: ${this.solidUserProfile?.writableProfileUrl}
              </div>
              <div>
                  OIDCIssuerUrl: ${this.solidUserProfile?.oidcIssuerUrl}
              </div>
              <div>
                  PublicTypeIndexUrl: ${this.solidUserProfile?.publicTypeIndexUrl}
              </div>
              <div>
                  PrivateTypeIndexUrl: ${this.solidUserProfile?.privateTypeIndexUrl}
              </div>
              <div>
                  ClientAppId: ${this.session.info.clientAppId}
              </div>
              <div>
                  SessionId: ${this.session.info.sessionId}
              </div>
              <a target="_blank" href="https://solid-file-manager.theodi.org/">Solid File Manager</a>
          </main>
          <footer>
              <kellermeister-footer></kellermeister-footer>
          </footer>
        `;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'profile-page': ProfilePage;
    }
}