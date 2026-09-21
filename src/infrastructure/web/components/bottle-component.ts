import {css, html, nothing} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {BaseComponent} from "../common/base-component.ts";
import "./product-component.ts";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";
import pencilIcon from "../images/icons/pencil.svg?raw";

@customElement('bottle-component')
class BottleComponent extends BaseComponent {

    @property()
    bottle: Bottle | undefined;

    @property()
    expandable: boolean = true;

    @state()
    expanded: boolean = false;

    @state()
    editing: boolean = false;

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

                .edit-button {
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    border: none;
                    background: transparent;
                    color: var(--km-text-muted, #8A8278);
                    cursor: pointer;
                    border-radius: 8px;
                }

                .edit-button.active {
                    color: var(--app-color-primary, #3A6B28);
                }

                .edit-button:active {
                    opacity: 0.6;
                }

                .edit-button svg {
                    width: 18px;
                    height: 18px;
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
                        <span class="product-name" @click="${this.expandCollapseProduct}">${this.bottle.getProduct().getName()}</span>
                        ${this.expanded ? html`
                            <button
                                class="edit-button ${this.editing ? 'active' : ''}"
                                title="Bearbeiten"
                                aria-label="Bearbeiten"
                                @click="${this.toggleEditing}"
                            >${unsafeHTML(pencilIcon)}</button>
                        ` : nothing}
                    </div>
                    ${this.expanded ? html`
                        <product-component
                            .product="${this.bottle.getProduct()}"
                            .editing="${this.editing}"
                            @product-name-changed="${() => this.requestUpdate()}"
                        ><slot></slot></product-component>
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
        if (this.expandable) {
            this.expanded = !this.expanded;
            // Collapsing always leaves edit mode, so re-expanding starts read-only.
            if (!this.expanded) {
                this.editing = false;
            }
        }
    }

    private toggleEditing(event: Event) {
        // Do not let the click bubble to the header, which would collapse the row.
        event.stopPropagation();
        this.editing = !this.editing;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'bottle-component': BottleComponent;
    }
}
