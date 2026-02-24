import { html } from "lit";
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

    protected render() {
        if (this.orders) {
            return html`
                <span>${this.month?.toLocaleString('de-DE', {month: 'long'})} ${this.month?.getFullYear()}</span>
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