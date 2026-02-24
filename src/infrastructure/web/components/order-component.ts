import {html} from "lit";
import {customElement, property} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import type {Order} from "../../../domain/Order/Order.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import "./order-item-component.ts";

const showOrderQuantity: boolean = true;

@customElement('order-component')
class OrderComponent extends BaseComponent {

    @property()
    order: Order | undefined;

    constructor() {
        super();
    }

    protected render() {
        if (this.order && this.order.positions) {
            return html`
                <ul>
                ${this.order.positions.map(
                    (orderItem: OrderItem) => html`
                        <li>
                            <order-item-component .showOrderQuantity=${showOrderQuantity} .orderItem="${orderItem}"></order-item-component>
                        </li>
                    `
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
        'order-component': OrderComponent;
    }
}