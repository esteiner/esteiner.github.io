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
                .card1 {
                    display: flex;
                    justify-content: left;
                    align-items: center;
                    padding: 11px 16px;
                    min-height: 44px;
                }
                span {
                    padding-left: 8px;
                }
            `
        ];
    }

    protected render() {
        if (this.bottle) {
            return html`
                <div>
                    <div class="card1">
                        <slot name="count"></slot>
                        <span @click="${this.expandCollapseProduct}">${this.bottle.product.name}</span>
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