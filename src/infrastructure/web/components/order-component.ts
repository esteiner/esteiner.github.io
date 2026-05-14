import {css, html} from "lit";
import {customElement, property} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import type {SolidOrder} from "../../../domain/Order/SolidOrder.ts";
import type {SolidOrderItem} from "../../../domain/Order/SolidOrderItem.ts";
import "./order-item-component.ts";

const showOrderQuantity: boolean = true;

@customElement('order-component')
class OrderComponent extends BaseComponent {

    @property()
    order: SolidOrder | undefined;

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

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                li {
                    list-style: none;
                    display: block;
                    background: var(--km-surface, white);
                }

                li:not(:last-child) {
                    border-bottom: 1px solid var(--km-border, #E4DFD7);
                }
            `
        ];
    }

    protected render() {
        if (this.order && this.order.positions) {
            return html`
                <ul>
                ${this.order.positions.map(
                    (orderItem: SolidOrderItem) => html`
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