import { html, css } from 'lit';
import {customElement, state} from 'lit/decorators.js';
import { BasePage } from "../common/base-page.ts";
import '../components/kellermeister-header.ts';
import '../components/kellermeister-button.ts';
import '../components/kellermeister-footer.ts';
import {Router} from "@vaadin/router";
import {router} from "../router.ts";
import {getDefaultSession, type Session} from "@inrupt/solid-client-authn-browser";
import {fetchLoginUserProfile, type SolidUserProfile} from "@noeldemartin/solid-utils";
import {CDI} from "../../cdi/CDI";
import {getBuildVersion} from "../utils";
import {formatLastSync} from "../components/sync-status-format.ts";
import type {SyncStatus} from "../../../application/sync/SyncCoordinator.ts";
import type {Cellar} from "../../../domain/Cellar/Cellar.ts";

@customElement('profile-page')
class ProfilePage extends BasePage {

    @state()
    session: Session = getDefaultSession();

    @state()
    solidUserProfile: SolidUserProfile | null | undefined;

    @state()
    numberOfBottles: number | undefined;

    @state()
    private cellars: Cellar[] = [];

    @state()
    lastSyncedAt: Date | null = null;

    @state()
    private storedWebId: string | null = null;

    @state()
    private cellarToDelete: Cellar | null = null;

    @state()
    private cellarWithBottles: Cellar | null = null;

    private cdi: CDI = CDI.getInstance();
    private unsubscribe: (() => void) | null = null;

    connectedCallback() {
        super.connectedCallback();
        this.fetchUserProfile();
        const coordinator = this.cdi.getSyncCoordinator();
        this.lastSyncedAt = coordinator.getStatus().lastSyncedAt;
        this.unsubscribe = coordinator.onStatusChange((status: SyncStatus) => {
            this.lastSyncedAt = status.lastSyncedAt;
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.unsubscribe?.();
        this.unsubscribe = null;
    }

    async fetchUserProfile() {
        console.log("fetchUserProfile: session", this.session);
        // The persisted WebID lets us show it even without a live session.
        this.storedWebId = await this.cdi.getAppStateStore().getWebId();
        if (this.session.info.webId != null) {
            this.solidUserProfile = await fetchLoginUserProfile(this.session.info.webId);
            console.log("fetchUserProfile: fetched login user profile", this.solidUserProfile);
        }
        const bottles = await this.cdi.getKellermeisterService().getAllBottles();
        this.numberOfBottles = bottles.length;
        await this.loadCellars();
    }

    private async loadCellars() {
        // Local-first: all existing cellars, available with or without a session.
        // Hide cellars with a negative displayOrder (e.g. the well-known
        // cellarwork/altglass); a missing or zero displayOrder stays visible.
        const cellars = await this.cdi.getKellermeisterService().getAllCellars();
        this.cellars = cellars.filter(cellar => !(cellar.getDisplayOrder() < 0));
    }

    private async handleNewCellarClick() {
        const name: string | null = prompt("Name des neuen Kellers", "Keller-" + (this.cellars.length + 1));
        if (name) {
            await this.cdi.getKellermeisterService().createCellar(name);
            await this.loadCellars();
        }
    }

    private async handleDeleteCellarClick(cellar: Cellar) {
        const service = this.cdi.getKellermeisterService();
        if (await service.isCellarEmpty(cellar)) {
            // Empty: deletion is destructive — confirm via a styled dialog.
            this.cellarToDelete = cellar;
        } else {
            // Non-empty: cannot be deleted — inform via a styled dialog, offering
            // a link to the cellar so the user can empty it first.
            this.cellarWithBottles = cellar;
        }
    }

    private async handleDeleteConfirm() {
        const cellar = this.cellarToDelete;
        this.cellarToDelete = null;
        if (cellar) {
            await this.cdi.getKellermeisterService().removeCellar(cellar);
            await this.loadCellars();
        }
    }

    private handleDeleteCancel() {
        this.cellarToDelete = null;
    }

    private handleGoToCellar() {
        const cellar = this.cellarWithBottles;
        this.cellarWithBottles = null;
        if (cellar) {
            Router.go(router.urlForName('cellar-page', {cellarId: cellar.getId()}));
        }
    }

    private handleCannotDeleteClose() {
        this.cellarWithBottles = null;
    }

    render() {
        return html`
          ${this.cellarToDelete ? html`
              <div class="dialog-overlay" @click="${this.handleDeleteCancel}">
                  <div class="dialog" role="dialog" aria-modal="true" aria-label="Keller löschen" @click="${(e: Event) => e.stopPropagation()}">
                      <h2>Keller löschen</h2>
                      <p>Keller "${this.cellarToDelete.getName()}" wirklich löschen?</p>
                      <div class="dialog-actions">
                          <button class="dialog-btn dialog-btn-cancel" @click="${this.handleDeleteCancel}">Abbrechen</button>
                          <button class="dialog-btn dialog-btn-ok" @click="${this.handleDeleteConfirm}">Löschen</button>
                      </div>
                  </div>
              </div>
          ` : ''}
          ${this.cellarWithBottles ? html`
              <div class="dialog-overlay" @click="${this.handleCannotDeleteClose}">
                  <div class="dialog" role="dialog" aria-modal="true" aria-label="Löschen nicht möglich" @click="${(e: Event) => e.stopPropagation()}">
                      <h2>Löschen nicht möglich</h2>
                      <p>Keller "${this.cellarWithBottles.getName()}" enthält noch Flaschen und kann nicht gelöscht werden. Buche zuerst alle Flaschen um.</p>
                      <div class="dialog-actions">
                          <button class="dialog-btn dialog-btn-cancel" @click="${this.handleCannotDeleteClose}">Schliessen</button>
                          <button class="dialog-btn dialog-btn-ok" @click="${this.handleGoToCellar}">Zum Keller</button>
                      </div>
                  </div>
              </div>
          ` : ''}
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
                      <span class="value url">${this.session.info.webId ?? this.storedWebId}</span>
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
                  <div class="group">
                      <label>Last Sync</label>
                      <span class="value">${this.lastSyncedAt ? formatLastSync(this.lastSyncedAt) : "Nur lokal"}</span>
                  </div>
              </div>
              <div class="section-header"><p>Kellermeister</p></div>
              <div class="card">
                  <div class="group">
                      <label>Version</label>
                      <span class="value">${getBuildVersion()}</span>
                  </div>
                  <div class="group">
                      <label>Flaschen</label>
                      <span class="value">${this.numberOfBottles}</span>
                  </div>
                  <div class="group group-keller">
                      <label>Keller</label>
                      <span class="value">
                          ${this.cellars.length > 0
                              ? html`<div class="cellar-list">
                                  ${this.cellars.map(cellar => html`
                                      <span class="cellar-name">${cellar.getName()}</span>
                                      <kellermeister-button icon="trash" size="small" @click="${() => this.handleDeleteCellarClick(cellar)}"></kellermeister-button>
                                  `)}
                                </div>`
                              : "Keine Keller"}
                      </span>
                      <kellermeister-button icon="plus" text="neuer Keller" @click="${this.handleNewCellarClick}" size="small" ghost></kellermeister-button>
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
                      <div class="value"><a class="link" target="_blank" href="https://solidos.github.io/mashlib/dist/browse.html?uri=${this.solidUserProfile?.storageUrls}">https://solidos.github.io/mashlib/dist/browse.html</a></div>
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

                /* Confirmation dialog — styled in analogy to the landing page's WebID dialog. */
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

                .dialog-btn-cancel {
                    background: var(--km-bg, #F7F5F1);
                    color: var(--km-text-muted, #8A8278);
                    border: 1px solid var(--km-border, #E4DFD7);
                }

                .dialog-btn-ok {
                    background: var(--app-color-primary, #3A6B28);
                    color: #fff;
                }

                .dialog-btn-ok:hover {
                    opacity: 0.85;
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

                /* Keller group: label, cellar list, and an add-cellar action on the right. */
                .group-keller {
                    grid-template-columns: 110px 1fr auto;
                }

                .group-keller kellermeister-button {
                    align-self: center;
                }

                /* Each cellar row: name with a delete button right behind it. */
                /* Shared grid so names size to one column and the delete
                   buttons line up in the next column, right after the names. */
                .cellar-list {
                    display: grid;
                    grid-template-columns: max-content max-content;
                    align-items: center;
                    column-gap: 8px;
                    row-gap: 4px;
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