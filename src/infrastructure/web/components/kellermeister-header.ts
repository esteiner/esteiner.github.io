import {css, html} from "lit";
import {customElement, state} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import {getDefaultSession, Session} from "@inrupt/solid-client-authn-browser";

@customElement('kellermeister-header')
class KellermeisterHeader extends BaseComponent {

    @state()
    session: Session = getDefaultSession();

    static get styles() {
        return [
            ...super.styles,
            css`
                h1 {
                    font-family: var(--app-font-family-display);
                    font-style: italic;
                    font-size: 24px;
                    font-weight: 400;
                    color: var(--app-color-primary, #3A6B28);
                    margin: 0;
                }

                .actions-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                ::slotted([slot="actions"]) {
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                    text-decoration: none;
                }

                ::slotted(kellermeister-button) {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--app-color-primary, #3A6B28);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                }
            `
        ];
    }

    render() {
        return html`
            <h1>
                <slot></slot>
            </h1>
            <div class="actions-container">
                <slot name="actions"></slot>
            </div>
        `;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'kellermeister-header': KellermeisterHeader;
    }
}
