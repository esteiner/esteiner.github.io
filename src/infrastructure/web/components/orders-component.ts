import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { BaseComponent } from "../common/base-component.ts";
import type { Order } from "../../../domain/Order/Order.ts";
import "./order-component.ts";

@customElement('orders-component')
class OrdersComponent extends BaseComponent {

    @property()
    month: Date | undefined;

    @property()
    orders: Order[] | undefined;

    constructor() {
        super();
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                    margin-bottom: 24px;
                }

                .section-header {
                    font-family: var(--app-font-family-display, 'Cormorant Garamond', Georgia, serif);
                    font-size: 17px;
                    font-weight: 500;
                    font-style: italic;
                    color: var(--app-color-primary, #3A6B28);
                    padding: 0 4px 8px 4px;
                    letter-spacing: 0.01em;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    background: var(--km-surface, white);
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--km-border, #E4DFD7);
                }

                order-component + order-component {
                    border-top: 1px solid var(--km-border, #E4DFD7);
                }
            `
        ];
    }

    protected render() {
        if (this.orders) {
            return html`
                <div class="section-header">${this.month?.toLocaleString('de-DE', {month: 'long'})} ${this.month?.getFullYear()}</div>
                <ul>
                    ${this.orders.map(
                            order => html`<order-component .order="${order}"></order-component>`
                    )}
                </ul>
            `;
        } else {
            return html`
                <div>no order</div>
            `;
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'orders-component': OrdersComponent;
    }
}