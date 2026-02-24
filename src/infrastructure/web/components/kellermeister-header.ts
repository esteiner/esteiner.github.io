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
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--app-color-primary);
                    margin: 0;
                }

               .header-btn {
                    background-color: transparent;
                    backdrop-filter: blur(10px);
                    color: #007aff;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    white-space: nowrap;
                }
               div {
                    padding: 10px 14px;
                    background-color: transparent;
                    backdrop-filter: blur(10px);
                    color: #007aff;
                    font-size: var(--app-font-size);
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    white-space: nowrap;
                }
                ::slotted([slot="actions"]) {
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                ::slotted(kellermeister-button) {
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    color: #007aff;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                .actions-container {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
            `
        ];
    }

    render() {
        return html`
            <h1 class="">
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