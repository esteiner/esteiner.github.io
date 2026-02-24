import {customElement, property, state} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import {html, nothing} from "lit";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import "./product-component.ts";

@customElement('order-item-component')
class OrderItemComponent extends BaseComponent {

    @property()
    showOrderQuantity?: boolean;

    @property()
    orderItem: OrderItem | undefined;

    @state()
    expanded: boolean = false;

    constructor() {
        super();
    }

    protected render() {
        console.log("render: showOrderQuantity:", this.showOrderQuantity);
        return html`
            <div>
                <div class="collapsed">
                    ${this.showOrderQuantity ? html`<span> [${this.orderItem?.orderQuantity}]</span>` : nothing}
                    <span @click="${this.expandCollapseProduct}">${this.orderItem?.product?.name} (${this.orderItem?.product?.milliliter})</span>
                </div>
                ${this.expanded ? html`<product-component .product="${this.orderItem?.product}">${this.orderItem?.price}</product-component>`: nothing}
            </div>
        `;
    }

    private expandCollapseProduct() {
        this.expanded = !this.expanded;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'order-item-component': OrderItemComponent;
    }
}