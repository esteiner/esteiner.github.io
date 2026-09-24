import { css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { BaseComponent } from "../common/base-component.ts";
import "./order-component.ts";
import type {Order} from "../../../domain/Order/Order.ts";

@customElement('orders-component')
class OrdersComponent extends BaseComponent {

    @property()
    month: Date | undefined;

    @property()
    orders: Order[] | undefined;

    @state()
    private expanded: boolean = true;

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
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                    width: 100%;
                    background: none;
                    border: none;
                    margin: 0;
                    text-align: left;
                    cursor: pointer;
                    font-family: var(--app-font-family-display, 'Cormorant Garamond', Georgia, serif);
                    font-size: 17px;
                    font-weight: 500;
                    font-style: italic;
                    color: var(--app-color-primary, #3A6B28);
                    padding: 0 4px 8px 4px;
                    letter-spacing: 0.01em;
                }

                .chevron {
                    display: inline-block;
                    width: 1em;
                    font-style: normal;
                    transition: transform 0.2s ease;
                }

                .section-header[aria-expanded="true"] .chevron {
                    transform: rotate(90deg);
                }

                .count {
                    color: var(--km-text-muted, #8A857C);
                    font-style: normal;
                    font-size: 14px;
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
                <button class="section-header" aria-expanded="${this.expanded}" @click="${this.toggleExpanded}">
                    <span class="chevron" aria-hidden="true">▸</span>
                    <span>${this.month?.toLocaleString('de-DE', {month: 'long'})} ${this.month?.getFullYear()}</span>
                    ${this.expanded ? nothing : html`<span class="count">· ${this.orders.length}</span>`}
                </button>
                ${this.expanded ? html`
                    <ul>
                        ${this.orders.map(
                                order => html`<order-component .order="${order}"></order-component>`
                        )}
                    </ul>
                ` : nothing}
            `;
        } else {
            return html`
                <div>no order</div>
            `;
        }
    }

    private toggleExpanded() {
        this.expanded = !this.expanded;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'orders-component': OrdersComponent;
    }
}