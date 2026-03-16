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
                    margin-bottom: 28px;
                }

                .section-header {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--app-color-primary);
                    text-transform: uppercase;
                    padding: 0 4px 6px 4px;
                    letter-spacing: 0.04em;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                }

                order-component + order-component {
                    border-top: 0.5px solid #C6C6C8;
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