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
                    justify-content: flex-start;
                    align-items: center;
                    padding: 8px 16px;
                    min-height: 48px;
                    gap: 12px;
                }

                .product-name {
                    flex: 1;
                    font-size: 15px;
                    font-weight: 400;
                    color: var(--km-text, #1A1917);
                    letter-spacing: 0.01em;
                    cursor: pointer;
                    line-height: 1.35;
                }

                .product-name:active {
                    opacity: 0.6;
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
                        <span class="product-name" @click="${this.expandCollapseProduct}">${this.bottle.product.name}</span>
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
