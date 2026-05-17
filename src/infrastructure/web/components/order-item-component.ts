import {customElement, property, state} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import {css, html, nothing} from "lit";
import "./product-component.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";

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

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                }
                .bottle-button {
                    background: #E5E5EA;
                    color: #3C3C43;
                    border: none;
                    border-radius: 10px;
                    padding: 2px 8px;
                    font-size: 13px;
                    font-weight: 600;
                    min-width: 24px;
                    cursor: pointer;
                }
                .collapsed {
                    display: flex;
                    align-items: center;
                    padding: 11px 16px;
                    min-height: 44px;
                    gap: 8px;
                }
            `
        ];
    }

    protected render() {
        return html`
            <div>
                <div class="collapsed">
                    ${this.showOrderQuantity ? html`<button class="bottle-button">${this.orderItem?.getOrderQuantity()}</button>` : nothing}
                    <span @click="${this.expandCollapseProduct}">${this.orderItem?.getProduct()?.getName()}</span>
                </div>
                ${this.expanded ? html`<product-component .product="${this.orderItem?.getProduct()}">${this.orderItem?.getPrice()} ${this.orderItem?.getPriceCurrency()}</product-component>`: nothing}
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