import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { BaseComponent } from './common/base-component';

/**
 * Application element.
 */
@customElement('kellermeister-app')
export class KellermeisterApp extends BaseComponent {

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    render() {
        return html`
          <slot></slot>
        `;
    }

    static get styles() {
        return [
            ...super.styles,
            css`
            `
        ];
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'kellermeister-app': KellermeisterApp;
    }
}
