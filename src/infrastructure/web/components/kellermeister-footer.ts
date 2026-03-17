import {customElement} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import {css, html} from "lit";
import {Router} from "@vaadin/router";
import {router} from "../router.ts";

@customElement('kellermeister-footer')
class KellermeisterFooter extends BaseComponent {

    private handleOverviewClick() {
        Router.go(router.urlForName('landing-page'));
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
            `
        ];
    }

    render() {
        return html`
            <kellermeister-button text="Übersicht" @click="${this.handleOverviewClick}" icon="house" size="small"></kellermeister-button>
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