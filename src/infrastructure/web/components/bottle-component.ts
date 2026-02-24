import {css, html, nothing} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import "./product-component.ts";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";

@customElement('bottle-component')
class BottleComponent extends BaseComponent {

    @property()
    bottle: Bottle | undefined;

    @state()
    expanded: boolean = false;

    constructor() {
        super();
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                button {
                    background-color: transparent;
                    color: grey;
                    border: none;
                }
                .card1 {
                    background: #f8f9fa;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    margin: 15px;
                }
            `
        ];
    }

    protected render() {
        if (this.bottle) {
            return html`
                <div>
                    <div class="card1">
                        <span @click="${this.expandCollapseProduct}">${this.bottle.product.name}</span>
                        <slot name="count"></slot>
                    </div>
                    ${this.expanded ? html`
                        <product-component .product="${this.bottle.product}"><slot></slot></product-component>
                    `
                    : nothing
                    }
                </div>
            `;
        } else {
            return html`
                <div>no product</div>
            `;
        }
    }

    private expandCollapseProduct() {
        this.expanded = !this.expanded;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'bottle-component': BottleComponent;
    }
}